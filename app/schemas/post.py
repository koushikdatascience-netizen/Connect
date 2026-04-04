from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PostCreate(BaseModel):
    social_account_id: int
    content: Optional[str] = None
    platform_options: Optional[Dict] = Field(default_factory=dict)
    scheduled_at: Optional[datetime] = None
    media_ids: Optional[List[int]] = Field(default_factory=list)


class PostUpdate(BaseModel):
    content: Optional[str] = None
    platform_options: Optional[Dict] = None
    scheduled_at: Optional[datetime] = None
    media_ids: Optional[List[int]] = None


class PostRead(BaseModel):
    id: int
    social_account_id: int
    tenant_id: str
    platform: str
    content: Optional[str] = None
    platform_options: Dict = Field(default_factory=dict)
    scheduled_at: Optional[datetime] = None
    posted_at: Optional[datetime] = None
    status: str
    retry_count: int
    max_retries: int
    error_message: Optional[str] = None
    platform_post_id: Optional[str] = None
    media_ids: List[int] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PostCreateResponse(BaseModel):
    post_id: int
    status: str
    task_id: Optional[str] = None
