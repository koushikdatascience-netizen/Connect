from datetime import datetime
import time

import app.db.models  # noqa: F401
from app.core.logging import get_logger
from app.db.database import SessionLocal, reset_tenant_context, set_tenant_context
from app.models.scheduled_post import ScheduledPost

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

        # simulate API call
        time.sleep(3)

        post.status = "posted"
        post.posted_at = datetime.utcnow()
        post.platform_post_id = "demo_123"
        post.updated_at = datetime.utcnow()
        logger.info(
            "publish.completed tenant_id=%s post_id=%s platform=%s",
            tenant_id,
            post_id,
            post.platform,
        )

    except Exception as e:
        db.rollback()

        post = db.query(ScheduledPost).filter_by(
            id=post_id,
            tenant_id=tenant_id
        ).first()

        if not post:
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
            "publish.failed tenant_id=%s post_id=%s retry_count=%s",
            tenant_id,
            post_id,
            post.retry_count,
        )

    db.commit()
    reset_tenant_context(db)
    db.close()
