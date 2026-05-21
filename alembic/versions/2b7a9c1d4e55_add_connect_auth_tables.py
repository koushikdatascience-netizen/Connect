"""add connect auth tables

Revision ID: 2b7a9c1d4e55
Revises: 9f3c1b7a2d11
Create Date: 2026-05-21 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2b7a9c1d4e55"
down_revision: Union[str, Sequence[str], None] = "9f3c1b7a2d11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "connect_users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("max_social_accounts", sa.Integer(), nullable=False),
        sa.Column("max_monthly_posts", sa.Integer(), nullable=False),
        sa.Column("email_verified_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_connect_users_email"),
        sa.UniqueConstraint("tenant_id", name="uq_connect_users_tenant_id"),
    )
    op.create_index(op.f("ix_connect_users_email"), "connect_users", ["email"], unique=False)
    op.create_index(op.f("ix_connect_users_tenant_id"), "connect_users", ["tenant_id"], unique=False)

    op.create_table(
        "auth_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("purpose", sa.String(length=40), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("used_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["connect_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_auth_tokens_token_hash"),
    )
    op.create_index(op.f("ix_auth_tokens_id"), "auth_tokens", ["id"], unique=False)
    op.create_index(op.f("ix_auth_tokens_purpose"), "auth_tokens", ["purpose"], unique=False)
    op.create_index(op.f("ix_auth_tokens_token_hash"), "auth_tokens", ["token_hash"], unique=False)
    op.create_index(op.f("ix_auth_tokens_user_id"), "auth_tokens", ["user_id"], unique=False)

    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.connect_users TO social_manager")
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.auth_tokens TO social_manager")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.auth_tokens_id_seq TO social_manager")


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_tokens_user_id"), table_name="auth_tokens")
    op.drop_index(op.f("ix_auth_tokens_token_hash"), table_name="auth_tokens")
    op.drop_index(op.f("ix_auth_tokens_purpose"), table_name="auth_tokens")
    op.drop_index(op.f("ix_auth_tokens_id"), table_name="auth_tokens")
    op.drop_table("auth_tokens")

    op.drop_index(op.f("ix_connect_users_tenant_id"), table_name="connect_users")
    op.drop_index(op.f("ix_connect_users_email"), table_name="connect_users")
    op.drop_table("connect_users")
