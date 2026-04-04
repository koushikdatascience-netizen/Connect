import asyncio
from types import SimpleNamespace

from app.core.auth import CurrentUser
from app.middleware.jwt_context import jwt_context_middleware
from app.utils import deps


class FakeDb:
    def __init__(self):
        self.closed = False
        self.rolled_back = False

    def close(self):
        self.closed = True

    def rollback(self):
        self.rolled_back = True


def test_get_db_sets_and_resets_request_context(monkeypatch):
    calls = []
    fake_db = FakeDb()
    request = SimpleNamespace(
        state=SimpleNamespace(
            request_context=SimpleNamespace(
                tenant_id="tenant_a",
                user_id="user_a",
                role="admin",
            )
        )
    )

    monkeypatch.setattr(deps, "SessionLocal", lambda: fake_db)
    monkeypatch.setattr(
        deps,
        "set_request_context",
        lambda db, tenant_id, user_id, role: calls.append(("set", db, tenant_id, user_id, role)),
    )
    monkeypatch.setattr(deps, "reset_tenant_context", lambda db: calls.append(("reset", db, None, None, None)))

    generator = deps.get_db(request)
    assert next(generator) is fake_db

    try:
        next(generator)
    except StopIteration:
        pass

    assert calls == [
        ("set", fake_db, "tenant_a", "user_a", "admin"),
        ("reset", fake_db, None, None, None),
    ]
    assert fake_db.closed is True


def test_get_current_user_reads_request_state():
    expected = CurrentUser(
        subject="user-1",
        tenant_id="tenant_jwt",
        role="admin",
        is_admin=True,
        claims={"TenantId": "tenant_jwt", "UserId": "user-1", "ISAdmin": "true"},
    )
    request = SimpleNamespace(state=SimpleNamespace(current_user=expected))

    user = deps.get_current_user(request)

    assert user == expected


def test_jwt_middleware_falls_back_to_query_tenant(monkeypatch):
    from app.middleware import jwt_context

    monkeypatch.setattr(jwt_context.get_settings(), "AUTH_REQUIRED", False)
    monkeypatch.setattr(jwt_context.get_settings(), "ALLOW_DEV_TENANT_HEADER", True)

    request = SimpleNamespace(
        headers={},
        query_params={"tenantId": "tenant_query"},
        state=SimpleNamespace(),
    )

    async def call_next(req):
        return req.state.request_context.tenant_id

    result = asyncio.run(jwt_context_middleware(request, call_next))
    assert result == "tenant_query"
