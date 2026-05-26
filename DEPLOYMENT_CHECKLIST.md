# SocialSync Linux Deployment Checklist

Use this checklist for the current production target:

```text
https://connect.snapkey.in
```

This deployment runs both backend and frontend on the same Linux server.

## Server Setup

- [ ] DNS `connect.snapkey.in` points to the Linux server public IP.
- [ ] Deploy user exists on the server.
- [ ] Deploy user can SSH with a key.
- [ ] Deploy user can run Docker commands.
- [ ] Git is installed.
- [ ] Docker is installed.
- [ ] Docker Compose plugin is installed.
- [ ] Node.js 20+ is installed.
- [ ] npm is installed.
- [ ] PM2 is installed globally.
- [ ] Nginx is installed.
- [ ] Certbot is installed.

## Repository

- [ ] Repo is cloned at `~/Connect`.
- [ ] Repo is on the `main` branch.
- [ ] Server can run `git fetch origin` from `~/Connect`.
- [ ] `.github/workflows/deploy-main.yml` exists.
- [ ] `.github/workflows/ci-main.yml` exists.

## GitHub Secrets

Add these in GitHub repository Actions secrets:

- [ ] `SERVER_HOST`
- [ ] `SERVER_USER`
- [ ] `SERVER_SSH_KEY`
- [ ] `SERVER_PORT`

## Backend Environment

Create `~/Connect/.env` on the server.

- [ ] `DATABASE_URL=postgresql://...@db:5432/socialsync`
- [ ] `REDIS_URL=redis://redis:6379/0`
- [ ] `ENCRYPTION_KEY`
- [ ] `JWT_SECRET`
- [ ] `BACKEND_PUBLIC_URL=https://connect.snapkey.in`
- [ ] `FRONTEND_URL=https://connect.snapkey.in`
- [ ] `ADDITIONAL_CORS_ORIGINS=https://connect.snapkey.in`
- [ ] OAuth provider credentials
- [ ] Cloudinary credentials
- [ ] `SESSION_COOKIE_SECURE=true`
- [ ] `SESSION_COOKIE_SAMESITE=lax`
- [ ] `AUTH_REQUIRED=true`
- [ ] `ALLOW_DEV_TENANT_HEADER=false`

## Frontend Environment

Create `~/Connect/frontend/.env.production.local` on the server.

- [ ] `NEXT_PUBLIC_API_BASE_URL=https://connect.snapkey.in`
- [ ] `NEXT_PUBLIC_TENANT_ID=tenant_123`
- [ ] `NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY=snapkey_jwt`

## Nginx And HTTPS

- [ ] Nginx server block exists for `connect.snapkey.in`.
- [ ] `/` proxies to `http://127.0.0.1:3000`.
- [ ] `/api/` proxies to `http://127.0.0.1:8000`.
- [ ] `/docs` proxies to `http://127.0.0.1:8000`.
- [ ] `/api/v1/openapi.json` proxies to `http://127.0.0.1:8000`.
- [ ] `sudo nginx -t` passes.
- [ ] Nginx is reloaded.
- [ ] Certbot certificate is issued for `connect.snapkey.in`.
- [ ] HTTPS loads successfully.

## OAuth Redirect URLs

Configure provider dashboards:

- [ ] Facebook: `https://connect.snapkey.in/api/v1/oauth/facebook/callback`
- [ ] Instagram: `https://connect.snapkey.in/api/v1/oauth/instagram/callback`
- [ ] LinkedIn: `https://connect.snapkey.in/api/v1/oauth/linkedin/callback`
- [ ] Google: `https://connect.snapkey.in/api/v1/oauth/google/callback`
- [ ] Twitter/X: `https://connect.snapkey.in/api/v1/oauth/twitter/callback`

## First Deployment

Run once manually if the server is fresh:

- [ ] `docker compose up -d db redis`
- [ ] `docker compose build backend worker beat`
- [ ] `docker compose run --rm -e RUN_MIGRATIONS=false backend uv run alembic upgrade head`
- [ ] `docker compose up -d backend worker beat`
- [ ] `cd ~/Connect/frontend`
- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `pm2 start npm --name socialsync-frontend --cwd ~/Connect/frontend -- start`
- [ ] `pm2 save`

## Health Checks

- [ ] `curl http://127.0.0.1:8000/api/v1/health`
- [ ] `curl http://127.0.0.1:8000/api/v1/ready`
- [ ] `curl http://127.0.0.1:3000`
- [ ] `curl https://connect.snapkey.in/api/v1/health`
- [ ] Browser opens `https://connect.snapkey.in`

## CI/CD

- [ ] Push to `main` triggers `CI`.
- [ ] Backend tests pass in GitHub Actions.
- [ ] Frontend build passes in GitHub Actions.
- [ ] Push to `main` triggers `Deploy (Backend + Frontend)`.
- [ ] Deploy job SSHs into server successfully.
- [ ] Backend containers rebuild and restart.
- [ ] Migrations run successfully.
- [ ] Frontend builds in release directory.
- [ ] PM2 reloads `socialsync-frontend`.
- [ ] Workflow health checks pass.

## Post-Deployment

- [ ] User registration works.
- [ ] Login works.
- [ ] Session persists after refresh.
- [ ] Social account connection works for at least one provider.
- [ ] Media upload works.
- [ ] Create post works.
- [ ] Publish-now queues a task.
- [ ] Worker processes the task.
- [ ] Scheduled post is picked up by beat/worker.
- [ ] Analytics sync works.

## Hardening Follow-Up

- [ ] Remove backend `--reload` from production Compose command.
- [ ] Remove `.:/app` bind mounts from production Compose services.
- [ ] Stop exposing Postgres publicly.
- [ ] Stop exposing Redis publicly.
- [ ] Move Postgres credentials out of hardcoded Compose values.
- [ ] Add Docker log rotation.
- [ ] Add PM2 startup integration with systemd using `pm2 startup`.
- [ ] Restrict SSH access by firewall if possible.
