import json
from typing import Any, Dict, Iterable, List, Optional

import requests

from app.core.logging import get_logger
from app.core.security import decrypt_token
from app.models.media_asset import MediaAsset
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount

logger = get_logger("app.provider_publishers")


class PublishError(Exception):
    def __init__(self, message: str, retryable: bool = True):
        super().__init__(message)
        self.retryable = retryable


class UnsupportedPublishError(PublishError):
    def __init__(self, message: str):
        super().__init__(message, retryable=False)


def _raise_provider_error(provider: str, response: requests.Response, retryable: bool = True) -> None:
    try:
        payload: Any = response.json()
    except Exception:
        payload = response.text

    raise PublishError(
        f"{provider} publish failed ({response.status_code}): {payload}",
        retryable=retryable,
    )


def _normalize_media(media_assets: Optional[Iterable[MediaAsset]]) -> List[MediaAsset]:
    return list(media_assets or [])


def _download_media(media: MediaAsset) -> bytes:
    response = requests.get(media.file_url, timeout=120)
    if not response.ok:
        _raise_provider_error("media-download", response)
    return response.content


def publish_to_provider(
    post: ScheduledPost,
    account: SocialAccount,
    media_assets: Optional[Iterable[MediaAsset]] = None,
) -> str:
    access_token = decrypt_token(account.encrypted_token)
    options = post.platform_options or {}
    normalized_media = _normalize_media(media_assets)

    if post.platform == "facebook":
        return publish_to_facebook(post, account, access_token, options.get("facebook", {}), normalized_media)
    if post.platform == "linkedin":
        return publish_to_linkedin(post, account, access_token, options.get("linkedin", {}), normalized_media)
    if post.platform == "twitter":
        return publish_to_twitter(post, account, access_token, options.get("twitter", {}), normalized_media)
    if post.platform == "instagram":
        return publish_to_instagram(post, account, access_token, options.get("instagram", {}), normalized_media)
    if post.platform == "youtube":
        return publish_to_youtube(post, account, access_token, options.get("youtube", {}), normalized_media)

    raise UnsupportedPublishError(f"Unsupported platform '{post.platform}'")


def publish_to_facebook(
    post: ScheduledPost,
    account: SocialAccount,
    access_token: str,
    options: Dict[str, Any],
    media_assets: List[MediaAsset],
) -> str:
    content = post.content or ""

    if not media_assets:
        if not content:
            raise PublishError("Facebook post content is required", retryable=False)

        payload = {"message": content, "access_token": access_token}
        link = options.get("link")
        if link:
            payload["link"] = link

        response = requests.post(
            f"https://graph.facebook.com/v18.0/{account.platform_account_id}/feed",
            data=payload,
            timeout=30,
        )
        if not response.ok:
            _raise_provider_error("facebook", response)
        return response.json().get("id") or account.platform_account_id

    if len(media_assets) == 1:
        media = media_assets[0]
        if media.file_type == "image":
            response = requests.post(
                f"https://graph.facebook.com/v18.0/{account.platform_account_id}/photos",
                data={
                    "url": media.file_url,
                    "caption": content,
                    "access_token": access_token,
                },
                timeout=60,
            )
            if not response.ok:
                _raise_provider_error("facebook", response)
            return response.json().get("post_id") or response.json().get("id") or account.platform_account_id

        if media.file_type == "video":
            response = requests.post(
                f"https://graph.facebook.com/v18.0/{account.platform_account_id}/videos",
                data={
                    "file_url": media.file_url,
                    "description": content,
                    "title": options.get("title") or "Scheduled video",
                    "access_token": access_token,
                },
                timeout=120,
            )
            if not response.ok:
                _raise_provider_error("facebook", response)
            return response.json().get("id") or account.platform_account_id

        raise UnsupportedPublishError("Facebook publishing currently supports image and video media only.")

    if any(media.file_type != "image" for media in media_assets):
        raise UnsupportedPublishError("Facebook multi-media publishing currently supports image sets only.")

    uploaded_media_ids: List[str] = []
    for media in media_assets:
        response = requests.post(
            f"https://graph.facebook.com/v18.0/{account.platform_account_id}/photos",
            data={
                "url": media.file_url,
                "published": "false",
                "access_token": access_token,
            },
            timeout=60,
        )
        if not response.ok:
            _raise_provider_error("facebook", response)
        uploaded_media_ids.append(response.json().get("id"))

    feed_payload: Dict[str, Any] = {"access_token": access_token, "message": content}
    for index, media_id in enumerate(uploaded_media_ids):
        feed_payload[f"attached_media[{index}]"] = json.dumps({"media_fbid": media_id})

    response = requests.post(
        f"https://graph.facebook.com/v18.0/{account.platform_account_id}/feed",
        data=feed_payload,
        timeout=60,
    )
    if not response.ok:
        _raise_provider_error("facebook", response)
    return response.json().get("id") or account.platform_account_id


