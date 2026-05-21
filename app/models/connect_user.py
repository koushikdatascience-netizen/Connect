from datetime import datetime

from sqlalchemy import Boolean, Column, Integer, String, TIMESTAMP, Text

from app.db.base import Base


class ConnectUser(Base):
    __tablename__ = "connect_users"

    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(32), nullable=False)
    password_hash = Column(Text, nullable=False)
    status = Column(String(40), nullable=False, default="pending_review")
    is_admin = Column(Boolean, nullable=False, default=False)
    max_social_accounts = Column(Integer, nullable=False, default=2)
    max_monthly_posts = Column(Integer, nullable=False, default=20)
    email_verified_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
