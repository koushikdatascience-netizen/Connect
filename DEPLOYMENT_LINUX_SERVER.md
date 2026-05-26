# SocialSync Linux Server Deployment Guide

This is the current production deployment path for SocialSync.

- Domain: `https://connect.snapkey.in`
- Frontend: Next.js on the Linux server with PM2, served at `/`
- Backend API: FastAPI in Docker Compose, served through the same domain under `/api`
- Backend docs: FastAPI docs through the same domain under `/docs`
- Worker: Celery worker in Docker Compose
- Scheduler: Celery beat in Docker Compose
- Database: PostgreSQL in Docker Compose
- Queue/cache: Redis in Docker Compose
- CI/CD: GitHub Actions deploys over SSH to the Linux server

## Architecture

```text
Browser
  |
  | https://connect.snapkey.in
  v
Nginx
  |-- /                  -> Next.js frontend on 127.0.0.1:3000
  |-- /api/              -> FastAPI backend on 127.0.0.1:8000
  |-- /docs              -> FastAPI backend docs
  |-- /openapi.json      -> FastAPI backend OpenAPI, if exposed
  |-- /api/v1/openapi.json -> FastAPI API schema

Docker Compose
  |-- backend
  |-- worker
  |-- beat
  |-- db
  |-- redis

PM2
  |-- socialsync-frontend
```

## Required Server Software

Install these on the Linux server:

- Git
- Docker
- Docker Compose plugin
- Node.js 20+
- npm
- PM2
- Nginx
- Certbot for HTTPS

Ubuntu example:

```bash
sudo apt update
sudo apt install -y git curl nginx certbot python3-certbot-nginx

curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

Log out and back in after adding your user to the `docker` group.

## Server Directory

The active GitHub Actions workflow expects the repo at:

```bash
~/Connect
```

Clone it there:

```bash
cd ~
git clone <your-github-repo-url> Connect
cd ~/Connect
git checkout main
```

If you want a different directory, update `.github/workflows/deploy-main.yml` first because `~/Connect` is currently hardcoded.

## GitHub Actions Secrets

The current workflow `.github/workflows/deploy-main.yml` expects these repository secrets:

| Secret | Example | Notes |
| --- | --- | --- |
| `SERVER_HOST` | `connect.snapkey.in` or server IP | SSH host |
| `SERVER_USER` | `deploy` | Linux deploy user |
| `SERVER_SSH_KEY` | private key contents | Private key with access to the server |
| `SERVER_PORT` | `22` | SSH port |

Add them in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

## Backend Environment

Create this file on the server:

```bash
nano ~/Connect/.env
```

Use real production values:

```env
DATABASE_URL=postgresql://postgres:change-this-password@db:5432/socialsync
REDIS_URL=redis://redis:6379/0

ENCRYPTION_KEY=replace-with-fernet-key
JWT_SECRET=replace-with-long-random-secret

BACKEND_PUBLIC_URL=https://connect.snapkey.in
FRONTEND_URL=https://connect.snapkey.in
ADDITIONAL_CORS_ORIGINS=https://connect.snapkey.in

FACEBOOK_CLIENT_ID=replace-me
FACEBOOK_SECRET=replace-me
LINKEDIN_CLIENT_ID=replace-me
LINKEDIN_SECRET=replace-me
GOOGLE_CLIENT_ID=replace-me
GOOGLE_SECRET=replace-me
TWITTER_CLIENT_ID=replace-me
TWITTER_CLIENT_SECRET=replace-me

CLOUDINARY_CLOUD_NAME=replace-me
CLOUDINARY_API_KEY=replace-me
CLOUDINARY_API_SECRET=replace-me

SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=lax

AUTH_REQUIRED=true
ALLOW_DEV_TENANT_HEADER=false
ALLOW_PUBLIC_OAUTH_LOGIN=false

JWT_ALGORITHM=HS256
JWT_ISSUER=SocialSync
JWT_AUDIENCE=SocialSync
JWT_TENANT_CLAIM=TenantId
JWT_SUBJECT_CLAIM=UserId
JWT_ROLE_CLAIM=ISAdmin

API_V1_STR=/api/v1
WEBVIEW_AUTH_CODE_TTL_SECONDS=60
ENVIRONMENT=production
```

Generate secrets:

```bash
python3 - <<'PY'
from cryptography.fernet import Fernet
import secrets

