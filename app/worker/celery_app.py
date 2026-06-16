import os

from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.task_default_queue = "default"
celery_app.conf.task_routes = {
    "app.worker.tasks.*": {"queue": "default"}
}
celery_app.conf.beat_schedule = {
    "sync-analytics-snapshots-hourly": {
        "task": "app.worker.tasks.sync_analytics_snapshots_task",
        "schedule": crontab(minute=15),
    }
}

# Enable task events for Flower monitoring
celery_app.conf.worker_send_task_events = True
celery_app.conf.task_send_sent_event = True
celery_app.conf.event_queue_expires = 60  # Expire event queues after 60 seconds

# Worker startup configuration
celery_app.conf.update(
    task_ignore_result=True,
    task_store_errors_even_if_ignored=False,
    task_acks_late=True,  # Acknowledge tasks after completion
    worker_prefetch_multiplier=1,  # Process one task at a time
    task_reject_on_worker_lost=True,  # Requeue if worker dies
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=None,
    broker_transport_options={
        "visibility_timeout": 3600,
        "socket_connect_timeout": 5,
        "socket_timeout": 10,
        "retry_on_timeout": True,
        "health_check_interval": 30,
    },
)

import app.worker.tasks  # noqa: E402,F401

# Print startup info
print(f"✓ Celery app configured with Redis: {REDIS_URL[:30]}...")
print(f"✓ Task queue: default")
print(f"✓ Worker will process: app.worker.tasks.*")