def _linkedin_upload_image(access_token: str, author_urn: str, media: MediaAsset) -> str:
    register_response = requests.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
        json={
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": author_urn,
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent",
                    }
                ],
            }
        },
        timeout=60,
    )
    if not register_response.ok:
        _raise_provider_error("linkedin", register_response)

    register_payload = register_response.json().get("value", {})
    upload_url = (
        register_payload.get("uploadMechanism", {})
        .get("com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest", {})
        .get("uploadUrl")
    )
    asset = register_payload.get("asset")
    if not upload_url or not asset:
        raise PublishError("LinkedIn upload registration did not return upload details.", retryable=False)

    upload_response = requests.put(
        upload_url,
        headers={"Content-Type": media.mime_type or "application/octet-stream"},
        data=_download_media(media),
        timeout=180,
    )
    if not upload_response.ok:
        _raise_provider_error("linkedin-upload", upload_response)

    return asset


def publish_to_linkedin(
    post: ScheduledPost,
    account: SocialAccount,
    access_token: str,
    options: Dict[str, Any],
    media_assets: List[MediaAsset],
) -> str:
    if not post.content and not media_assets:
        raise PublishError("LinkedIn post content or media is required", retryable=False)

    author_urn = f"urn:li:person:{account.platform_account_id}"
    visibility = options.get("visibility", "PUBLIC")
    share_content: Dict[str, Any] = {
        "shareCommentary": {"text": post.content or ""},
        "shareMediaCategory": "NONE",
    }

    if media_assets:
        if len(media_assets) > 1 or media_assets[0].file_type != "image":
            raise UnsupportedPublishError("LinkedIn publishing currently supports a single image attachment only.")

        asset = _linkedin_upload_image(access_token, author_urn, media_assets[0])
        share_content = {
            "shareCommentary": {"text": post.content or ""},
            "shareMediaCategory": "IMAGE",
            "media": [
                {
                    "status": "READY",
                    "description": {"text": media_assets[0].alt_text or post.content or "LinkedIn asset"},
                    "media": asset,
                    "title": {"text": options.get("title") or "SocialSync upload"},
                }
            ],
        }

    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {"com.linkedin.ugc.ShareContent": share_content},
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": visibility},
    }

    response = requests.post(
        "https://api.linkedin.com/v2/ugcPosts",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
        json=payload,
        timeout=60,
    )
    if not response.ok:
        _raise_provider_error("linkedin", response)

    return response.headers.get("x-restli-id") or response.json().get("id") or account.platform_account_id


