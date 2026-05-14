from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Dict, Iterable, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.analytics_metric_snapshot import AnalyticsMetricSnapshot
from app.models.analytics_subject import AnalyticsSubject
from app.models.analytics_sync_run import AnalyticsSyncRun
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount


SUPPORTED_ANALYTICS_PLATFORMS = {"instagram", "facebook", "twitter", "youtube", "linkedin"}


def _as_utc_start(value: Optional[date]) -> datetime:
    value = value or datetime.utcnow().date()
    return datetime.combine(value, time.min).replace(tzinfo=timezone.utc)


def _as_utc_end(value: Optional[date]) -> datetime:
    value = value or datetime.utcnow().date()
    return datetime.combine(value, time.max).replace(tzinfo=timezone.utc)


def list_supported_posts_for_analytics(
    db: Session,
    tenant_id: str,
    platforms: Optional[Iterable[str]] = None,
) -> List[ScheduledPost]:
    platform_values = [platform for platform in (platforms or []) if platform]
    query = (
        db.query(ScheduledPost)
        .filter(
            ScheduledPost.tenant_id == tenant_id,
            ScheduledPost.status == "posted",
            ScheduledPost.platform_post_id.isnot(None),
            ScheduledPost.platform.in_(SUPPORTED_ANALYTICS_PLATFORMS),
        )
        .order_by(ScheduledPost.posted_at.desc().nullslast(), ScheduledPost.id.desc())
    )
    if platform_values:
        query = query.filter(ScheduledPost.platform.in_(platform_values))
    return query.all()


def get_social_account(db: Session, tenant_id: str, account_id: int) -> Optional[SocialAccount]:
    return (
        db.query(SocialAccount)
        .filter(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.id == account_id,
        )
        .first()
    )


def get_or_create_post_subject(
    db: Session,
    tenant_id: str,
    post: ScheduledPost,
    account: Optional[SocialAccount],
) -> AnalyticsSubject:
    subject = (
        db.query(AnalyticsSubject)
        .filter(
            AnalyticsSubject.tenant_id == tenant_id,
            AnalyticsSubject.subject_type == "post",
            AnalyticsSubject.scheduled_post_id == post.id,
        )
        .first()
    )
    permalink = None
    if isinstance(post.platform_options, dict):
        permalink = post.platform_options.get("_published_permalink")
    metadata = {
        "platform_post_id": post.platform_post_id,
        "posted_at": post.posted_at.isoformat() if post.posted_at else None,
    }
    if subject:
        subject.platform = post.platform
        subject.subject_id = str(post.id)
        subject.provider_object_id = post.platform_post_id
        subject.social_account_id = post.social_account_id
        subject.external_permalink = permalink
        subject.metadata_json = metadata
        return subject

    subject = AnalyticsSubject(
        tenant_id=tenant_id,
        platform=post.platform,
        subject_type="post",
        subject_id=str(post.id),
        provider_object_id=post.platform_post_id,
        social_account_id=account.id if account else post.social_account_id,
        scheduled_post_id=post.id,
        external_permalink=permalink,
        metadata_json=metadata,
    )
    db.add(subject)
    db.flush()
    return subject


def create_snapshot(
    db: Session,
    tenant_id: str,
    subject: AnalyticsSubject,
    normalized_metrics: Dict[str, int],
    raw_metrics: Dict,
    snapshot_at: Optional[datetime] = None,
    fetch_status: str = "success",
    fetch_message: Optional[str] = None,
) -> AnalyticsMetricSnapshot:
    timestamp = snapshot_at or datetime.utcnow().replace(tzinfo=timezone.utc)
    snapshot = AnalyticsMetricSnapshot(
        tenant_id=tenant_id,
        analytics_subject_id=subject.id,
        platform=subject.platform,
        snapshot_at=timestamp,
        likes=int(normalized_metrics.get("likes", 0)),
        comments=int(normalized_metrics.get("comments", 0)),
        shares=int(normalized_metrics.get("shares", 0)),
        saves=int(normalized_metrics.get("saves", 0)),
        impressions=int(normalized_metrics.get("impressions", 0)),
        reach=int(normalized_metrics.get("reach", 0)),
        views=int(normalized_metrics.get("views", 0)),
        clicks=int(normalized_metrics.get("clicks", 0)),
        engagements=int(normalized_metrics.get("engagements", 0)),
        raw_metrics=raw_metrics or {},
        fetch_status=fetch_status,
        fetch_message=fetch_message,
    )
    db.add(snapshot)
    db.flush()
    return snapshot


