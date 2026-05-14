from fastapi import APIRouter
from app.api.v1.endpoints import account, analytics, auth, oauth, post, media, health, platform

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(platform.router, prefix="/platforms", tags=["platforms"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(account.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(post.router, prefix="/posts", tags=["posts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])
