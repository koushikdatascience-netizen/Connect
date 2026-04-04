from datetime import datetime

import app.db.models  # noqa: F401
from app.core.logging import get_logger
from app.db.database import SessionLocal, reset_tenant_context, set_tenant_context
from app.models.media_asset import MediaAsset
from app.models.post_media import PostMedia
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.services.provider_publishers import PublishError, publish_to_provider

logger = get_logger("app.publisher")


def publish_post(post_id: int, tenant_id: str):
    db = SessionLocal()
    set_tenant_context(db, tenant_id)

    post = db.query(ScheduledPost).filter_by(
        id=post_id,
        tenant_id=tenant_id
    ).first()

    if not post:
        logger.warning("publish.skip_missing_post tenant_id=%s post_id=%s", tenant_id, post_id)
        reset_tenant_context(db)
        db.close()
        return

    if post.status == "cancelled":
        logger.info("publish.skip_cancelled tenant_id=%s post_id=%s", tenant_id, post_id)
        reset_tenant_context(db)
        db.close()
        return

    account = db.query(SocialAccount).filter_by(
        id=post.social_account_id,
        tenant_id=tenant_id,
    ).first()
    if not account:
        logger.error("publish.missing_account tenant_id=%s post_id=%s", tenant_id, post_id)
        post.status = "failed"
        post.error_message = "Connected account not found"
        post.updated_at = datetime.utcnow()
        db.commit()
        reset_tenant_context(db)
        db.close()
        return

    media_assets = (
        db.query(MediaAsset)
        .join(PostMedia, PostMedia.media_asset_id == MediaAsset.id)
        .filter(
            PostMedia.post_id == post.id,
            PostMedia.tenant_id == tenant_id,
            MediaAsset.tenant_id == tenant_id,
        )
        .order_by(PostMedia.display_order.asc(), PostMedia.id.asc())
        .all()
    )

    try:
        logger.info(
            "publish.started tenant_id=%s post_id=%s platform=%s",
            tenant_id,
            post_id,
            post.platform,
        )
        post.status = "processing"
        post.error_message = None
        post.updated_at = datetime.utcnow()
        db.commit()

        provider_post_id = publish_to_provider(post, account, media_assets)

        post.status = "posted"
        post.posted_at = datetime.utcnow()
        post.platform_post_id = provider_post_id
        post.updated_at = datetime.utcnow()
        logger.info(
            "publish.completed tenant_id=%s post_id=%s platform=%s provider_post_id=%s",
            tenant_id,
            post_id,
            post.platform,
            provider_post_id,
        )

    except PublishError as e:
        db.rollback()

        post = db.query(ScheduledPost).filter_by(
            id=post_id,
            tenant_id=tenant_id
        ).first()

        if not post:
            db.close()
            return

        if e.retryable:
            post.retry_count += 1
        post.error_message = str(e)
        post.updated_at = datetime.utcnow()

        if not e.retryable or post.retry_count >= post.max_retries:
            post.status = "failed"
        else:
            post.status = "queued"
        logger.exception(
            "publish.failed tenant_id=%s post_id=%s retry_count=%s",
            tenant_id,
            post_id,
            post.retry_count,
        )
    except Exception as e:
        db.rollback()

        post = db.query(ScheduledPost).filter_by(
            id=post_id,
            tenant_id=tenant_id
        ).first()

        if not post:
            reset_tenant_context(db)
            db.close()
            return

        post.retry_count += 1
        post.error_message = str(e)
        post.updated_at = datetime.utcnow()

        if post.retry_count >= post.max_retries:
            post.status = "failed"
        else:
            post.status = "queued"
        logger.exception(
            "publish.failed_unexpected tenant_id=%s post_id=%s retry_count=%s",
            tenant_id,
            post_id,
            post.retry_count,
        )

    db.commit()
    reset_tenant_context(db)
    db.close()
