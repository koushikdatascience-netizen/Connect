from datetime import datetime, timedelta
from typing import Optional

from app.core.logging import get_logger
from app.core.security import encrypt_token
from app.db.database import SessionLocal, reset_tenant_context, set_tenant_context
from app.models.social_account import SocialAccount

logger = get_logger("app.oauth")


def save_social_account(
    tenant_id,
    platform,
    platform_account_id,
    account_name,
    access_token,
    refresh_token=None,
    expires_in=None,
    account_type: Optional[str] = None,
    profile_picture_url: Optional[str] = None,
):
    db = SessionLocal()
    set_tenant_context(db, tenant_id)

    try:
        encrypted_access = encrypt_token(access_token)
        encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None

        expiry = None
        if expires_in:
            expiry = datetime.utcnow() + timedelta(seconds=expires_in)

        account = (
            db.query(SocialAccount)
            .filter_by(
                tenant_id=tenant_id,
                platform=platform,
                platform_account_id=platform_account_id,
            )
            .first()
        )

        if account is None:
            account = SocialAccount(
                tenant_id=tenant_id,
                platform=platform,
                platform_account_id=platform_account_id,
                account_name=account_name,
                account_type=account_type,
                profile_picture_url=profile_picture_url,
                encrypted_token=encrypted_access,
                encrypted_refresh_token=encrypted_refresh,
                token_expiry=expiry,
            )
            db.add(account)
        else:
            account.account_name = account_name
            account.account_type = account_type
            account.profile_picture_url = profile_picture_url
            account.encrypted_token = encrypted_access
            account.encrypted_refresh_token = encrypted_refresh
            account.token_expiry = expiry
            account.is_active = True

        db.flush()
        account_id = account.id
        db.commit()
        if account_id is not None:
            reloaded = (
                db.query(SocialAccount)
                .filter_by(
                    id=account_id,
                    tenant_id=tenant_id,
                    platform=platform,
                    platform_account_id=platform_account_id,
                )
                .first()
            )
            if reloaded is not None:
                account = reloaded
        logger.info(
            "oauth.account_saved tenant_id=%s platform=%s platform_account_id=%s",
            tenant_id,
            platform,
            platform_account_id,
        )
        return account
    finally:
        try:
            reset_tenant_context(db)
        except Exception:
            db.rollback()
        db.close()
