"""add analytics tables

Revision ID: 9f3c1b7a2d11
Revises: f0d4e6a2c1ab
Create Date: 2026-05-14 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "9f3c1b7a2d11"
down_revision: Union[str, Sequence[str], None] = "f0d4e6a2c1ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "analytics_subjects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=False),
        sa.Column("subject_type", sa.String(length=30), nullable=False),
        sa.Column("subject_id", sa.String(length=255), nullable=False),
        sa.Column("provider_object_id", sa.String(length=255), nullable=True),
        sa.Column("social_account_id", sa.Integer(), nullable=True),
        sa.Column("scheduled_post_id", sa.Integer(), nullable=True),
        sa.Column("external_permalink", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["scheduled_post_id"], ["scheduled_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["social_account_id"], ["social_accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "subject_type", "scheduled_post_id", name="uq_analytics_subject_post"),
    )
    op.create_index(op.f("ix_analytics_subjects_id"), "analytics_subjects", ["id"], unique=False)
    op.create_index(op.f("ix_analytics_subjects_platform"), "analytics_subjects", ["platform"], unique=False)
    op.create_index(op.f("ix_analytics_subjects_provider_object_id"), "analytics_subjects", ["provider_object_id"], unique=False)
    op.create_index(op.f("ix_analytics_subjects_scheduled_post_id"), "analytics_subjects", ["scheduled_post_id"], unique=False)
    op.create_index(op.f("ix_analytics_subjects_social_account_id"), "analytics_subjects", ["social_account_id"], unique=False)
    op.create_index(op.f("ix_analytics_subjects_tenant_id"), "analytics_subjects", ["tenant_id"], unique=False)

    op.create_table(
        "analytics_metric_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("analytics_subject_id", sa.Integer(), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=False),
        sa.Column("snapshot_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False),
        sa.Column("comments", sa.Integer(), nullable=False),
        sa.Column("shares", sa.Integer(), nullable=False),
        sa.Column("saves", sa.Integer(), nullable=False),
        sa.Column("impressions", sa.Integer(), nullable=False),
        sa.Column("reach", sa.Integer(), nullable=False),
        sa.Column("views", sa.Integer(), nullable=False),
        sa.Column("clicks", sa.Integer(), nullable=False),
        sa.Column("engagements", sa.Integer(), nullable=False),
        sa.Column("raw_metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetch_status", sa.String(length=20), nullable=False),
        sa.Column("fetch_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["analytics_subject_id"], ["analytics_subjects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analytics_metric_snapshots_analytics_subject_id"), "analytics_metric_snapshots", ["analytics_subject_id"], unique=False)
    op.create_index(op.f("ix_analytics_metric_snapshots_id"), "analytics_metric_snapshots", ["id"], unique=False)
    op.create_index(op.f("ix_analytics_metric_snapshots_platform"), "analytics_metric_snapshots", ["platform"], unique=False)
    op.create_index(op.f("ix_analytics_metric_snapshots_snapshot_at"), "analytics_metric_snapshots", ["snapshot_at"], unique=False)
    op.create_index(op.f("ix_analytics_metric_snapshots_tenant_id"), "analytics_metric_snapshots", ["tenant_id"], unique=False)

    op.create_table(
        "analytics_sync_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.String(length=100), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=True),
        sa.Column("social_account_id", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("objects_seen", sa.Integer(), nullable=False),
        sa.Column("objects_synced", sa.Integer(), nullable=False),
        sa.Column("error_count", sa.Integer(), nullable=False),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["social_account_id"], ["social_accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analytics_sync_runs_id"), "analytics_sync_runs", ["id"], unique=False)
    op.create_index(op.f("ix_analytics_sync_runs_platform"), "analytics_sync_runs", ["platform"], unique=False)
    op.create_index(op.f("ix_analytics_sync_runs_social_account_id"), "analytics_sync_runs", ["social_account_id"], unique=False)
    op.create_index(op.f("ix_analytics_sync_runs_tenant_id"), "analytics_sync_runs", ["tenant_id"], unique=False)

    for table in ("analytics_subjects", "analytics_metric_snapshots", "analytics_sync_runs"):
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"REVOKE ALL ON TABLE public.{table} FROM social_manager")
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.{table} TO social_manager")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON public.{table}")
        op.execute(
            f"""
            CREATE POLICY tenant_isolation_policy
            ON public.{table}
            AS PERMISSIVE
            FOR ALL
            TO social_manager
            USING (tenant_id = current_setting('app.tenant_id', true))
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true))
            """
        )

    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.analytics_subjects_id_seq TO social_manager")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.analytics_metric_snapshots_id_seq TO social_manager")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.analytics_sync_runs_id_seq TO social_manager")

    op.execute("DROP TRIGGER IF EXISTS trg_analytics_subjects_updated_at ON public.analytics_subjects")
    op.execute(
        """
        CREATE TRIGGER trg_analytics_subjects_updated_at
        BEFORE UPDATE ON public.analytics_subjects
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_analytics_subjects_updated_at ON public.analytics_subjects")

    for table in ("analytics_sync_runs", "analytics_metric_snapshots", "analytics_subjects"):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON public.{table}")
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")

    op.drop_index(op.f("ix_analytics_sync_runs_tenant_id"), table_name="analytics_sync_runs")
    op.drop_index(op.f("ix_analytics_sync_runs_social_account_id"), table_name="analytics_sync_runs")
    op.drop_index(op.f("ix_analytics_sync_runs_platform"), table_name="analytics_sync_runs")
    op.drop_index(op.f("ix_analytics_sync_runs_id"), table_name="analytics_sync_runs")
    op.drop_table("analytics_sync_runs")

    op.drop_index(op.f("ix_analytics_metric_snapshots_tenant_id"), table_name="analytics_metric_snapshots")
    op.drop_index(op.f("ix_analytics_metric_snapshots_snapshot_at"), table_name="analytics_metric_snapshots")
    op.drop_index(op.f("ix_analytics_metric_snapshots_platform"), table_name="analytics_metric_snapshots")
    op.drop_index(op.f("ix_analytics_metric_snapshots_id"), table_name="analytics_metric_snapshots")
    op.drop_index(op.f("ix_analytics_metric_snapshots_analytics_subject_id"), table_name="analytics_metric_snapshots")
    op.drop_table("analytics_metric_snapshots")

    op.drop_index(op.f("ix_analytics_subjects_tenant_id"), table_name="analytics_subjects")
    op.drop_index(op.f("ix_analytics_subjects_social_account_id"), table_name="analytics_subjects")
    op.drop_index(op.f("ix_analytics_subjects_scheduled_post_id"), table_name="analytics_subjects")
    op.drop_index(op.f("ix_analytics_subjects_provider_object_id"), table_name="analytics_subjects")
    op.drop_index(op.f("ix_analytics_subjects_platform"), table_name="analytics_subjects")
    op.drop_index(op.f("ix_analytics_subjects_id"), table_name="analytics_subjects")
    op.drop_table("analytics_subjects")
