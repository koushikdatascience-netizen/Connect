from sqlalchemy import Column, Integer, ForeignKey, String
from app.db.base import Base

class PostMedia(Base):
    __tablename__ = "post_media"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(100), nullable=False, index=True)

    post_id = Column(
        Integer,
        ForeignKey("scheduled_posts.id", ondelete="CASCADE"),
        nullable=False
    )

    media_asset_id = Column(
        Integer,
        ForeignKey("media_assets.id"),
        nullable=False
    )

    display_order = Column(Integer, default=0, nullable=False)
