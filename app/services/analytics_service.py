from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from app.crud.analytics import (
    SUPPORTED_ANALYTICS_PLATFORMS,
    complete_sync_run,
    create_snapshot,
    create_sync_run,
    get_analytics_overview,
    get_or_create_post_subject,
    get_previous_range,
    get_social_account,
    get_timeseries_rows,
    list_supported_posts_for_analytics,
)
from app.models.scheduled_post import ScheduledPost
from app.services.provider_publishers import PublishError, UnsupportedPublishError, fetch_provider_live_metrics


ANALYTICS_STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "have",
    "your",
    "into",
    "about",
    "will",
    "just",
    "they",
    "them",
    "been",
    "over",
    "more",
    "than",
    "when",
    "what",
    "where",
    "which",
    "while",
    "http",
    "https",
    "www",
}


def _safe_int(value) -> int:
    try:
        return max(0, int(value or 0))
    except Exception:
        return 0


def _sum_linkedin_reactions(metrics: Dict) -> int:
    reaction_summaries = metrics.get("reactionSummaries")
    if isinstance(reaction_summaries, list):
        total = 0
        for item in reaction_summaries:
            if isinstance(item, dict):
                total += _safe_int(item.get("count") or item.get("total") or item.get("value"))
        return total
    if isinstance(reaction_summaries, dict):
        total = 0
        for item in reaction_summaries.values():
            if isinstance(item, dict):
                total += _safe_int(item.get("count") or item.get("total") or item.get("value"))
            else:
                total += _safe_int(item)
        return total
    return _safe_int(metrics.get("likes"))


def _extract_linkedin_comments(metrics: Dict) -> int:
    comment_summary = metrics.get("commentSummary") or metrics.get("commentsSummary") or {}
    if isinstance(comment_summary, dict):
        return _safe_int(
            comment_summary.get("count")
            or comment_summary.get("total")
            or comment_summary.get("totalFirstLevelComments")
        )
    return _safe_int(metrics.get("comments"))


def normalize_provider_metrics(platform: str, metrics: Dict) -> Dict[str, int]:
    if platform == "instagram":
        likes = _safe_int(metrics.get("likes") or metrics.get("like_count"))
        comments = _safe_int(metrics.get("comments") or metrics.get("comments_count"))
        shares = _safe_int(metrics.get("shares"))
        saves = _safe_int(metrics.get("saved") or metrics.get("saves"))
        impressions = _safe_int(metrics.get("impressions"))
        reach = _safe_int(metrics.get("reach"))
        views = _safe_int(metrics.get("videoViews") or metrics.get("video_views") or metrics.get("views"))
        clicks = _safe_int(metrics.get("clicks"))
    elif platform == "facebook":
        likes = _safe_int(metrics.get("likes"))
        comments = _safe_int(metrics.get("comments"))
        shares = _safe_int(metrics.get("shares"))
        saves = _safe_int(metrics.get("saves"))
        impressions = _safe_int(metrics.get("impressions"))
        reach = _safe_int(metrics.get("reach"))
        views = _safe_int(metrics.get("views"))
        clicks = _safe_int(metrics.get("clicks"))
    elif platform == "twitter":
        likes = _safe_int(metrics.get("likeCount") or metrics.get("likes"))
        comments = _safe_int(metrics.get("replyCount") or metrics.get("comments"))
        shares = _safe_int(metrics.get("retweetCount")) + _safe_int(metrics.get("quoteCount")) + _safe_int(metrics.get("shares"))
        saves = _safe_int(metrics.get("bookmarkCount") or metrics.get("saves"))
        impressions = _safe_int(metrics.get("impressionCount") or metrics.get("impressions"))
        reach = _safe_int(metrics.get("reach"))
        views = _safe_int(metrics.get("viewCount") or metrics.get("views"))
        clicks = _safe_int(metrics.get("urlLinkClicks") or metrics.get("clicks"))
    elif platform == "youtube":
        likes = _safe_int(metrics.get("likeCount") or metrics.get("likes"))
        comments = _safe_int(metrics.get("commentCount") or metrics.get("comments"))
        shares = _safe_int(metrics.get("shares"))
        saves = _safe_int(metrics.get("saves"))
        impressions = _safe_int(metrics.get("impressions"))
        reach = _safe_int(metrics.get("reach"))
        views = _safe_int(metrics.get("viewCount") or metrics.get("views"))
        clicks = _safe_int(metrics.get("clicks"))
    elif platform == "linkedin":
        likes = _sum_linkedin_reactions(metrics)
        comments = _extract_linkedin_comments(metrics)
        shares = _safe_int(metrics.get("shares"))
        saves = _safe_int(metrics.get("saves"))
        impressions = _safe_int(metrics.get("impressions"))
        reach = _safe_int(metrics.get("reach"))
        views = _safe_int(metrics.get("views"))
        clicks = _safe_int(metrics.get("clicks"))
    else:
        likes = comments = shares = saves = impressions = reach = views = clicks = 0

    engagements = likes + comments + shares + saves + clicks
    return {
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "saves": saves,
        "impressions": impressions,
        "reach": reach,
        "views": views,
        "clicks": clicks,
        "engagements": engagements,
    }


