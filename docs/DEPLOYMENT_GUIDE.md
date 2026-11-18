# DEPLOYMENT_GUIDE.md — Step-by-Step Production Deployment Guide

This guide provides exact commands to run CinemaScope locally in development, build the production artifact, and run it in containerized production.

---

## 1. Local Development Setup

### 1.1 Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher

### 1.2 Setup Commands
```bash
# 1. Clone or navigate to the repository
cd "c:\Users\hp\Desktop\Desktop - Copy\Projects\Cinema scope"

# 2. Create your local environment configuration from template
cp .env.example .env

# 3. Configure your API keys in .env
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_TMDB_API_KEY=your-tmdb-key
# VITE_ADMIN_EMAIL=your-admin-email@example.com

# 4. Install dependencies
npm install

# 5. Run automated unit tests
npm test

# 6. Start the local development server
npm run dev
# -> Local app runs on http://localhost:5173
```

---

## 2. Containerized Production Deployment (Docker Compose)

### 2.1 Build & Run Locally with Docker
```bash
# 1. Build the multi-stage Docker image
docker build -t cinemascope:latest .

# 2. Start application and monitoring services
docker compose up -d

# 3. Verify running containers
docker compose ps

# 4. Test health check endpoint
curl -I http://localhost:8080/health
# -> HTTP/1.1 200 OK

# 5. Access monitoring dashboard
# Open http://localhost:3001 to configure Uptime Kuma alerts
```

---

## 3. Database Deployment & Hardening (Supabase PostgreSQL)

1. Open your Supabase Dashboard or self-hosted SQL Editor.
2. If this is a fresh setup, execute `supabase-master-schema.sql` to establish tables and indexes.
3. Apply security hardening by executing `supabase-secure-rls.sql`.
4. Grant your personal account administrative privileges:
   ```sql
   UPDATE public.users 
   SET role = 'ADMIN' 
   WHERE email = 'your-admin-email@example.com';
   ```

---

## 4. Rollback & Disaster Recovery Procedures

### 4.1 Rolling back to a previous Docker image
```bash
# Stop current container
docker compose down

# Run previous stable tag
docker run -d --name cinemascope-app -p 8080:80 cinemascope:v1.0.0
```

### 4.2 Restoring Database from Backup
```bash
# Restore logical backup
pg_restore -h db.example.com -U postgres -d postgres -c -v /backups/cinemascope_backup.dump
```
