from datetime import datetime, timezone
import json
import secrets
import uuid
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, create_bearer_token
from app.core.config import get_settings
from app.core.redis_client import redis_client
from app.db.database import SessionLocal
from app.models.connect_user import ConnectUser
from app.models.social_account import SocialAccount
from app.services.connect_auth_service import (
    consume_auth_token,
    create_auth_token,
    get_user_by_email,
    get_user_by_tenant,
    mark_user_active,
    register_connect_user,
    send_password_reset_email,
    send_registration_emails,
    hash_password,
    verify_password,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth")
settings = get_settings()


class WebViewCodeCreateResponse(BaseModel):
    code: str
    expires_in: int
    url: str


class WebViewCodeExchangeRequest(BaseModel):
    code: str = Field(min_length=8)


class SessionRead(BaseModel):
    authenticated: bool
    tenant_id: str
    user_id: str
    role: Optional[str] = None
    is_admin: bool
    status: Optional[str] = None
    email_verified: Optional[bool] = None


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    phone: str = Field(min_length=7, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    message: str
    status: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginResponse(BaseModel):
    token: str
    authenticated: bool
    tenant_id: str
    user_id: str
    status: str


class TokenRequest(BaseModel):
    token: str = Field(min_length=16)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=16)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class ApproveAccessResponse(BaseModel):
    message: str
    status: str


class AdminUserRead(BaseModel):
    id: str
    tenant_id: str
    email: str
    phone: str
    status: str
    is_admin: bool
    email_verified: bool
    max_social_accounts: int
    connected_social_accounts: int
    max_monthly_posts: int
    created_at: datetime
    updated_at: datetime


class AdminUserLimitsUpdate(BaseModel):
    max_social_accounts: int = Field(ge=0, le=1000)
    max_monthly_posts: int = Field(ge=0, le=100000)


class AdminUserStatusResponse(BaseModel):
    message: str
    user: AdminUserRead


def _db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def _create_user_token(user) -> str:
    return create_bearer_token(
        tenant_id=user.tenant_id,
        subject=user.id,
        is_admin=bool(user.is_admin),
        extra_claims={
            "email": user.email,
            "connect_status": user.status,
        },
    )


def _require_admin(user: CurrentUser) -> CurrentUser:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return user


def _admin_user_read(db: Session, user: ConnectUser) -> AdminUserRead:
    connected_count = db.query(SocialAccount).filter(SocialAccount.tenant_id == user.tenant_id).count()
    return AdminUserRead(
        id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        phone=user.phone,
        status=user.status,
        is_admin=bool(user.is_admin),
        email_verified=bool(user.email_verified_at),
        max_social_accounts=user.max_social_accounts,
        connected_social_accounts=connected_count,
        max_monthly_posts=user.max_monthly_posts,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _get_admin_target_user(db: Session, user_id: str) -> ConnectUser:
    user = db.query(ConnectUser).filter(ConnectUser.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def _admin_approval_redirect(message: str) -> RedirectResponse:
    return RedirectResponse(
        f"{settings.frontend_url}/login?{urlencode({'approval': message})}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


def _auth_google_state_key(nonce: str) -> str:
    return f"connect_google_auth_state:{nonce}"


def _safe_frontend_next(value: Optional[str]) -> str:
    if not value or not value.startswith("/") or value.startswith("//"):
        return "/"
    return value


def _google_auth_redirect(params: Dict[str, str]) -> RedirectResponse:
    return RedirectResponse(
        f"{settings.frontend_url}/login?{urlencode(params)}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


def _frontend_redirect_url(next_path: Optional[str]) -> str:
    return f"{settings.frontend_url}{_safe_frontend_next(next_path)}"


def _connect_google_authorization_url(nonce: str) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.connect_google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": nonce,
        "access_type": "online",
        "prompt": "select_account",
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?{0}".format(urlencode(params))


def _exchange_connect_google_code(code: str) -> dict:
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_SECRET,
            "redirect_uri": settings.connect_google_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google sign-in failed during token exchange.")
    return response.json()


def _fetch_connect_google_profile(access_token: str) -> dict:
    response = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google sign-in failed while loading profile.")
    return response.json()


def _get_or_create_google_user(db: Session, profile: dict) -> ConnectUser:
    email = str(profile.get("email") or "").strip().lower()
    email_verified = bool(profile.get("email_verified"))
    if not email or not email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account email must be verified.")

    user = get_user_by_email(db, email)
    now = datetime.now(timezone.utc)
    if user:
        if not user.email_verified_at:
            user.email_verified_at = now
        user.updated_at = now
        return user

    user_id = str(uuid.uuid4())
    user = ConnectUser(
        id=user_id,
        tenant_id=f"connect_{user_id}",
        email=email,
        phone="",
        password_hash=hash_password(secrets.token_urlsafe(32)),
        status="pending_review" if settings.CONNECT_REVIEW_REQUIRED else "active",
        is_admin=False,
        max_social_accounts=settings.CONNECT_DEFAULT_MAX_SOCIAL_ACCOUNTS,
        max_monthly_posts=settings.CONNECT_DEFAULT_MAX_MONTHLY_POSTS,
        email_verified_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.flush()
    return user


def _webview_code_key(code: str) -> str:
    return f"webview_auth:{code}"


def _webview_code_used_key(code: str) -> str:
    return f"webview_auth_used:{code}"


def _serialize_webview_payload(user: CurrentUser) -> str:
    payload: Dict[str, Any] = {
        "tenant_id": user.tenant_id,
        "user_id": user.subject,
        "role": user.role,
        "is_admin": user.is_admin,
        "claims": user.claims,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return json.dumps(payload)


def _deserialize_webview_payload(raw: str) -> Dict[str, Any]:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webview auth payload",
        ) from exc
    return payload


@router.get("/google/login")
def google_auth_login(next: Optional[str] = Query(default="/")):
    nonce = secrets.token_urlsafe(24)
    payload = json.dumps({"next": _safe_frontend_next(next)})
    try:
        redis_client.setex(_auth_google_state_key(nonce), 600, payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is temporarily unavailable. Please try again.",
        ) from exc

    return RedirectResponse(
        _connect_google_authorization_url(nonce),
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.get("/google/callback")
def google_auth_callback(
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    db: Session = Depends(_db_session),
):
    if error:
        return _google_auth_redirect({"google_auth": "error", "message": f"Google sign-in cancelled: {error}"})
    if not code or not state:
        return _google_auth_redirect({"google_auth": "error", "message": "Google sign-in did not return a valid code."})

    try:
        raw_state = redis_client.get(_auth_google_state_key(state))
        redis_client.delete(_auth_google_state_key(state))
    except Exception:
        return _google_auth_redirect({"google_auth": "error", "message": "Google sign-in state could not be verified."})

    if not raw_state:
        return _google_auth_redirect({"google_auth": "error", "message": "Google sign-in state expired. Please try again."})

    try:
        state_payload = json.loads(raw_state)
    except (TypeError, json.JSONDecodeError):
        state_payload = {"next": "/"}

    try:
        tokens = _exchange_connect_google_code(code)
        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google did not return an access token.")
        profile = _fetch_connect_google_profile(access_token)
        user = _get_or_create_google_user(db, profile)
        if user.status == "blocked":
            db.rollback()
            return _google_auth_redirect({"google_auth": "error", "message": "This account is not available."})
        db.commit()
        db.refresh(user)
    except HTTPException as exc:
        db.rollback()
        return _google_auth_redirect({"google_auth": "error", "message": str(exc.detail)})
    except Exception:
        db.rollback()
        return _google_auth_redirect({"google_auth": "error", "message": "Google sign-in failed. Please try again."})

    token = _create_user_token(user)
    redirect = RedirectResponse(
        _frontend_redirect_url(state_payload.get("next")),
        status_code=status.HTTP_303_SEE_OTHER,
    )
    _set_session_cookie(redirect, token)
    return redirect


@router.get("/session", response_model=SessionRead)
def read_session(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(_db_session),
):
    connect_user = get_user_by_tenant(db, user.tenant_id)
    return {
        "authenticated": True,
        "tenant_id": user.tenant_id,
        "user_id": user.subject,
        "role": user.role,
        "is_admin": user.is_admin,
        "status": connect_user.status if connect_user else None,
        "email_verified": bool(connect_user.email_verified_at) if connect_user else None,
    }


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(_db_session)):
    if not settings.CONNECT_PUBLIC_REGISTRATION_ENABLED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is currently closed.")
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    user, verification_token, approval_token = register_connect_user(
        db,
        email=payload.email,
        phone=payload.phone,
        password=payload.password,
    )
    db.flush()
    try:
        send_registration_emails(user, verification_token, approval_token)
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    db.commit()
    return {
        "message": "Registration received. Please verify your email to continue.",
        "status": user.status,
    }


@router.post("/verify-email")
def verify_email(payload: TokenRequest, db: Session = Depends(_db_session)):
    user = consume_auth_token(db, payload.token, "email_verification")
    user.email_verified_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    if user.status == "pending_review" and not settings.CONNECT_REVIEW_REQUIRED:
        mark_user_active(user)
    db.commit()
    return {
        "message": (
            "Email verified. Your account is pending review for beta access."
            if user.status == "pending_review"
            else "Email verified. You can now sign in."
        ),
        "status": user.status,
    }


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(_db_session)):
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if user.status == "blocked":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not available.")
    if not user.email_verified_at:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before signing in.")

    token = _create_user_token(user)
    _set_session_cookie(response, token)
    return {
        "token": token,
        "authenticated": True,
        "tenant_id": user.tenant_id,
        "user_id": user.id,
        "status": user.status,
    }


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(_db_session)):
    user = get_user_by_email(db, payload.email)
    if user:
        token = create_auth_token(db, user.id, "password_reset", settings.CONNECT_PASSWORD_RESET_TTL_MINUTES)
        db.flush()
        try:
            send_password_reset_email(user, token)
        except RuntimeError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        db.commit()
    return {"message": "If this email exists, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(_db_session)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")
    user = consume_auth_token(db, payload.token, "password_reset")

    user.password_hash = hash_password(payload.password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password updated. You can now sign in."}


@router.get("/admin/users", response_model=List[AdminUserRead])
def list_admin_users(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(_db_session),
):
    _require_admin(current_user)
    users = db.query(ConnectUser).order_by(ConnectUser.created_at.desc()).all()
    return [_admin_user_read(db, user) for user in users]


@router.post("/admin/users/{user_id}/approve", response_model=AdminUserStatusResponse)
def approve_admin_user(
    user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(_db_session),
):
    _require_admin(current_user)
    user = _get_admin_target_user(db, user_id)
    mark_user_active(user)
    db.commit()
    db.refresh(user)
    return {"message": f"Approved {user.email}.", "user": _admin_user_read(db, user)}


@router.post("/admin/users/{user_id}/suspend", response_model=AdminUserStatusResponse)
def suspend_admin_user(
    user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(_db_session),
):
    _require_admin(current_user)
    user = _get_admin_target_user(db, user_id)
    if user.is_admin and user.id == current_user.subject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot suspend your own admin account.")
    user.status = "blocked"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return {"message": f"Suspended {user.email}.", "user": _admin_user_read(db, user)}


@router.patch("/admin/users/{user_id}/limits", response_model=AdminUserStatusResponse)
def update_admin_user_limits(
    user_id: str,
    payload: AdminUserLimitsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(_db_session),
):
    _require_admin(current_user)
    user = _get_admin_target_user(db, user_id)
    user.max_social_accounts = payload.max_social_accounts
    user.max_monthly_posts = payload.max_monthly_posts
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return {"message": f"Updated limits for {user.email}.", "user": _admin_user_read(db, user)}


@router.get("/approve-access")
def approve_access(
    token: str = Query(min_length=16),
    db: Session = Depends(_db_session),
):
    try:
        user = consume_auth_token(db, token, "beta_access_approval")
    except HTTPException as exc:
        return _admin_approval_redirect(
            "This approval link is invalid or expired. Please use a fresh registration email."
        )

    mark_user_active(user)
    db.commit()
    return _admin_approval_redirect(f"Approved access for {user.email}.")


@router.post("/webview/create-code", response_model=WebViewCodeCreateResponse)
def create_webview_code(
    user: CurrentUser = Depends(get_current_user),
):
    code = secrets.token_urlsafe(24)
    redis_client.delete(_webview_code_used_key(code))
    redis_client.setex(
        _webview_code_key(code),
        settings.WEBVIEW_AUTH_CODE_TTL_SECONDS,
        _serialize_webview_payload(user),
    )

    exchange_url = (
        f"{settings.frontend_url}/webview-auth"
        f"?code={code}"
    )
    return {
        "code": code,
        "expires_in": settings.WEBVIEW_AUTH_CODE_TTL_SECONDS,
        "url": exchange_url,
    }


@router.post("/webview/exchange", response_model=SessionRead)
def exchange_webview_code(
    payload: WebViewCodeExchangeRequest,
    response: Response,
):
    key = _webview_code_key(payload.code)
    raw = redis_client.get(key)
    if not raw:
        used_marker = redis_client.get(_webview_code_used_key(payload.code))
        detail = (
            "This WebView sign-in link was already used. Please open a fresh link from the app."
            if used_marker
            else "This WebView sign-in link is invalid or expired. Please request a new one."
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

    redis_client.delete(key)
    redis_client.setex(
        _webview_code_used_key(payload.code),
        settings.WEBVIEW_AUTH_CODE_TTL_SECONDS,
        "used",
    )
    data = _deserialize_webview_payload(raw)
    token = create_bearer_token(
        tenant_id=str(data["tenant_id"]),
        subject=str(data["user_id"]),
        is_admin=bool(data.get("is_admin")),
        extra_claims=data.get("claims") if isinstance(data.get("claims"), dict) else None,
    )

    _set_session_cookie(response, token)

    return {
        "authenticated": True,
        "tenant_id": str(data["tenant_id"]),
        "user_id": str(data["user_id"]),
        "role": data.get("role"),
        "is_admin": bool(data.get("is_admin")),
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return None
