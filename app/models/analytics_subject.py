from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class AnalyticsSubject(Base):
    __tablename__ = "analytics_subjects"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(100), nullable=False, index=True)

    platform = Column(String(50), nullable=False, index=True)
    subject_type = Column(String(30), nullable=False, default="post")
    subject_id = Column(String(255), nullable=False)
    provider_object_id = Column(String(255), index=True)

    social_account_id = Column(
        Integer,
        ForeignKey("social_accounts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    scheduled_post_id = Column(
        Integer,
        ForeignKey("scheduled_posts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    external_permalink = Column(Text)
    metadata_json = Column("metadata", JSONB, default=dict, nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
