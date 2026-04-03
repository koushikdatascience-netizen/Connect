import base64
import hashlib
import secrets
from urllib.parse import urlencode
from fastapi import APIRouter, Cookie, HTTPException, Query, status

import requests
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.services.oauth_service import save_social_account

router = APIRouter()
settings = get_settings()


def _build_state(tenant_id):
    nonce = secrets.token_urlsafe(16)
    return "{0}:{1}".format(tenant_id, nonce)


def _extract_tenant_from_state(state):
    if not state or ":" not in state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        )
    return state.split(":", 1)[0]


def _raise_provider_error(provider, response):
    try:
        payload = response.json()
    except Exception:
        payload = response.text

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "provider": provider,
            "status_code": response.status_code,
            "response": payload,
        },
    )


@router.get("/facebook/login")
def facebook_login(tenant_id: str = Query(...)):
    state = _build_state(tenant_id)
    params = {
        "client_id": settings.FACEBOOK_CLIENT_ID,
        "redirect_uri": settings.facebook_redirect_uri,
        "state": state,
        "scope": "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
    }
    url = "https://www.facebook.com/v18.0/dialog/oauth?{0}".format(urlencode(params))
    return RedirectResponse(url)


@router.get("/facebook/callback")
def facebook_callback(code: str = Query(...), state: str = Query(...)):
    tenant_id = _extract_tenant_from_state(state)

    token_params = {
        "client_id": settings.FACEBOOK_CLIENT_ID,
        "client_secret": settings.FACEBOOK_SECRET,
        "redirect_uri": settings.facebook_redirect_uri,
        "code": code,
    }
    token_response = requests.get(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        params=token_params,
        timeout=30,
    )
    if not token_response.ok:
        _raise_provider_error("facebook", token_response)

    token_data = token_response.json()
    access_token = token_data["access_token"]

    pages_response = requests.get(
        "https://graph.facebook.com/v18.0/me/accounts",
        params={"access_token": access_token},
        timeout=30,
    )
    if not pages_response.ok:
        _raise_provider_error("facebook", pages_response)

    pages = pages_response.json()
    saved_accounts = []

    for page in pages.get("data", []):
        account = save_social_account(
            tenant_id=tenant_id,
            platform="facebook",
            platform_account_id=page["id"],
            account_name=page["name"],
            access_token=page["access_token"],
        )
        saved_accounts.append({
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "account_name": account.account_name,
        })

    return {"message": "Facebook connected", "accounts": saved_accounts}


@router.get("/instagram/login")
def instagram_login(tenant_id: str = Query(...)):
    state = _build_state(tenant_id)
    params = {
        "client_id": settings.FACEBOOK_CLIENT_ID,
        "redirect_uri": settings.instagram_redirect_uri,
        "state": state,
        "scope": "instagram_basic,instagram_content_publish,pages_show_list",
    }
    url = "https://www.facebook.com/v18.0/dialog/oauth?{0}".format(urlencode(params))
    return RedirectResponse(url)


@router.get("/instagram/callback")
def instagram_callback(code: str = Query(...), state: str = Query(...)):
    tenant_id = _extract_tenant_from_state(state)

    token_params = {
        "client_id": settings.FACEBOOK_CLIENT_ID,
        "client_secret": settings.FACEBOOK_SECRET,
        "redirect_uri": settings.instagram_redirect_uri,
        "code": code,
    }
    token_response = requests.get(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        params=token_params,
        timeout=30,
    )
    if not token_response.ok:
        _raise_provider_error("instagram", token_response)

    token_data = token_response.json()
    access_token = token_data["access_token"]

    pages_response = requests.get(
        "https://graph.facebook.com/v18.0/me/accounts",
        params={"access_token": access_token},
        timeout=30,
    )
    if not pages_response.ok:
        _raise_provider_error("instagram", pages_response)

    pages = pages_response.json()
    saved_accounts = []

    for page in pages.get("data", []):
        account = save_social_account(
            tenant_id=tenant_id,
            platform="instagram",
            platform_account_id=page["id"],
            account_name=page["name"],
            access_token=page["access_token"],
        )
        saved_accounts.append({
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "account_name": account.account_name,
        })

    return {"message": "Instagram connected", "accounts": saved_accounts}


