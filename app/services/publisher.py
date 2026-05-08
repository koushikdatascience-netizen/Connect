from datetime import datetime
from typing import Optional

import app.db.models  # noqa: F401
from app.core.logging import get_logger, log_event
from app.db.database import SessionLocal, reset_tenant_context, set_tenant_context
from app.models.media_asset import MediaAsset
from app.models.post_media import PostMedia
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.services.provider_publishers import PublishError, publish_to_provider, resolve_published_permalink

logger = get_logger("app.publisher")


def publish_post(post_id: int, tenant_id: str, request_id: Optional[str] = "N/A"):
    """
    Publish a scheduled post with full request tracing.
    
    Args:
        post_id: Database ID of the post
        tenant_id: Multi-tenant identifier
        request_id: Correlation ID for end-to-end tracing
    """
    db = SessionLocal()
    set_tenant_context(db, tenant_id)

    post = db.query(ScheduledPost).filter_by(
        id=post_id,
        tenant_id=tenant_id
    ).first()

    if not post:
        log_event(
            logger, "warning", "publish.skip_missing_post",
            request_id=request_id,
            step="validate_post",
            extra={"post_id": post_id, "tenant_id": tenant_id}
        )
        reset_tenant_context(db)
        db.close()
        return

    if post.status == "cancelled":
        log_event(
            logger, "info", "publish.skip_cancelled",
            request_id=request_id,
            step="validate_status",
            extra={"post_id": post_id, "platform": post.platform}
        )
        reset_tenant_context(db)
        db.close()
        return

    account = db.query(SocialAccount).filter_by(
        id=post.social_account_id,
        tenant_id=tenant_id,
    ).first()
    if not account:
        log_event(
            logger, "error", "publish.missing_account",
            request_id=request_id,
            platform=post.platform,
            step="validate_account",
            extra={"post_id": post_id, "account_id": post.social_account_id}
        )
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
        log_event(
            logger, "info", "publish.started",
            request_id=request_id,
            platform=post.platform,
            step="publish_start",
            extra={
                "post_id": post_id,
                "tenant_id": tenant_id,
                "media_count": len(media_assets),
                "scheduled_at": str(post.scheduled_at),
            }
        )
        
        post.status = "processing"
        post.error_message = None
        post.updated_at = datetime.utcnow()
        db.commit()

        provider_post_id = publish_to_provider(post, account, media_assets)
        resolved_permalink = resolve_published_permalink(post, account, provider_post_id)

        post.status = "posted"
        post.posted_at = datetime.utcnow()
        post.platform_post_id = provider_post_id
        if resolved_permalink:
            platform_options = dict(post.platform_options or {})
            platform_options["_published_permalink"] = resolved_permalink
            post.platform_options = platform_options
        post.updated_at = datetime.utcnow()
        
        log_event(
            logger, "info", "publish.completed",
            request_id=request_id,
            platform=post.platform,
            step="publish_success",
            extra={
                "post_id": post_id,
                "provider_post_id": provider_post_id,
                "published_permalink": resolved_permalink,
                "media_count": len(media_assets),
            }
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
            
        log_event(
            logger, "error", "publish.failed",
            request_id=request_id,
            platform=post.platform if post else "unknown",
            step="publish_error",
            extra={
                "post_id": post_id,
                "retry_count": post.retry_count if post else 0,
                "error": str(e),
                "retryable": e.retryable,
            },
            exc_info=True
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
            
        log_event(
            logger, "error", "publish.failed_unexpected",
            request_id=request_id,
            platform=post.platform if post else "unknown",
            step="publish_unexpected_error",
            extra={
                "post_id": post_id,
                "retry_count": post.retry_count,
                "error": str(e),
            },
            exc_info=True
        )

    db.commit()
    reset_tenant_context(db)
    db.close()