def fetch_normalized_post_metrics(post: ScheduledPost, account) -> tuple[Dict[str, int], Dict]:
    raw_metrics = fetch_provider_live_metrics(post, account)
    return normalize_provider_metrics(post.platform, raw_metrics), raw_metrics


def seed_post_snapshot(
    db: Session,
    tenant_id: str,
    post: ScheduledPost,
    account,
    *,
    snapshot_at: Optional[datetime] = None,
):
    """
    Create a zeroed analytics snapshot immediately after publish.

    This makes a freshly posted item appear in analytics right away, even if
    the provider does not return live metrics until a later sync window.
    """
    subject = get_or_create_post_subject(db, tenant_id, post, account)
    normalized_metrics = {
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "saves": 0,
        "impressions": 0,
        "reach": 0,
        "views": 0,
        "clicks": 0,
        "engagements": 0,
    }
    snapshot = create_snapshot(
        db,
        tenant_id,
        subject,
        normalized_metrics=normalized_metrics,
        raw_metrics={},
        snapshot_at=snapshot_at,
        fetch_status="pending",
        fetch_message="Initial snapshot seeded at publish time. Live metrics will populate on the next sync.",
    )
    return subject, snapshot


def sync_post_snapshot(db: Session, tenant_id: str, post: ScheduledPost, *, snapshot_at: Optional[datetime] = None):
    account = get_social_account(db, tenant_id, post.social_account_id)
    if not account:
        raise UnsupportedPublishError("Connected account not found for analytics sync.")

    subject = get_or_create_post_subject(db, tenant_id, post, account)
    normalized_metrics, raw_metrics = fetch_normalized_post_metrics(post, account)
    snapshot = create_snapshot(
        db,
        tenant_id,
        subject,
        normalized_metrics=normalized_metrics,
        raw_metrics=raw_metrics,
        snapshot_at=snapshot_at,
    )
    return subject, snapshot


def sync_tenant_analytics(
    db: Session,
    tenant_id: str,
    *,
    platforms: Optional[Iterable[str]] = None,
    snapshot_at: Optional[datetime] = None,
):
    run = create_sync_run(db, tenant_id, platform=",".join(platforms or []) or None)
    posts = list_supported_posts_for_analytics(db, tenant_id, platforms=platforms)

    synced = 0
    errors = 0
    error_messages: List[str] = []

    for post in posts:
        try:
            sync_post_snapshot(db, tenant_id, post, snapshot_at=snapshot_at)
            synced += 1
        except (UnsupportedPublishError, PublishError) as exc:
            errors += 1
            error_messages.append(f"Post {post.id}: {exc}")
        except Exception as exc:
            errors += 1
            error_messages.append(f"Post {post.id}: {exc}")

    status = "success"
    if errors and synced:
        status = "partial"
    elif errors and not synced:
        status = "failed"

    complete_sync_run(
        db,
        run,
        status=status,
        objects_seen=len(posts),
        objects_synced=synced,
        error_count=errors,
        details={"errors": error_messages[:25]},
    )
    db.commit()
    return run