print("ENCRYPTION_KEY=" + Fernet.generate_key().decode())
print("JWT_SECRET=" + secrets.token_urlsafe(64))
PY
```

## Frontend Environment

Create this file on the server:

```bash
nano ~/Connect/frontend/.env.production.local
```

Use:

```env
NEXT_PUBLIC_API_BASE_URL=https://connect.snapkey.in
NEXT_PUBLIC_TENANT_ID=tenant_123
NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY=snapkey_jwt
```

Because frontend and backend share the same domain, the browser should call the API through:

```text
https://connect.snapkey.in/api/v1/...
```

## Nginx Configuration

Create:

```bash
sudo nano /etc/nginx/sites-available/connect.snapkey.in
```

Use this config:

```nginx
server {
    listen 80;
    server_name connect.snapkey.in;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v1/openapi.json {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/connect.snapkey.in /etc/nginx/sites-enabled/connect.snapkey.in
sudo nginx -t
sudo systemctl reload nginx
```

Enable HTTPS:

```bash
sudo certbot --nginx -d connect.snapkey.in
```

## OAuth Redirect URLs

Configure provider dashboards with same-domain callback URLs:

```text
https://connect.snapkey.in/api/v1/oauth/facebook/callback
https://connect.snapkey.in/api/v1/oauth/instagram/callback
https://connect.snapkey.in/api/v1/oauth/linkedin/callback
https://connect.snapkey.in/api/v1/oauth/google/callback
https://connect.snapkey.in/api/v1/oauth/twitter/callback
```

## First Manual Deployment

Run this once on the server:

```bash
cd ~/Connect
docker compose up -d db redis
docker compose build backend worker beat
docker compose run --rm -e RUN_MIGRATIONS=false backend uv run alembic upgrade head
docker compose up -d backend worker beat

cd ~/Connect/frontend
npm ci
npm run build
pm2 start npm --name socialsync-frontend --cwd ~/Connect/frontend -- start
pm2 save
```

Check:

```bash
curl http://127.0.0.1:8000/api/v1/health
curl http://127.0.0.1:3000
curl https://connect.snapkey.in/api/v1/health
```

## CI/CD Deployment Flow

The workflow `.github/workflows/deploy-main.yml` runs on pushes to `main` and manual dispatch.

It does this over SSH:

1. `cd ~/Connect`
2. Save the previous commit for rollback
3. `git fetch origin`
4. `git reset --hard origin/main`
5. Start `db` and `redis`
6. Build backend, worker, and beat images
7. Run Alembic migrations
8. Start backend, worker, and beat
9. Health-check backend at `http://127.0.0.1:8000/api/v1/health`
10. Build frontend in `~/Connect_frontend_release`
11. Promote the built `.next` directory into `~/Connect/frontend/.next`
12. Reload or start PM2 service `socialsync-frontend`
13. Health-check frontend at `http://127.0.0.1:3000`
14. Save PM2 process list

If a health check fails, it resets back to the previous commit and rebuilds the previous version.

## Deploying Updates

Push to `main`:

```bash
git push origin main
```

Or run the workflow manually:

```text
GitHub -> Actions -> Deploy (Backend + Frontend) -> Run workflow
```

## Useful Server Commands

```bash
cd ~/Connect

docker compose ps
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f beat
docker compose logs -f db
docker compose logs -f redis

pm2 status
pm2 logs socialsync-frontend

curl http://127.0.0.1:8000/api/v1/health
curl http://127.0.0.1:8000/api/v1/ready
curl http://127.0.0.1:8000/api/v1/queue
curl https://connect.snapkey.in/api/v1/health
```

## Production Notes

The current `docker-compose.yml` works for the present deployment workflow, but before hardening production you should consider these improvements:

- Remove `--reload` from the backend command.
- Remove `.:/app` bind mounts from backend, worker, and beat.
- Stop publishing Postgres and Redis ports publicly unless remote access is required.
- Move Postgres username, password, and database name into environment variables.
- Add a Docker healthcheck for the backend service.
- Add log rotation for Docker and PM2 logs.

## Firewall

Recommended public ports:

```text
22/tcp    SSH, preferably restricted to trusted IPs
80/tcp    HTTP for Certbot redirect
443/tcp   HTTPS app traffic
```

Avoid exposing these publicly:

```text
5432/tcp or 5433/tcp PostgreSQL
6379/tcp Redis
8000/tcp backend direct access
3000/tcp frontend direct access
```

Nginx should be the public entrypoint.
