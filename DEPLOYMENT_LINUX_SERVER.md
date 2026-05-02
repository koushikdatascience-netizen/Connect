# SocialSync - Linux Server Deployment Guide

Complete CI/CD deployment setup for **Linux Server (Backend + Workers)** + **Vercel (Frontend)**

---

## 📋 Overview

This guide will help you deploy SocialSync to your own Linux server with:

- ✅ **Backend API**: Deployed to your Linux server via GitHub Actions
- ✅ **Celery Worker**: Deployed to your Linux server
- ✅ **Celery Beat**: Deployed to your Linux server
- ✅ **PostgreSQL**: Running on your Linux server
- ✅ **Redis**: Running on your Linux server
- ✅ **Frontend**: Vercel (auto-deploy from GitHub)
- ✅ **CI/CD**: GitHub Actions (automated testing & deployment)

---

## 🚀 Prerequisites

1. **Linux Server** with:
   - Docker installed
   - Docker Compose installed
   - SSH access
   - Public IP or domain name
   - Ports 8000 (backend), 5432 (PostgreSQL), 6379 (Redis) open

2. **GitHub Repository** with your SocialSync code

3. **Domain name** (optional, recommended for production)

4. **Vercel account** (for frontend deployment)

---

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Linux Server

#### 1.1 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 1.2 Create Deployment User (Recommended)

```bash
# Create deploy user
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

#### 1.3 Set Up SSH Access

```bash
# On your local machine, generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@your-server-ip
```

---

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

2. Add these **Repository secrets**:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SERVER_IP` | Your server IP or domain | `123.45.67.89` or `yourdomain.com` |
| `SSH_USERNAME` | SSH username | `deploy` |
| `SSH_PORT` | SSH port (optional, default: 22) | `22` |
| `DEPLOY_PATH` | Path to deploy on server | `/home/deploy/socialsync` |
| `SSH_PRIVATE_KEY` | Private SSH key for deployment | (contents of `~/.ssh/id_ed25519`) |
| `KNOWN_HOSTS` | Server's known hosts fingerprint | (output of `ssh-keyscan your-server-ip`) |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your-strong-password` |
| `POSTGRES_DB` | PostgreSQL database name | `socialsync` |
| `POSTGRES_PORT` | PostgreSQL port (optional) | `5432` |
| `REDIS_PORT` | Redis port (optional) | `6379` |

**To get KNOWN_HOSTS:**
```bash
ssh-keyscan your-server-ip > known_hosts
cat known_hosts
```

---

### Step 3: Create Production Environment File

Create `.env.production` file in your project root:

```env
# Database
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
REDIS_URL=redis://redis:6379/0

# Security
ENCRYPTION_KEY=your-encryption-key-here
JWT_SECRET=your-jwt-secret-here

# OAuth (get from developer platforms)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_SECRET=your_facebook_app_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_SECRET=your_linkedin_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Cloudinary (from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
BACKEND_PUBLIC_URL=http://${SERVER_IP}:8000
FRONTEND_URL=https://your-frontend.vercel.app
ADDITIONAL_CORS_ORIGINS=https://your-frontend.vercel.app

# Security (production)
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
AUTH_REQUIRED=true
ALLOW_DEV_TENANT_HEADER=false

# JWT
JWT_ALGORITHM=HS256
JWT_ISSUER=SocialSync
JWT_AUDIENCE=SocialSync
JWT_TENANT_CLAIM=TenantId
JWT_SUBJECT_CLAIM=UserId
JWT_ROLE_CLAIM=ISAdmin

# Other
API_V1_STR=/api/v1
WEBVIEW_AUTH_CODE_TTL_SECONDS=60
ENVIRONMENT=production
```

**Generate security keys:**
```bash
# Generate ENCRYPTION_KEY
python -c "import base64; from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate JWT_SECRET
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

### Step 4: Configure Frontend for Linux Server

Update your frontend `.env.production` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://your-server-ip:8000
NEXT_PUBLIC_TENANT_ID=tenant_123
NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY=snapkey_jwt
```

---

### Step 5: Push Code to GitHub

```bash
git add .
git commit -m "feat: add CI/CD for Linux server deployment"
git push origin main
```

---

### Step 6: Monitor Deployment

1. Go to your GitHub repo → **Actions** tab
2. Watch the **Deploy to Linux Server** workflow run
3. Check logs for any errors

---

## 🔄 Updating Your Deployment

### Automatic (Recommended)

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

GitHub Actions will automatically:
- Run tests
- Deploy backend to your Linux server
- Deploy frontend to Vercel (if frontend files changed)

### Manual Trigger

1. Go to GitHub repo → **Actions** tab
2. Select **Deploy to Linux Server** workflow
3. Click **Run workflow**
4. Choose branch → **Run workflow**

---

## 📊 Monitoring & Debugging

### Server Logs

```bash
# SSH into your server
ssh deploy@your-server-ip

# View backend logs
docker logs -f socialsync_backend

# View worker logs
docker logs -f socialsync_worker

# View beat logs
docker logs -f socialsync_beat

# View all containers
docker ps -a
```

### GitHub Actions

- **Workflow runs**: Check CI/CD pipeline status
- **Logs**: Debug failed deployments

---

## 🚨 Troubleshooting

### Backend won't start

```bash
# Check container status
docker ps -a

# Check logs
docker logs socialsync_backend

# Common issues:
# 1. DATABASE_URL not set correctly
# 2. REDIS_URL not set correctly
# 3. Missing environment variables
# 4. Port conflicts
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker logs socialsync_db

# Check database health
docker exec -it socialsync_db pg_isready -U postgres

# Run migrations manually
docker exec -it socialsync_backend alembic upgrade head
```

### Worker not processing tasks

```bash
# Check worker logs
docker logs socialsync_worker

# Verify Redis connection
docker exec -it socialsync_redis redis-cli ping
```

### Frontend can't reach backend

1. Verify `NEXT_PUBLIC_API_BASE_URL` in frontend env vars
2. Check CORS settings in backend
3. Ensure backend is running: `curl http://your-server-ip:8000/api/v1/health`

---

## 🔒 Security Recommendations

1. **Use HTTPS**: Set up Nginx with Let's Encrypt for HTTPS
2. **Firewall**: Configure firewall to only allow necessary ports
3. **SSH**: Disable root login and use SSH keys only
4. **Database**: Change default PostgreSQL credentials
5. **Environment variables**: Never commit `.env` files to GitHub
6. **Docker**: Regularly update Docker images

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Nginx Configuration](https://www.nginx.com/resources/wiki/start/)

---

## 🆘 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review deployment logs in GitHub Actions
3. Check server logs with `docker logs`
4. Open an issue in your GitHub repository

---

**Happy Deploying! 🚀**