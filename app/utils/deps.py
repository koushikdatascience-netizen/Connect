# app/utils/deps.py
from typing import Generator

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser
from app.db.database import SessionLocal, reset_tenant_context, set_request_context


def _request_context(request: Request):
    context = getattr(request.state, "request_context", None)
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request context is missing",
        )
    return context


def get_db(
    request: Request,
) -> Generator[Session, None, None]:
    db = SessionLocal()
    context = _request_context(request)

    try:
        set_request_context(
            db,
            tenant_id=context.tenant_id,
            user_id=context.user_id,
            role=context.role,
        )
        yield db
    finally:
        try:
            reset_tenant_context(db)
        except Exception:
            db.rollback()
        db.close()


def get_tenant(
    request: Request,
) -> str:
    return _request_context(request).tenant_id


def get_current_user(
    request: Request,
) -> CurrentUser:
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to resolve current user",
        )
    return user