def publish_to_twitter(
    post: ScheduledPost,
    account: SocialAccount,
    access_token: str,
    options: Dict[str, Any],
    media_assets: List[MediaAsset],
) -> str:
    if not post.content and not media_assets:
        raise PublishError("Twitter post content or media is required", retryable=False)

    text = post.content or ""
    if media_assets:
        media_links = " ".join(media.file_url for media in media_assets)
        text = "\n".join(filter(None, [text, media_links]))

    payload: Dict[str, Any] = {"text": text}
    reply_settings = options.get("reply_settings")
    if reply_settings:
        payload["reply_settings"] = reply_settings

    response = requests.post(
        "https://api.twitter.com/2/tweets",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    if not response.ok:
        _raise_provider_error("twitter", response)

    data = response.json().get("data", {})
    return data.get("id") or account.platform_account_id


def publish_to_instagram(
    post: ScheduledPost,
    account: SocialAccount,
    access_token: str,
    options: Dict[str, Any],
    media_assets: List[MediaAsset],
) -> str:
    if len(media_assets) != 1:
        raise UnsupportedPublishError("Instagram publishing currently supports exactly one image or video asset.")

    media = media_assets[0]
    creation_payload: Dict[str, Any] = {
        "caption": post.content or "",
        "access_token": access_token,
    }
    if media.file_type == "image":
        creation_payload["image_url"] = media.file_url
    elif media.file_type == "video":
        creation_payload["video_url"] = media.file_url
        creation_payload["media_type"] = "REELS"
    else:
        raise UnsupportedPublishError("Instagram publishing currently supports image and video assets only.")

    if options.get("caption_mode") == "reel":
        creation_payload["media_type"] = "REELS"

    create_response = requests.post(
        f"https://graph.facebook.com/v18.0/{account.platform_account_id}/media",
        data=creation_payload,
        timeout=60,
    )
    if not create_response.ok:
        _raise_provider_error("instagram", create_response)

    creation_id = create_response.json().get("id")
    if not creation_id:
        raise PublishError("Instagram publish container was not created successfully.", retryable=False)

    publish_response = requests.post(
        f"https://graph.facebook.com/v18.0/{account.platform_account_id}/media_publish",
        data={"creation_id": creation_id, "access_token": access_token},
        timeout=60,
    )
    if not publish_response.ok:
        _raise_provider_error("instagram", publish_response)

    published_id = publish_response.json().get("id") or creation_id
    first_comment = options.get("first_comment")
    if first_comment:
        comment_response = requests.post(
            f"https://graph.facebook.com/v18.0/{published_id}/comments",
            data={"message": first_comment, "access_token": access_token},
            timeout=30,
        )
        if not comment_response.ok:
            logger.warning("instagram.first_comment_failed media_id=%s", published_id)

    return published_id


def publish_to_youtube(
    post: ScheduledPost,
    account: SocialAccount,
    access_token: str,
    options: Dict[str, Any],
    media_assets: List[MediaAsset],
) -> str:
    if len(media_assets) != 1 or media_assets[0].file_type != "video":
        raise UnsupportedPublishError("YouTube publishing currently requires exactly one video asset.")

    media = media_assets[0]
    video_bytes = _download_media(media)
    snippet = {
        "title": options.get("title") or "SocialSync upload",
        "description": post.content or "",
        "tags": options.get("tags") or [],
    }
    status_payload = {"privacyStatus": options.get("privacyStatus", "private")}

    init_response = requests.post(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": media.mime_type or "video/*",
            "X-Upload-Content-Length": str(len(video_bytes)),
        },
        json={"snippet": snippet, "status": status_payload},
        timeout=60,
    )
    if not init_response.ok:
        _raise_provider_error("youtube", init_response)

    upload_url = init_response.headers.get("Location")
    if not upload_url:
        raise PublishError("YouTube resumable upload URL was not returned.", retryable=False)

    upload_response = requests.put(
        upload_url,
        headers={"Content-Type": media.mime_type or "video/*"},
        data=video_bytes,
        timeout=600,
    )
    if not upload_response.ok:
        _raise_provider_error("youtube-upload", upload_response)

    return upload_response.json().get("id") or account.platform_account_id