def sync_all_tenants_analytics(db: Session):
    tenant_rows = (
        db.query(ScheduledPost.tenant_id)
        .filter(
            ScheduledPost.status == "posted",
            ScheduledPost.platform_post_id.isnot(None),
            ScheduledPost.platform.in_(list(SUPPORTED_ANALYTICS_PLATFORMS)),
        )
        .distinct()
        .all()
    )
    results = []
    for row in tenant_rows:
        tenant_id = row[0]
        results.append(sync_tenant_analytics(db, tenant_id))
    return results


def _aggregate_metric_dict(rows) -> Dict[str, int]:
    totals = {
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "saves": 0,
        "impressions": 0,
        "reach": 0,
        "views": 0,
        "clicks": 0,
        "engagements": 0,
    }
    for snapshot, *_ in rows:
        for key in totals:
            totals[key] += _safe_int(getattr(snapshot, key, 0))
    return totals


def _compute_rate(engagements: int, impressions: int) -> float:
    return round((engagements / impressions) if impressions else 0.0, 4)


def build_overview_payload(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    platforms: Optional[Iterable[str]] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
):
    rows = get_analytics_overview(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
        social_account_id=social_account_id,
        post_id=post_id,
    )
    totals = _aggregate_metric_dict(rows)
    totals["engagement_rate"] = _compute_rate(totals["engagements"], totals["impressions"])

    prev_start, prev_end = get_previous_range(start_date, end_date)
    previous_rows = get_analytics_overview(
        db,
        tenant_id,
        start_date=prev_start,
        end_date=prev_end,
        platforms=platforms,
        social_account_id=social_account_id,
        post_id=post_id,
    )
    previous = _aggregate_metric_dict(previous_rows)
    previous["engagement_rate"] = _compute_rate(previous["engagements"], previous["impressions"])

    deltas: Dict[str, float] = {}
    for key, value in totals.items():
        previous_value = previous.get(key, 0)
        if previous_value:
            deltas[key] = round((value - previous_value) / previous_value, 4)
        else:
            deltas[key] = 1.0 if value else 0.0

    return {
        "range": {"from": start_date, "to": end_date},
        "compare_range": {"from": prev_start, "to": prev_end},
        "totals": totals,
        "deltas": deltas,
    }


def build_timeseries_payload(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    platforms: Optional[Iterable[str]] = None,
    social_account_id: Optional[int] = None,
    post_id: Optional[int] = None,
):
    rows = get_timeseries_rows(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
        social_account_id=social_account_id,
        post_id=post_id,
    )
    latest_per_subject_day: Dict[tuple[int, datetime], object] = {}
    for snapshot, *_ in rows:
        bucket_day = snapshot.snapshot_at.replace(hour=0, minute=0, second=0, microsecond=0)
        key = (snapshot.analytics_subject_id, bucket_day)
        current = latest_per_subject_day.get(key)
        if current is None or snapshot.snapshot_at > current.snapshot_at:
            latest_per_subject_day[key] = snapshot

    bucket_map: Dict[datetime, Dict[str, int]] = defaultdict(
        lambda: {
            "likes": 0,
            "comments": 0,
            "shares": 0,
            "saves": 0,
            "impressions": 0,
            "reach": 0,
            "views": 0,
            "clicks": 0,
            "engagements": 0,
        }
    )
    for snapshot in latest_per_subject_day.values():
        bucket = snapshot.snapshot_at.replace(hour=0, minute=0, second=0, microsecond=0)
        target = bucket_map[bucket]
        for metric in target:
            target[metric] += _safe_int(getattr(snapshot, metric, 0))

    points = [
        {"timestamp": timestamp, **metrics}
        for timestamp, metrics in sorted(bucket_map.items(), key=lambda item: item[0])
    ]
    return {
        "range": {"from": start_date, "to": end_date},
        "interval": "daily",
        "points": points,
    }


