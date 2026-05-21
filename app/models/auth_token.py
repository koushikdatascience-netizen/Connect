from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP

from app.db.base import Base


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("connect_users.id", ondelete="CASCADE"), nullable=False, index=True)
    purpose = Column(String(40), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    used_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
