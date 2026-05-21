from datetime import datetime, timedelta
import hashlib
import hmac
import secrets
import uuid
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.auth_token import AuthToken
from app.models.connect_user import ConnectUser
from app.services.email_service import admin_recipients, send_email

PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 260000


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"{PASSWORD_ALGORITHM}${PASSWORD_ITERATIONS}${salt}${digest}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != PASSWORD_ALGORITHM:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        ).hex()
        return hmac.compare_digest(digest, expected)
    except Exception:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_auth_token(db: Session, user_id: str, purpose: str, ttl_minutes: int) -> str:
    token = secrets.token_urlsafe(32)
    db.add(
        AuthToken(
            user_id=user_id,
            purpose=purpose,
            token_hash=hash_token(token),
            expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
            created_at=datetime.utcnow(),
        )
    )
    return token


def mark_user_active(user: ConnectUser) -> ConnectUser:
    user.status = "active"
    user.updated_at = datetime.utcnow()
    return user


def get_user_by_email(db: Session, email: str) -> Optional[ConnectUser]:
    return db.query(ConnectUser).filter(ConnectUser.email == normalize_email(email)).first()


def get_user_by_tenant(db: Session, tenant_id: str) -> Optional[ConnectUser]:
    return db.query(ConnectUser).filter(ConnectUser.tenant_id == tenant_id).first()


def consume_auth_token(db: Session, token: str, purpose: str) -> ConnectUser:
    token_row = (
        db.query(AuthToken)
        .filter(
            AuthToken.token_hash == hash_token(token),
            AuthToken.purpose == purpose,
            AuthToken.used_at.is_(None),
        )
        .first()
    )
    if token_row is None or token_row.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This link is invalid or expired. Please request a new one.",
        )

    user = db.query(ConnectUser).filter(ConnectUser.id == token_row.user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found.")

    token_row.used_at = datetime.utcnow()
    return user


def register_connect_user(
    db: Session,
    *,
    email: str,
    phone: str,
    password: str,
) -> Tuple[ConnectUser, str, Optional[str]]:
    settings = get_settings()
    normalized_email = normalize_email(email)
    if get_user_by_email(db, normalized_email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email.")

    user_id = str(uuid.uuid4())
    user = ConnectUser(
        id=user_id,
        tenant_id=f"connect_{user_id}",
        email=normalized_email,
        phone=phone.strip(),
        password_hash=hash_password(password),
        status="pending_review" if settings.CONNECT_REVIEW_REQUIRED else "active",
        is_admin=False,
        max_social_accounts=settings.CONNECT_DEFAULT_MAX_SOCIAL_ACCOUNTS,
        max_monthly_posts=settings.CONNECT_DEFAULT_MAX_MONTHLY_POSTS,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()
    verification_token = create_auth_token(db, user.id, "email_verification", settings.CONNECT_EMAIL_TOKEN_TTL_MINUTES)
    approval_token = None
    if settings.CONNECT_REVIEW_REQUIRED:
        approval_token = create_auth_token(db, user.id, "beta_access_approval", settings.CONNECT_EMAIL_TOKEN_TTL_MINUTES)
    return user, verification_token, approval_token


def send_registration_emails(
    user: ConnectUser,
    verification_token: str,
    approval_token: Optional[str] = None,
) -> None:
    settings = get_settings()
    verify_url = f"{settings.frontend_url}/verify-email?token={verification_token}"

    send_email(
        recipients=[user.email],
        subject="Verify your Snapkey Connect account",
        body=(
            "Hello,\n\n"
            "Please verify your Snapkey Connect account by opening this secure link:\n\n"
            f"{verify_url}\n\n"
            "After verification, your account will be reviewed for beta access.\n\n"
            "Thanks,\n"
            "Snapkey Team"
        ),
        fail_silently=False,
    )

    recipients = admin_recipients()
    approval_url = (
        f"{settings.backend_public_url}{settings.API_V1_STR}/auth/approve-access?token={approval_token}"
        if approval_token
        else None
    )
    if recipients or approval_token:
        send_email(
            recipients=recipients,
            subject="New Snapkey Connect registration",
            body=(
                "New Snapkey Connect registration\n\n"
                f"Email: {user.email}\n"
                f"Phone: {user.phone}\n"
                f"Connect User ID: {user.id}\n"
                f"Workspace / Tenant ID: {user.tenant_id}\n"
                f"Status: {user.status}\n"
                f"Registered at: {user.created_at.isoformat()}\n"
                + (
                    f"\nApproval link:\n{approval_url}\n"
                    if approval_url
                    else ""
                )
                + "\n"
                "Password is not included and is stored only as a secure hash."
            ),
            fail_silently=not bool(approval_token),
        )


def send_password_reset_email(user: ConnectUser, reset_token: str) -> None:
    settings = get_settings()
    reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
    send_email(
        recipients=[user.email],
        subject="Reset your Snapkey Connect password",
        body=(
            "Hello,\n\n"
            "Use this secure link to reset your Snapkey Connect password:\n\n"
            f"{reset_url}\n\n"
            "This link expires soon. If you did not request this, you can ignore this email.\n\n"
            "Thanks,\n"
            "Snapkey Team"
        ),
        fail_silently=False,
    )