def build_platform_breakdown_payload(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    platforms: Optional[Iterable[str]] = None,
    social_account_id: Optional[int] = None,
):
    rows = get_analytics_overview(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
        social_account_id=social_account_id,
    )
    platform_map: Dict[str, Dict[str, float]] = {}
    post_counts: Dict[str, set] = defaultdict(set)
    for snapshot, subject, post, _account in rows:
        bucket = platform_map.setdefault(
            snapshot.platform,
            {
                "platform": snapshot.platform,
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "saves": 0,
                "impressions": 0,
                "reach": 0,
                "views": 0,
                "clicks": 0,
                "engagements": 0,
            },
        )
        for key in ("likes", "comments", "shares", "saves", "impressions", "reach", "views", "clicks", "engagements"):
            bucket[key] += _safe_int(getattr(snapshot, key, 0))
        if post:
            post_counts[snapshot.platform].add(post.id)
        elif subject.scheduled_post_id:
            post_counts[snapshot.platform].add(subject.scheduled_post_id)

    items = []
    for platform, bucket in platform_map.items():
        bucket["post_count"] = len(post_counts.get(platform, set()))
        bucket["engagement_rate"] = _compute_rate(bucket["engagements"], bucket["impressions"])
        items.append(bucket)
    return sorted(items, key=lambda item: item["engagements"], reverse=True)


def build_top_posts_payload(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    limit: int = 10,
    platforms: Optional[Iterable[str]] = None,
):
    rows = get_analytics_overview(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
    )
    items = []
    for snapshot, subject, post, account in rows:
        if not post:
            continue
        content_preview = (post.content or "").strip()
        if len(content_preview) > 140:
            content_preview = f"{content_preview[:137]}..."
        permalink = None
        if isinstance(post.platform_options, dict):
            permalink = post.platform_options.get("_published_permalink")
        item = {
            "post_id": post.id,
            "platform": post.platform,
            "social_account_id": post.social_account_id,
            "account_name": account.account_name if account else None,
            "content_preview": content_preview or None,
            "posted_at": post.posted_at,
            "permalink": permalink,
            "likes": snapshot.likes,
            "comments": snapshot.comments,
            "shares": snapshot.shares,
            "saves": snapshot.saves,
            "impressions": snapshot.impressions,
            "reach": snapshot.reach,
            "views": snapshot.views,
            "clicks": snapshot.clicks,
            "engagements": snapshot.engagements,
            "engagement_rate": _compute_rate(snapshot.engagements, snapshot.impressions),
            "raw_metrics": snapshot.raw_metrics,
        }
        items.append(item)
    items.sort(key=lambda item: (item["engagements"], item["impressions"], item["views"]), reverse=True)
    return items[:limit]


def build_heatmap_payload(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    platforms: Optional[Iterable[str]] = None,
):
    rows = get_analytics_overview(
        db,
        tenant_id,
        start_date=start_date,
        end_date=end_date,
        platforms=platforms,
    )
    buckets: Dict[tuple[int, int], Dict[str, int]] = defaultdict(
        lambda: {"engagements": 0, "impressions": 0, "post_count": 0}
    )
    for snapshot, _subject, post, _account in rows:
        if not post or not post.posted_at:
            continue
        key = (post.posted_at.weekday(), post.posted_at.hour)
        bucket = buckets[key]
        bucket["engagements"] += snapshot.engagements
        bucket["impressions"] += snapshot.impressions
        bucket["post_count"] += 1
    payload = []
    for weekday in range(7):
        for hour in range(24):
            bucket = buckets.get((weekday, hour), {"engagements": 0, "impressions": 0, "post_count": 0})
            payload.append(
                {
                    "weekday": weekday,
                    "hour": hour,
                    "engagements": bucket["engagements"],
                    "impressions": bucket["impressions"],
                    "engagement_rate": _compute_rate(bucket["engagements"], bucket["impressions"]),
                    "post_count": bucket["post_count"],
                }
            )
    return payload


def build_word_cloud_payload(
    db: Session,
    tenant_id: str,
    *,
    start_date: date,
    end_date: date,
    limit: int = 24,
):
    rows = get_analytics_overview(db, tenant_id, start_date=start_date, end_date=end_date)
    counter: Counter[str] = Counter()
    for _snapshot, _subject, post, _account in rows:
        if not post or not post.content:
            continue
        normalized = (
            post.content.replace("\n", " ")
            .replace(",", " ")
            .replace(".", " ")
            .replace("!", " ")
            .replace("?", " ")
            .replace("#", " ")
            .replace("/", " ")
        )
        for token in normalized.split():
            cleaned = token.strip().lower()
            if len(cleaned) < 4 or cleaned.isdigit() or cleaned in ANALYTICS_STOP_WORDS:
                continue
            counter[cleaned] += 1
    return [{"term": term, "weight": weight} for term, weight in counter.most_common(limit)]
