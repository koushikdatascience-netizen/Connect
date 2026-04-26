import time
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.crud.account import (
    create_account,
    delete_account,
    get_account_by_id,
    get_account_status_summary,
    list_accounts,
    set_account_active,
    update_account,
)
from app.schemas.account import (
    AccountActiveUpdate,
    AccountCreate,
    AccountRead,
    AccountStatusResponse,
    AccountUpdate,
    WordPressConnectRequest,
)
from app.services.oauth_service import save_social_account
from app.utils.deps import get_db, get_tenant

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory avatar proxy cache
# key   → profile_picture_url string
# value → (raw bytes, content-type, fetched_at timestamp)
# ---------------------------------------------------------------------------
_AVATAR_CACHE: Dict[str, Tuple[bytes, str, float]] = {}
_AVATAR_TTL = 3600  # 1 hour


def _get_cached_avatar(url: str) -> Optional[Tuple[bytes, str]]:
    entry = _AVATAR_CACHE.get(url)
    if entry and (time.time() - entry[2]) < _AVATAR_TTL:
        return entry[0], entry[1]
    return None


def _set_cached_avatar(url: str, content: bytes, content_type: str) -> None:
    _AVATAR_CACHE[url] = (content, content_type, time.time())
    # Evict oldest entry when the cache grows beyond 500 items
    if len(_AVATAR_CACHE) > 500:
        oldest = min(_AVATAR_CACHE, key=lambda k: _AVATAR_CACHE[k][2])
        _AVATAR_CACHE.pop(oldest, None)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_wordpress_site_url(site_url: str) -> str:
    normalized = site_url.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WordPress site URL is required",
        )
    if not normalized.startswith(("http://", "https://")):
        normalized = f"https://{normalized}"
    return normalized.rstrip("/")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def create_account_endpoint(
    data: AccountCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return create_account(db, tenant_id, data)


@router.post("/wordpress/connect", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def connect_wordpress_site(
    data: WordPressConnectRequest,
    tenant_id: str = Depends(get_tenant),
):
    site_url = _normalize_wordpress_site_url(data.site_url)
    username = data.username.strip()
    application_password = data.application_password.strip()

    if not username or not application_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WordPress username and application password are required",
        )

    me_response = requests.get(
        f"{site_url}/wp-json/wp/v2/users/me",
        auth=(username, application_password),
        timeout=30,
    )
    if me_response.status_code in {401, 403}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WordPress rejected the username or application password.",
        )
    if not me_response.ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to verify the WordPress site. Status: {me_response.status_code}",
        )

    site_response = requests.get(
        f"{site_url}/wp-json",
        timeout=30,
    )
    site_name = data.account_name.strip() if data.account_name else ""
    if site_response.ok:
        payload = site_response.json()
        site_name = site_name or payload.get("name") or payload.get("description") or ""

    parsed = urlparse(site_url)
    hostname = parsed.netloc or site_url
    display_name = site_name or hostname
    platform_account_id = f"{site_url}|{username}"

    account = save_social_account(
        tenant_id=tenant_id,
        platform="wordpress",
        platform_account_id=platform_account_id,
        account_name=display_name,
        access_token=application_password,
        refresh_token=username,
        account_type="wordpress_site",
    )
    return account


@router.get("/", response_model=list[AccountRead])
def list_accounts_endpoint(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return list_accounts(db, tenant_id)


@router.get("/status", response_model=AccountStatusResponse)
def get_account_status_endpoint(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return get_account_status_summary(db, tenant_id)


@router.get("/{account_id}", response_model=AccountRead)
def get_account_endpoint(
    account_id: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    account = get_account_by_id(db, tenant_id, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return account


@router.get("/{account_id}/avatar")
def proxy_account_avatar(
    account_id: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    """
    Proxy the account's profile picture through the backend.

    Why this exists:
    - LinkedIn (media.licdn.com) blocks cross-origin <img> requests.
    - Facebook/Instagram CDN URLs are short-lived and expire quickly.
    - Twitter and Google URLs are fine, but routing everything through
      here keeps the frontend consistent and avoids future breakage.

    The image is cached in memory for 1 hour so repeated page loads
    don't hammer third-party CDNs.
    """
    account = get_account_by_id(db, tenant_id, account_id)
    if not account or not account.profile_picture_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No avatar available for this account",
        )

    url = account.profile_picture_url

    # Return from cache if still fresh
    cached = _get_cached_avatar(url)
    if cached:
        content, content_type = cached
        return Response(
            content=content,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=3600"},
        )

    # Fetch from the third-party CDN server-side (no browser CORS involved)
    try:
        resp = requests.get(
            url,
            timeout=10,
            headers={
                # A browser-like User-Agent satisfies LinkedIn's hotlink check
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0 Safari/537.36"
                ),
                "Referer": "https://www.google.com/",
            },
            allow_redirects=True,
        )
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Avatar fetch timed out",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not retrieve avatar from the upstream provider",
        )

    # Guard against non-image responses
    content_type = resp.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream did not return an image",
        )

    _set_cached_avatar(url, resp.content, content_type)

    return Response(
        content=resp.content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.patch("/{account_id}", response_model=AccountRead)
def update_account_endpoint(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    account = update_account(db, tenant_id, account_id, data)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return account


@router.patch("/{account_id}/active", response_model=AccountRead)
def set_account_active_endpoint(
    account_id: int,
    data: AccountActiveUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    account = set_account_active(db, tenant_id, account_id, data.is_active)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account_endpoint(
    account_id: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    deleted = delete_account(db, tenant_id, account_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return None