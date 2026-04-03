# app/utils/deps.py
from typing import Generator, Optional

from fastapi import Header
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import SessionLocal, reset_tenant_context, set_tenant_context

settings = get_settings()


def _resolve_tenant_id(x_tenant_id: Optional[str]) -> str:
    if x_tenant_id:
        return x_tenant_id
    # TODO: Replace this with proper JWT tenant extraction later
    return "tenant_123"


def get_db(x_tenant_id: Optional[str] = Header(None)) -> Generator[Session, None, None]:
    db = SessionLocal()
    tenant_id = _resolve_tenant_id(x_tenant_id)

    try:
        # Phase 1 RLS support: attach the tenant to the PostgreSQL session.
        set_tenant_context(db, tenant_id)
        yield db
    finally:
        try:
            reset_tenant_context(db)
        except Exception:
            db.rollback()
        db.close()


def get_tenant(x_tenant_id: Optional[str] = Header(None)) -> str:
    """
    Get tenant from header (X-Tenant-ID)
    Fallback for development
    """
    return _resolve_tenant_id(x_tenant_id)


# Optional: Current user dependency (for future JWT)
def get_current_user():
    # Will implement JWT later
    pass