@router.get("/linkedin/login")
def linkedin_login(tenant_id: str = Query(...)):
    state = _build_state(tenant_id)
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.linkedin_redirect_uri,
        "state": state,
        "scope": "r_liteprofile w_member_social",
    }
    url = "https://www.linkedin.com/oauth/v2/authorization?{0}".format(urlencode(params))
    return RedirectResponse(url)


@router.get("/linkedin/callback")
def linkedin_callback(code: str = Query(...), state: str = Query(...)):
    tenant_id = _extract_tenant_from_state(state)

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.linkedin_redirect_uri,
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "client_secret": settings.LINKEDIN_SECRET,
    }
    token_response = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data=data,
        timeout=30,
    )
    if not token_response.ok:
        _raise_provider_error("linkedin", token_response)

    token_data = token_response.json()
    access_token = token_data["access_token"]

    profile_response = requests.get(
        "https://api.linkedin.com/v2/me",
        headers={"Authorization": "Bearer {0}".format(access_token)},
        timeout=30,
    )
    if not profile_response.ok:
        _raise_provider_error("linkedin", profile_response)

    profile = profile_response.json()

    account = save_social_account(
        tenant_id=tenant_id,
        platform="linkedin",
        platform_account_id=profile["id"],
        account_name="LinkedIn User",
        access_token=access_token,
    )

    return {
        "message": "LinkedIn connected",
        "account": {
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "account_name": account.account_name,
        },
    }


@router.get("/google/login")
def google_login(tenant_id: str = Query(...)):
    state = _build_state(tenant_id)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
        "scope": "https://www.googleapis.com/auth/youtube.upload",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?{0}".format(urlencode(params))
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(code: str = Query(...), state: str = Query(...)):
    tenant_id = _extract_tenant_from_state(state)

    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_SECRET,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }
    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data=data,
        timeout=30,
    )
    if not token_response.ok:
        _raise_provider_error("google", token_response)

    tokens = token_response.json()

    account = save_social_account(
        tenant_id=tenant_id,
        platform="youtube",
        platform_account_id="youtube_channel",
        account_name="YouTube",
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        expires_in=tokens.get("expires_in"),
    )

    return {
        "message": "YouTube connected",
        "account": {
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "account_name": account.account_name,
        },
    }


@router.get("/twitter/login")
def twitter_login(tenant_id: str = Query(...)):
    state = _build_state(tenant_id)
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode("utf-8")).digest()
    ).decode("utf-8").rstrip("=")

    params = {
        "response_type": "code",
        "client_id": settings.TWITTER_CLIENT_ID,
        "redirect_uri": settings.twitter_redirect_uri,
        "scope": "tweet.read tweet.write users.read offline.access",
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }

    url = "https://twitter.com/i/oauth2/authorize?{0}".format(urlencode(params))
    response = RedirectResponse(url)
    response.set_cookie(
        key="twitter_code_verifier",
        value=verifier,
        httponly=True,
        secure=settings.backend_public_url.startswith("https://"),
        samesite="lax",
        max_age=600,
    )
    return response

@router.get("/twitter/callback")
def twitter_callback(
    code: str = Query(...),
    state: str = Query(...),
    twitter_code_verifier: str = Cookie(default=None),
):
    tenant_id = _extract_tenant_from_state(state)

    verifier = twitter_code_verifier
    if not verifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Twitter code verifier",
        )

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.twitter_redirect_uri,
        "client_id": settings.TWITTER_CLIENT_ID,
        "code_verifier": verifier,
    }

    token_response = requests.post(
        "https://api.twitter.com/2/oauth2/token",
        data=data,
        auth=(settings.TWITTER_CLIENT_ID, settings.TWITTER_CLIENT_SECRET),
        timeout=30,
    )
    if not token_response.ok:
        _raise_provider_error("twitter", token_response)

    token_data = token_response.json()
    access_token = token_data["access_token"]

    user_response = requests.get(
        "https://api.twitter.com/2/users/me",
        headers={"Authorization": "Bearer {0}".format(access_token)},
        timeout=30,
    )
    if not user_response.ok:
        _raise_provider_error("twitter", user_response)

    user_data = user_response.json().get("data", {})

    account = save_social_account(
        tenant_id=tenant_id,
        platform="twitter",
        platform_account_id=user_data.get("id", ""),
        account_name=user_data.get("name", "Twitter User"),
        access_token=access_token,
        refresh_token=token_data.get("refresh_token"),
        expires_in=token_data.get("expires_in"),
    )

    return {
        "message": "Twitter connected",
        "account": {
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "account_name": account.account_name,
        },
    }
