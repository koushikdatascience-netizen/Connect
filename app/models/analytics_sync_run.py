from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class AnalyticsSyncRun(Base):
    __tablename__ = "analytics_sync_runs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(100), nullable=False, index=True)

    platform = Column(String(50), nullable=True, index=True)
    social_account_id = Column(
        Integer,
        ForeignKey("social_accounts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    started_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="running")

    objects_seen = Column(Integer, nullable=False, default=0)
    objects_synced = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)

    details = Column(JSONB, default=dict, nullable=False)
