from pathlib import Path
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.crud.media import create_media_asset, get_media_asset

settings = get_settings()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
    "video/x-m4v",
}


def _detect_file_type(content_type: Optional[str], filename: Optional[str]) -> str:
    if content_type:
        if content_type.startswith("image/"):
            return "image"
        if content_type.startswith("video/"):
            return "video"

    suffix = Path(filename or "").suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    return "raw"


def upload_to_cloudinary(file: UploadFile, tenant_id: str) -> Dict[str, Any]:
    file.file.seek(0)
    file_type = _detect_file_type(file.content_type, file.filename)

    folder = f"socialsync/{tenant_id}/{file_type}s"
    public_id = Path(file.filename or "upload").stem

    if file_type == "video":
        result = cloudinary.uploader.upload_large(
            file.file,
            resource_type="video",
            folder=folder,
            public_id=public_id,
            overwrite=False,
        )
    elif file_type == "image":
        result = cloudinary.uploader.upload(
            file.file,
            resource_type="image",
            folder=folder,
            public_id=public_id,
            overwrite=False,
        )
    else:
        result = cloudinary.uploader.upload(
            file.file,
            resource_type="raw",
            folder=folder,
            public_id=public_id,
            overwrite=False,
        )

    return {
        "file_url": result.get("secure_url") or result.get("url"),
        "file_type": file_type,
        "mime_type": file.content_type,
        "file_size_bytes": result.get("bytes"),
        "width_px": result.get("width"),
        "height_px": result.get("height"),
        "duration_seconds": int(result["duration"]) if result.get("duration") else None,
    }


def create_media_from_upload(
    db: Session,
    tenant_id: str,
    file: UploadFile,
    alt_text: Optional[str] = None,
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required",
        )

    suffix = Path(file.filename).suffix.lower()
    content_type = (file.content_type or "").lower()
    file_type = _detect_file_type(content_type, file.filename)
    if file_type == "raw":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported media type. Upload an image or video file.",
        )
    if file_type == "image" and (suffix not in IMAGE_EXTENSIONS or content_type not in ALLOWED_IMAGE_MIME_TYPES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type.",
        )
    if file_type == "video" and (suffix not in VIDEO_EXTENSIONS or content_type not in ALLOWED_VIDEO_MIME_TYPES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video type.",
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.MEDIA_MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Media file is too large.",
        )

    uploaded = upload_to_cloudinary(file, tenant_id)

    return create_media_asset(
        db=db,
        tenant_id=tenant_id,
        file_url=uploaded["file_url"],
        file_type=uploaded["file_type"],
        mime_type=uploaded["mime_type"],
        file_size_bytes=uploaded["file_size_bytes"],
        width_px=uploaded["width_px"],
        height_px=uploaded["height_px"],
        duration_seconds=uploaded["duration_seconds"],
        alt_text=alt_text,
    )


def _extract_public_id_from_url(file_url: str) -> Optional[str]:
    try:
        path = urlparse(file_url).path
        marker = "/upload/"
        if marker not in path:
            return None

        after_upload = path.split(marker, 1)[1]
        parts = after_upload.split("/")

        if parts and parts[0].startswith("v") and parts[0][1:].isdigit():
            parts = parts[1:]

        if not parts:
            return None

        last = parts[-1]
        stem = ".".join(last.split(".")[:-1]) if "." in last else last
        parts[-1] = stem
        return "/".join(parts)
    except Exception:
        return None


def delete_media_from_cloudinary(file_url: str, file_type: str) -> bool:
    public_id = _extract_public_id_from_url(file_url)
    if not public_id:
        return False

    if file_type == "image":
        resource_type = "image"
    elif file_type == "video":
        resource_type = "video"
    else:
        resource_type = "raw"

    result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    return result.get("result") in {"ok", "not found"}


def delete_media_asset_and_file(db: Session, tenant_id: str, media_id: int) -> bool:
    media = get_media_asset(db, tenant_id, media_id)
    if not media:
        return False

    delete_media_from_cloudinary(media.file_url, media.file_type)
    db.delete(media)
    db.commit()
    return True
