from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class AnalyticsMetricSnapshot(Base):
    __tablename__ = "analytics_metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(100), nullable=False, index=True)

    analytics_subject_id = Column(
        Integer,
        ForeignKey("analytics_subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    platform = Column(String(50), nullable=False, index=True)
    snapshot_at = Column(TIMESTAMP(timezone=True), nullable=False, index=True)

    likes = Column(Integer, nullable=False, default=0)
    comments = Column(Integer, nullable=False, default=0)
    shares = Column(Integer, nullable=False, default=0)
    saves = Column(Integer, nullable=False, default=0)
    impressions = Column(Integer, nullable=False, default=0)
    reach = Column(Integer, nullable=False, default=0)
    views = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    engagements = Column(Integer, nullable=False, default=0)

    raw_metrics = Column(JSONB, default=dict, nullable=False)
    fetch_status = Column(String(20), nullable=False, default="success")
    fetch_message = Column(Text)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
