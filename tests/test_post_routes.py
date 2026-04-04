from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.utils import deps


def _override_db():
    yield object()


def _override_tenant():
    return "tenant_123"


class FakeTaskResult:
    def __init__(self, task_id: str):
        self.id = task_id


class FakePublishTask:
    def delay(self, post_id, tenant_id):
        return FakeTaskResult(f"delay-{post_id}-{tenant_id}")

    def apply_async(self, args, eta):
        post_id, tenant_id = args
        return FakeTaskResult(f"eta-{post_id}-{tenant_id}")


def setup_module(module):
    app.dependency_overrides[deps.get_db] = _override_db
    app.dependency_overrides[deps.get_tenant] = _override_tenant


def teardown_module(module):
    app.dependency_overrides.clear()


def test_create_post_queues_immediate(monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr("app.api.v1.endpoints.post.publish_post_task", FakePublishTask())
    monkeypatch.setattr(
        "app.api.v1.endpoints.post.create_post",
        lambda db, tenant_id, data: SimpleNamespace(
            id=11,
            status="queued",
            scheduled_at=None,
        ),
    )

    response = client.post(
        "/api/v1/posts/",
        json={
            "social_account_id": 1,
            "content": "Immediate",
            "scheduled_at": None,
            "media_ids": [],
            "platform_options": {},
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "queued"
    assert response.json()["task_id"] == "delay-11-tenant_123"


def test_create_post_schedules_future(monkeypatch):
    client = TestClient(app)
    future = datetime.now(timezone.utc) + timedelta(hours=2)
    monkeypatch.setattr("app.api.v1.endpoints.post.publish_post_task", FakePublishTask())
    monkeypatch.setattr(
        "app.api.v1.endpoints.post.create_post",
        lambda db, tenant_id, data: SimpleNamespace(
            id=22,
            status="scheduled",
            scheduled_at=future,
        ),
    )

    response = client.post(
        "/api/v1/posts/",
        json={
            "social_account_id": 1,
            "content": "Scheduled",
            "scheduled_at": future.isoformat(),
            "media_ids": [],
            "platform_options": {},
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "scheduled"
    assert response.json()["task_id"] == "eta-22-tenant_123"


def test_cancel_post(monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(
        "app.api.v1.endpoints.post.get_post",
        lambda db, tenant_id, post_id: SimpleNamespace(id=post_id, status="scheduled"),
    )
    monkeypatch.setattr(
        "app.api.v1.endpoints.post.update_post_status",
        lambda db, tenant_id, post_id, status, error_message=None: SimpleNamespace(id=post_id, status=status),
    )

    response = client.post("/api/v1/posts/77/cancel")

    assert response.status_code == 200
    assert response.json() == {"post_id": 77, "status": "cancelled", "task_id": None}
