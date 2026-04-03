import requests
from datetime import datetime, timedelta
from app.core.logging import get_logger
from app.core.security import encrypt_token
from app.models.social_account import SocialAccount
from app.db.database import SessionLocal, reset_tenant_context, set_tenant_context

logger = get_logger("app.oauth")


def save_social_account(
    tenant_id,
    platform,
    platform_account_id,
    account_name,
    access_token,
    refresh_token=None,
    expires_in=None
):
    db = SessionLocal()
    set_tenant_context(db, tenant_id)

    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None

    expiry = None
    if expires_in:
        expiry = datetime.utcnow() + timedelta(seconds=expires_in)

    account = SocialAccount(
        tenant_id=tenant_id,
        platform=platform,
        platform_account_id=platform_account_id,
        account_name=account_name,
        encrypted_token=encrypted_access,
        encrypted_refresh_token=encrypted_refresh,
        token_expiry=expiry
    )

    db.add(account)
    db.commit()
    db.refresh(account)
    logger.info(
        "oauth.account_saved tenant_id=%s platform=%s platform_account_id=%s",
        tenant_id,
        platform,
        platform_account_id,
    )
    reset_tenant_context(db)
    db.close()

    return account