def create_sync_run(
    db: Session,
    tenant_id: str,
    platform: Optional[str] = None,
    social_account_id: Optional[int] = None,
) -> AnalyticsSyncRun:
    run = AnalyticsSyncRun(
        tenant_id=tenant_id,
        platform=platform,
        social_account_id=social_account_id,
        status="running",
        started_at=datetime.utcnow().replace(tzinfo=timezone.utc),
        details={},
    )
    db.add(run)
    db.flush()
    return run


def complete_sync_run(
    db: Session,
    run: AnalyticsSyncRun,
    *,
    status: str,
    objects_seen: int,
    objects_synced: int,
    error_count: int,
    details: Optional[Dict] = None,
) -> AnalyticsSyncRun:
    run.status = status
    run.objects_seen = objects_seen
    run.objects_synced = objects_synced
    run.error_count = error_count
    run.completed_at = datetime.utcnow().replace(tzinfo=timezone.utc)
    run.details = details or {}
    db.flush()
    return run


def _latest_snapshot_subquery(
    db: Session,
    tenant_id: str,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    query = (
        db.query(
            AnalyticsMetricSnapshot.analytics_subject_id.label("analytics_subject_id"),
            func.max(AnalyticsMetricSnapshot.snapshot_at).label("max_snapshot_at"),
        )
        .filter(AnalyticsMetricSnapshot.tenant_id == tenant_id)
        .group_by(AnalyticsMetricSnapshot.analytics_subject_id)
    )
    if start_date:
        query = query.filter(AnalyticsMetricSnapshot.snapshot_at >= _as_utc_start(start_date))
    if end_date:
        query = query.filter(AnalyticsMetricSnapshot.snapshot_at <= _as_utc_end(end_date))
    return query.subquery()


def _snapshot_query(
    db: Session,
    tenant_id: str,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platforms: Optional[Iterable[str]] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
    latest_only: bool = False,
):
    query = (
        db.query(
            AnalyticsMetricSnapshot,
            AnalyticsSubject,
            ScheduledPost,
            SocialAccount,
        )
        .join(AnalyticsSubject, AnalyticsSubject.id == AnalyticsMetricSnapshot.analytics_subject_id)
        .outerjoin(ScheduledPost, ScheduledPost.id == AnalyticsSubject.scheduled_post_id)
        .outerjoin(SocialAccount, SocialAccount.id == AnalyticsSubject.social_account_id)
        .filter(
            AnalyticsMetricSnapshot.tenant_id == tenant_id,
            AnalyticsSubject.tenant_id == tenant_id,
        )
    )

    if start_date:
        query = query.filter(AnalyticsMetricSnapshot.snapshot_at >= _as_utc_start(start_date))
    if end_date:
        query = query.filter(AnalyticsMetricSnapshot.snapshot_at <= _as_utc_end(end_date))
    if platforms:
        query = query.filter(AnalyticsMetricSnapshot.platform.in_([p for p in platforms if p]))
    if social_account_id:
        query = query.filter(AnalyticsSubject.social_account_id == social_account_id)
    if post_id:
        query = query.filter(AnalyticsSubject.scheduled_post_id == post_id)
    if latest_only:
        latest = _latest_snapshot_subquery(db, tenant_id, start_date=start_date, end_date=end_date)
        query = query.join(
            latest,
            (latest.c.analytics_subject_id == AnalyticsMetricSnapshot.analytics_subject_id)
            & (latest.c.max_snapshot_at == AnalyticsMetricSnapshot.snapshot_at),
        )
    return query


def get_analytics_overview(
    db: Session,
    tenant_id: str,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platforms: Optional[Iterable[str]] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
):
    rows = _snapshot_query(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
        social_account_id=social_account_id,
        post_id=post_id,
        latest_only=True,
    ).all()
    return rows


def get_previous_range(start_date: date, end_date: date) -> tuple[date, date]:
    delta = end_date - start_date
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - delta
    return prev_start, prev_end


def get_timeseries_rows(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    platforms: Optional[Iterable[str]] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
):
    return _snapshot_query(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
        social_account_id=social_account_id,
        post_id=post_id,
        latest_only=False,
    ).all()
