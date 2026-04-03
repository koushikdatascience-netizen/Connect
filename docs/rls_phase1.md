# Phase 1 Text-Based RLS

This project now supports PostgreSQL Row Level Security using the current string tenant IDs like `tenant_123`.

## What changed in the app

- Each request-scoped SQLAlchemy session sets `app.tenant_id` in PostgreSQL.
- Existing app-layer `.filter(Model.tenant_id == tenant_id)` checks are still kept as a safety net.
- `post_media` now includes `tenant_id` so all tenant-facing tables can use direct RLS policies.

## Important limitation

RLS is **not enforced** if the app still connects as the `postgres` superuser, because superusers bypass RLS.

To actually benefit from RLS, change the app to use a non-superuser DB role with `NOBYPASSRLS`.

## Migration

Run:

```powershell
cd D:\SocialSyncV1
docker compose exec backend uv run alembic upgrade head
```

## Recommended database role setup

The migration creates a `social_manager` role with `NOBYPASSRLS`, but it does not assign a password.

Create a login for the app, or convert the role into a login manually in PostgreSQL:

```sql
ALTER ROLE social_manager LOGIN PASSWORD 'replace-with-strong-password';
```

Then update `DATABASE_URL` in [`.env`](/D:/SocialSyncV1/.env) to use `social_manager` instead of `postgres`.

## How the app uses tenant context

For every request, the app sets:

```sql
SELECT set_config('app.tenant_id', '<tenant-id>', false);
```

and resets it when the request-scoped DB session closes.

## Policy shape

Each protected table uses:

```sql
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true))
```

That means:

- Reads only return rows for the active tenant
- Inserts/updates can only write rows for the active tenant
