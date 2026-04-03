from app.worker.celery_app import celery_app

@celery_app.task
def publish_post_task(post_id, tenant_id):
    from app.services.publisher import publish_post

    publish_post(post_id, tenant_id)
