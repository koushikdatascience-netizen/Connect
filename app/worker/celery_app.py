import os

from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.task_default_queue = "default"
celery_app.conf.task_routes = {
    "app.worker.tasks.*": {"queue": "default"}
}

import app.worker.tasks  # noqa: E402,F401
