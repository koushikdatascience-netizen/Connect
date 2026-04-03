"""phase 1 text-based RLS

Revision ID: f0d4e6a2c1ab
Revises: 30b1e69702cd
Create Date: 2026-04-03 15:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f0d4e6a2c1ab"
down_revision: Union[str, Sequence[str], None] = "30b1e69702cd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = (
    "social_accounts",
    "media_assets",
    "scheduled_posts",
    "post_media",
)


def upgrade() -> None:
    op.add_column(
        "post_media",
        sa.Column("tenant_id", sa.String(length=100), nullable=True),
    )
    op.execute(
        """
        UPDATE post_media pm
        SET tenant_id = sp.tenant_id
        FROM scheduled_posts sp
        WHERE sp.id = pm.post_id
        """
    )
    op.alter_column("post_media", "tenant_id", nullable=False)
    op.create_index("idx_post_media_tenant", "post_media", ["tenant_id"], unique=False)
    op.create_unique_constraint("uq_post_media_post_media", "post_media", ["post_id", "media_asset_id"])

    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'social_manager') THEN
            CREATE ROLE social_manager
              NOSUPERUSER
              NOINHERIT
              NOCREATEDB
              NOCREATEROLE
              NOREPLICATION
              NOBYPASSRLS;
          END IF;
        END
        $$;
        """
    )
    op.execute("GRANT USAGE ON SCHEMA public TO social_manager")

    for table in TABLES:
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

    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.social_accounts_id_seq TO social_manager")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.media_assets_id_seq TO social_manager")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.scheduled_posts_id_seq TO social_manager")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE public.post_media_id_seq TO social_manager")

    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.set_updated_at()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON public.social_accounts")
    op.execute(
        """
        CREATE TRIGGER trg_social_accounts_updated_at
        BEFORE UPDATE ON public.social_accounts
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_scheduled_posts_updated_at ON public.scheduled_posts")
    op.execute(
        """
        CREATE TRIGGER trg_scheduled_posts_updated_at
        BEFORE UPDATE ON public.scheduled_posts
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_scheduled_posts_updated_at ON public.scheduled_posts")
    op.execute("DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON public.social_accounts")

    for table in TABLES:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON public.{table}")
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")

    op.drop_constraint("uq_post_media_post_media", "post_media", type_="unique")
    op.drop_index("idx_post_media_tenant", table_name="post_media")
    op.drop_column("post_media", "tenant_id")

