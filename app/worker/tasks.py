"""Celery tasks with structured logging and request ID tracing."""

from app.core.logging import get_logger, log_event
from app.services.publisher import publish_post
from app.worker.celery_app import celery_app

logger = get_logger("app.worker.tasks")


# FIX: Added explicit name="app.worker.tasks.publish_post_task"
# Without this, Celery auto-generates the name from the Celery app's main
# name ("worker") + function name → "worker.publish_post_task".
# But the API dispatches via send_task("app.worker.tasks.publish_post_task").
# That mismatch means tasks sit in Redis forever with no worker claiming them.
@celery_app.task(bind=True, max_retries=3, name="app.worker.tasks.publish_post_task")
def publish_post_task(self, post_id: int, tenant_id: str, request_id: str = "N/A"):
    """
    Publish a scheduled post with full request tracing.

    Args:
        post_id: Database ID of the post
        tenant_id: Multi-tenant identifier
        request_id: Correlation ID from API request
    """
    log_event(
        logger,
        "info",
        "task.started",
        request_id=request_id,
        step="celery_task_start",
        extra={"post_id": post_id, "tenant_id": tenant_id, "retry_count": self.request.retries}
    )

    try:
        result = publish_post(post_id, tenant_id, request_id=request_id)

        log_event(
            logger,
            "info",
            "task.completed",
            request_id=request_id,
            step="celery_task_success",
            extra={"post_id": post_id, "result": str(result)}
        )

        return result

    except Exception as e:
        log_event(
            logger,
            "error",
            "task.failed",
            request_id=request_id,
            step="celery_task_error",
            extra={"post_id": post_id, "error": str(e), "retry_count": self.request.retries},
            exc_info=True
        )

        # Retry with exponential backoff: 5s, 10s, 20s
        countdown = 5 * (2 ** self.request.retries)
        raise self.retry(exc=e, countdown=countdown)


@celery_app.task(name="app.worker.tasks.healthcheck_task")
def healthcheck_task():
    """Lightweight task to verify worker consumption path."""
    log_event(
        logger,
        "info",
        "task.healthcheck",
        request_id="N/A",
        step="celery_task_healthcheck",
        extra={"message": "healthcheck task consumed by worker"},
    )
    return {"status": "ok"}