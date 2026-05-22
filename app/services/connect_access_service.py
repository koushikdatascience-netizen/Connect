from fastapi import HTTPException, status

from app.core.config import get_settings
from app.db.database import SessionLocal
from app.models.connect_user import ConnectUser
from app.models.social_account import SocialAccount

APPROVED_STATUSES = {"approved_test_user", "active"}


def ensure_user_can_connect_accounts(tenant_id: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(ConnectUser).filter(ConnectUser.tenant_id == tenant_id).first()
        if user is None:
            return
        if user.status not in APPROVED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your account is pending beta access approval. "
                    "Facebook and Instagram features are available only after approval."
                ),
            )
    finally:
        db.close()


def ensure_user_can_publish(tenant_id: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(ConnectUser).filter(ConnectUser.tenant_id == tenant_id).first()
        if user is None:
            return
        if user.status not in APPROVED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your account is pending beta access approval. "
                    "Publishing, scheduling, and social actions unlock after approval."
                ),
            )
    finally:
        db.close()


def ensure_account_limit_available(tenant_id: str, platform: str, platform_account_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        existing = (
            db.query(SocialAccount)
            .filter_by(
                tenant_id=tenant_id,
                platform=platform,
                platform_account_id=platform_account_id,
            )
            .first()
        )
        if existing is not None:
            return

        user = db.query(ConnectUser).filter(ConnectUser.tenant_id == tenant_id).first()
        limit = user.max_social_accounts if user else settings.CONNECT_DEFAULT_MAX_SOCIAL_ACCOUNTS
        connected_count = db.query(SocialAccount).filter_by(tenant_id=tenant_id).count()
        if connected_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your current plan allows up to {limit} connected accounts. Please contact Snapkey support to increase your limit.",
            )
    finally:
        db.close()
