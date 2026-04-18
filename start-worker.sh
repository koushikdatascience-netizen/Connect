#!/bin/bash
# Railway worker startup script
set -e

# Use Railway's PORT env var if set
export PORT=${PORT:-8000}

# Worker service should NOT run migrations
export RUN_MIGRATIONS=false

# Keep worker resource usage predictable on small Railway instances.
export CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-2}
export CELERY_POOL=${CELERY_POOL:-solo}

echo "Starting Celery Worker..."
echo "REDIS_URL set: ${REDIS_URL:+yes}"
echo "DATABASE_URL set: ${DATABASE_URL:+yes}"
echo "CELERY_CONCURRENCY: $CELERY_CONCURRENCY"
echo "CELERY_POOL: $CELERY_POOL"

# Wait for database to be ready (without running migrations)
./wait-for-db.sh

# Start Celery worker
exec uv run celery -A app.worker.celery_app.celery_app worker --loglevel=info -E -Q default --concurrency="$CELERY_CONCURRENCY" --pool="$CELERY_POOL"
