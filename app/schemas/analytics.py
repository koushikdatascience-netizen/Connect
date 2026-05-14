from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AnalyticsOverviewTotals(BaseModel):
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    impressions: int = 0
    reach: int = 0
    views: int = 0
    clicks: int = 0
    engagements: int = 0
    engagement_rate: float = 0.0


class AnalyticsOverviewResponse(BaseModel):
    range: Dict[str, date]
    compare_range: Optional[Dict[str, date]] = None
    totals: AnalyticsOverviewTotals
    deltas: Dict[str, float] = Field(default_factory=dict)


class AnalyticsTimeseriesPoint(BaseModel):
    timestamp: datetime
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    impressions: int = 0
    reach: int = 0
    views: int = 0
    clicks: int = 0
    engagements: int = 0


class AnalyticsTimeseriesResponse(BaseModel):
    range: Dict[str, date]
    interval: str
    points: List[AnalyticsTimeseriesPoint] = Field(default_factory=list)


class AnalyticsPlatformBreakdownItem(BaseModel):
    platform: str
    post_count: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    impressions: int = 0
    reach: int = 0
    views: int = 0
    clicks: int = 0
    engagements: int = 0
    engagement_rate: float = 0.0


class AnalyticsTopPostItem(BaseModel):
    post_id: int
    platform: str
    social_account_id: Optional[int] = None
    account_name: Optional[str] = None
    content_preview: Optional[str] = None
    posted_at: Optional[datetime] = None
    permalink: Optional[str] = None
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    impressions: int = 0
    reach: int = 0
    views: int = 0
    clicks: int = 0
    engagements: int = 0
    engagement_rate: float = 0.0
    raw_metrics: Dict[str, Any] = Field(default_factory=dict)


class AnalyticsHeatmapCell(BaseModel):
    weekday: int
    hour: int
    engagements: int = 0
    impressions: int = 0
    engagement_rate: float = 0.0
    post_count: int = 0


class AnalyticsWordCloudItem(BaseModel):
    term: str
    weight: int


class AnalyticsSyncResponse(BaseModel):
    sync_run_id: int
    status: str
    objects_seen: int
    objects_synced: int
    error_count: int
    message: Optional[str] = None
