"""
Senior-level API smoke and regression suite for SocialSync.

Usage examples:

PowerShell:
    $env:API_BASE_URL = "http://127.0.0.1:8000"
    $env:API_BEARER_TOKEN = "<paste-your-jwt>"
    $env:API_TENANT_ID = "tenant_123"
    pytest tests/test_api_endpoints.py -v

Optional env vars for deeper coverage:
    $env:TEST_POST_ID = "89"
    $env:TEST_ACCOUNT_ID = "1"
    $env:TEST_MEDIA_ID = "10"
    $env:TEST_UPLOAD_FILE = "D:\\SocialSyncV1\\temp-upload.txt"
    $env:TEST_ENABLE_MUTATIONS = "true"
    $env:TEST_ENABLE_OAUTH_REDIRECTS = "true"
    $env:TEST_ENABLE_LIVE_METRICS = "true"

Notes:
    - Safe read-only tests run by default.
    - Mutating tests (publish-now/cancel/upload/update/delete) are opt-in.
    - OAuth login tests validate redirect behavior only; they do not complete provider auth.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
import pytest


def _as_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class ApiTestConfig:
    base_url: str
    bearer_token: Optional[str]
    tenant_id: str
    timeout_seconds: float
    test_post_id: Optional[int]
    test_account_id: Optional[int]
    test_media_id: Optional[int]
    test_upload_file: Optional[str]
    enable_mutations: bool
    enable_oauth_redirects: bool
    enable_live_metrics: bool


@pytest.fixture(scope="session")
def config() -> ApiTestConfig:
    return ApiTestConfig(
        base_url=os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/"),
        bearer_token=os.getenv("API_BEARER_TOKEN"),
        tenant_id=os.getenv("API_TENANT_ID", "tenant_123"),
        timeout_seconds=float(os.getenv("API_TIMEOUT_SECONDS", "30")),
        test_post_id=int(os.getenv("TEST_POST_ID")) if os.getenv("TEST_POST_ID") else None,
        test_account_id=int(os.getenv("TEST_ACCOUNT_ID")) if os.getenv("TEST_ACCOUNT_ID") else None,
        test_media_id=int(os.getenv("TEST_MEDIA_ID")) if os.getenv("TEST_MEDIA_ID") else None,
        test_upload_file=os.getenv("TEST_UPLOAD_FILE"),
        enable_mutations=_as_bool(os.getenv("TEST_ENABLE_MUTATIONS"), default=False),
        enable_oauth_redirects=_as_bool(os.getenv("TEST_ENABLE_OAUTH_REDIRECTS"), default=False),
        enable_live_metrics=_as_bool(os.getenv("TEST_ENABLE_LIVE_METRICS"), default=False),
    )


@pytest.fixture(scope="session")
def client(config: ApiTestConfig) -> httpx.Client:
    headers: Dict[str, str] = {
        "Accept": "application/json",
        "X-Tenant-ID": config.tenant_id,
        "X-Request-ID": "pytest-api-suite",
    }
    if config.bearer_token:
        headers["Authorization"] = f"Bearer {config.bearer_token}"

    with httpx.Client(
        base_url=config.base_url,
        headers=headers,
        timeout=config.timeout_seconds,
        follow_redirects=False,
    ) as api_client:
        yield api_client


def _assert_ok(response: httpx.Response, expected: int = 200) -> None:
    assert response.status_code == expected, (
        f"Expected HTTP {expected}, got {response.status_code}. "
        f"Response body: {response.text}"
    )


def _require_mutations(config: ApiTestConfig) -> None:
    if not config.enable_mutations:
        pytest.skip("Mutation tests are disabled. Set TEST_ENABLE_MUTATIONS=true to enable.")


def _require_post_id(config: ApiTestConfig) -> int:
    if config.test_post_id is None:
        pytest.skip("TEST_POST_ID is not set.")
    return config.test_post_id


def _require_account_id(config: ApiTestConfig) -> int:
    if config.test_account_id is None:
        pytest.skip("TEST_ACCOUNT_ID is not set.")
    return config.test_account_id


def _require_media_id(config: ApiTestConfig) -> int:
    if config.test_media_id is None:
        pytest.skip("TEST_MEDIA_ID is not set.")
    return config.test_media_id


class TestHealthEndpoints:
    def test_health(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/health")
        _assert_ok(response)
        payload = response.json()
        assert payload["status"] == "ok"
        assert "service" in payload

    def test_ready(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/ready")
        _assert_ok(response)
        payload = response.json()
        assert payload["status"] in {"ready", "not_ready"}
        assert "database" in payload
        assert "redis" in payload


class TestPlatformEndpoints:
    def test_platform_capabilities(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/platforms/")
        _assert_ok(response)
        payload = response.json()
        assert "platforms" in payload
        assert isinstance(payload["platforms"], list)


class TestAccountEndpoints:
    def test_list_accounts(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/accounts/")
        _assert_ok(response)
        payload = response.json()
        assert isinstance(payload, list)

    def test_account_status(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/accounts/status")
        _assert_ok(response)
        payload = response.json()
        for platform in ["facebook", "instagram", "linkedin", "twitter", "youtube"]:
            assert platform in payload
            assert "connected" in payload[platform]
            assert "active_accounts" in payload[platform]

    def test_get_single_account(self, client: httpx.Client, config: ApiTestConfig) -> None:
        account_id = _require_account_id(config)
        response = client.get(f"/api/v1/accounts/{account_id}")
        _assert_ok(response)
        payload = response.json()
        assert payload["id"] == account_id


class TestMediaEndpoints:
    def test_list_media(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/media/")
        _assert_ok(response)
        payload = response.json()
        assert isinstance(payload, list)

    def test_get_single_media(self, client: httpx.Client, config: ApiTestConfig) -> None:
        media_id = _require_media_id(config)
        response = client.get(f"/api/v1/media/{media_id}")
        _assert_ok(response)
        payload = response.json()
        assert payload["id"] == media_id

    def test_upload_media(self, client: httpx.Client, config: ApiTestConfig) -> None:
        _require_mutations(config)
        if not config.test_upload_file:
            pytest.skip("TEST_UPLOAD_FILE is not set.")

        upload_path = Path(config.test_upload_file)
        if not upload_path.exists():
            pytest.skip(f"Upload file does not exist: {upload_path}")

        with upload_path.open("rb") as handle:
            response = client.post(
                "/api/v1/media/upload",
                files={"file": (upload_path.name, handle, "text/plain")},
                data={"alt_text": "pytest upload"},
            )

        assert response.status_code in {200, 201}, response.text
        payload = response.json()
        assert "id" in payload or "media_id" in payload


class TestPostEndpoints:
    def test_list_posts(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/posts/")
        _assert_ok(response)
        payload = response.json()
        assert isinstance(payload, list)

    def test_get_single_post(self, client: httpx.Client, config: ApiTestConfig) -> None:
        post_id = _require_post_id(config)
        response = client.get(f"/api/v1/posts/{post_id}")
        _assert_ok(response)
        payload = response.json()
        assert payload["id"] == post_id

    def test_post_analytics_summary(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/posts/analytics/summary")
        _assert_ok(response)
        payload = response.json()
        expected_keys = {
            "total_posts",
            "queued_posts",
            "scheduled_posts",
            "processing_posts",
            "posted_posts",
            "failed_posts",
            "cancelled_posts",
            "success_rate",
        }
        assert expected_keys.issubset(payload.keys())

    def test_post_analytics_platforms(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/posts/analytics/platforms")
        _assert_ok(response)
        payload = response.json()
        assert isinstance(payload, list)

    def test_recent_post_failures(self, client: httpx.Client) -> None:
        response = client.get("/api/v1/posts/analytics/recent-failures")
        _assert_ok(response)
        payload = response.json()
        assert isinstance(payload, list)

    def test_get_live_metrics(self, client: httpx.Client, config: ApiTestConfig) -> None:
        if not config.enable_live_metrics:
            pytest.skip("Live metrics test disabled. Set TEST_ENABLE_LIVE_METRICS=true to enable.")
        post_id = _require_post_id(config)
        response = client.get(f"/api/v1/posts/{post_id}/metrics")
        _assert_ok(response)
        payload = response.json()
        assert payload["post_id"] == post_id
        assert "available" in payload
        assert "metrics" in payload
        assert "fetched_at" in payload

    def test_publish_now(self, client: httpx.Client, config: ApiTestConfig) -> None:
        _require_mutations(config)
        post_id = _require_post_id(config)
        response = client.post(f"/api/v1/posts/{post_id}/publish-now")
        _assert_ok(response)
        payload = response.json()
        assert payload["post_id"] == post_id
        assert "status" in payload

    def test_cancel_post(self, client: httpx.Client, config: ApiTestConfig) -> None:
        _require_mutations(config)
        post_id = _require_post_id(config)
        response = client.post(f"/api/v1/posts/{post_id}/cancel")
        _assert_ok(response)
        payload = response.json()
        assert payload["post_id"] == post_id
        assert "status" in payload

    def test_edit_post(self, client: httpx.Client, config: ApiTestConfig) -> None:
        _require_mutations(config)
        post_id = _require_post_id(config)
        response = client.patch(
            f"/api/v1/posts/{post_id}",
            json={"content": "pytest edit content"},
        )
        _assert_ok(response)
        payload = response.json()
        assert payload["post_id"] == post_id
        assert "status" in payload


class TestOAuthLoginEndpoints:
    @pytest.mark.parametrize(
        "provider_path",
        [
            "/api/v1/oauth/facebook/login",
            "/api/v1/oauth/instagram/login",
            "/api/v1/oauth/linkedin/login",
            "/api/v1/oauth/google/login",
            "/api/v1/oauth/twitter/login",
        ],
    )
    def test_oauth_login_redirects(
        self,
        client: httpx.Client,
        config: ApiTestConfig,
        provider_path: str,
    ) -> None:
        if not config.enable_oauth_redirects:
            pytest.skip("OAuth redirect tests are disabled. Set TEST_ENABLE_OAUTH_REDIRECTS=true to enable.")

        response = client.get(provider_path)
        assert response.status_code in {302, 303, 307}, (
            f"Expected redirect from {provider_path}, got {response.status_code}. "
            f"Response body: {response.text}"
        )
        assert "location" in response.headers

