from pydantic import BaseModel, ConfigDict
from typing import Optional


class MediaRead(BaseModel):
    id: int
    tenant_id: str
    file_url: str
    file_type: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    width_px: Optional[int] = None
    height_px: Optional[int] = None
    duration_seconds: Optional[int] = None
    alt_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MediaUpdate(BaseModel):
    alt_text: Optional[str] = None


class MediaUploadResponse(BaseModel):
    id: int
    file_url: str
    file_type: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    width_px: Optional[int] = None
    height_px: Optional[int] = None
    duration_seconds: Optional[int] = None
    alt_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
