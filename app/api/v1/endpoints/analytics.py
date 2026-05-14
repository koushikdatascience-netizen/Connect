from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.analytics import (
    AnalyticsHeatmapCell,
    AnalyticsOverviewResponse,
    AnalyticsPlatformBreakdownItem,
    AnalyticsSyncResponse,
    AnalyticsTimeseriesResponse,
    AnalyticsTopPostItem,
    AnalyticsWordCloudItem,
)
from app.services.analytics_service import (
    build_heatmap_payload,
    build_overview_payload,
    build_platform_breakdown_payload,
    build_timeseries_payload,
    build_top_posts_payload,
    build_word_cloud_payload,
    sync_tenant_analytics,
)
from app.utils.deps import get_db, get_tenant

router = APIRouter()


def _default_start_date() -> date:
    return (datetime.utcnow() - timedelta(days=29)).date()


def _default_end_date() -> date:
    return datetime.utcnow().date()


def _parse_platforms(platforms: Optional[str]) -> Optional[List[str]]:
    if not platforms:
        return None
    values = [value.strip().lower() for value in platforms.split(",")]
    return [value for value in values if value]


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def analytics_overview(
    start_date: date = Query(default_factory=_default_start_date),
    end_date: date = Query(default_factory=_default_end_date),
    platforms: Optional[str] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return build_overview_payload(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=_parse_platforms(platforms),
        social_account_id=social_account_id,
        post_id=post_id,
    )


@router.get("/timeseries", response_model=AnalyticsTimeseriesResponse)
def analytics_timeseries(
    start_date: date = Query(default_factory=_default_start_date),
    end_date: date = Query(default_factory=_default_end_date),
    platforms: Optional[str] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return build_timeseries_payload(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=_parse_platforms(platforms),
        social_account_id=social_account_id,
        post_id=post_id,
    )


@router.get("/platform-breakdown", response_model=list[AnalyticsPlatformBreakdownItem])
def analytics_platform_breakdown(
    start_date: date = Query(default_factory=_default_start_date),
    end_date: date = Query(default_factory=_default_end_date),
    platforms: Optional[str] = None,
    social_account_id: Optional[int] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return build_platform_breakdown_payload(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=_parse_platforms(platforms),
        social_account_id=social_account_id,
    )


@router.get("/top-posts", response_model=list[AnalyticsTopPostItem])
def analytics_top_posts(
    start_date: date = Query(default_factory=_default_start_date),
    end_date: date = Query(default_factory=_default_end_date),
    limit: int = 10,
    platforms: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    safe_limit = max(1, min(limit, 50))
    return build_top_posts_payload(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        limit=safe_limit,
        platforms=_parse_platforms(platforms),
    )


@router.get("/heatmap/posting-times", response_model=list[AnalyticsHeatmapCell])
def analytics_posting_heatmap(
    start_date: date = Query(default_factory=_default_start_date),
    end_date: date = Query(default_factory=_default_end_date),
    platforms: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    return build_heatmap_payload(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=_parse_platforms(platforms),
    )


@router.get("/topics", response_model=list[AnalyticsWordCloudItem])
def analytics_topics(
    start_date: date = Query(default_factory=_default_start_date),
    end_date: date = Query(default_factory=_default_end_date),
    limit: int = 24,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    safe_limit = max(8, min(limit, 40))
    return build_word_cloud_payload(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        limit=safe_limit,
    )


@router.post("/sync", response_model=AnalyticsSyncResponse)
def analytics_sync_now(
    platforms: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant),
):
    run = sync_tenant_analytics(
        db,
        tenant_id,
        platforms=_parse_platforms(platforms),
    )
    return {
        "sync_run_id": run.id,
        "status": run.status,
        "objects_seen": run.objects_seen,
        "objects_synced": run.objects_synced,
        "error_count": run.error_count,
        "message": "Analytics sync finished",
    }
