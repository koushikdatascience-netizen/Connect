from types import SimpleNamespace

import pytest

from app.services.provider_publishers import (
    UnsupportedPublishError,
    publish_to_facebook,
    publish_to_instagram,
    publish_to_twitter,
    publish_to_youtube,
)


class DummyResponse:
    def __init__(self, payload=None, status_code=200):
        self._payload = payload or {}
        self.status_code = status_code
        self.ok = status_code < 400
        self.headers = {}
        self.text = str(self._payload)

    def json(self):
        return self._payload


def test_publish_to_facebook_single_image_uses_photo_endpoint(monkeypatch):
    calls = []

    def fake_post(url, data=None, timeout=None):
        calls.append((url, data))
        return DummyResponse({"id": "media-post-1", "post_id": "page_post_1"})

    monkeypatch.setattr("app.services.provider_publishers.requests.post", fake_post)

    post = SimpleNamespace(content="Launch post")
    account = SimpleNamespace(platform_account_id="page_123")
    media = SimpleNamespace(file_type="image", file_url="https://cdn.example.com/image.jpg")

    provider_post_id = publish_to_facebook(post, account, "token-1", {}, [media])

    assert provider_post_id == "page_post_1"
    assert calls[0][0].endswith("/page_123/photos")
    assert calls[0][1]["url"] == "https://cdn.example.com/image.jpg"


def test_publish_to_instagram_requires_single_media():
    post = SimpleNamespace(content="Caption")
    account = SimpleNamespace(platform_account_id="ig_123")

    with pytest.raises(UnsupportedPublishError):
        publish_to_instagram(post, account, "token-1", {}, [])


def test_publish_to_twitter_appends_media_links(monkeypatch):
    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["url"] = url
        captured["json"] = json
        return DummyResponse({"data": {"id": "tweet-1"}})

    monkeypatch.setattr("app.services.provider_publishers.requests.post", fake_post)

    post = SimpleNamespace(content="Campaign copy")
    account = SimpleNamespace(platform_account_id="tw_123")
    media = [SimpleNamespace(file_url="https://cdn.example.com/image.jpg")]

    provider_post_id = publish_to_twitter(post, account, "token-1", {}, media)

    assert provider_post_id == "tweet-1"
    assert "https://cdn.example.com/image.jpg" in captured["json"]["text"]


def test_publish_to_youtube_requires_single_video():
    post = SimpleNamespace(content="Video caption")
    account = SimpleNamespace(platform_account_id="yt_123")
    media = [SimpleNamespace(file_type="image", file_url="https://cdn.example.com/image.jpg")]

    with pytest.raises(UnsupportedPublishError):
        publish_to_youtube(post, account, "token-1", {}, media)
