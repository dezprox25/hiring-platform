# Dezprox Hiring Platform - Startup Guide

This guide provides exact commands and steps for starting the platform in different environments.

## Prerequisite Startup Order
To ensure connectivity, services should be started in this order:
1.  **PostgreSQL** (Database)
2.  **Redis** (Cache/Broker)
3.  **Backend API** (Rest/WebSocket)
4.  **BullMQ Worker** (Background Tasks)
5.  **Frontend** (UI)

---

## 1. Local Development (Manual)

### Step 1: Services (Docker recommended for these)
```bash
docker run --name dezprox-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine
docker run --name dezprox-redis -p 6379:6379 -d redis:7-alpine
```

### Step 2: Backend
```bash
cd dezprox-backend
cp .env.example .env
# Update .env with your secrets
npm install
npm run migration:run
npm run start:dev
```

### Step 3: BullMQ Worker
```bash
cd dezprox-backend
# Uses the same .env
npm run start:dev
# (The worker is integrated or can be run as a separate process depending on implementation)
```

### Step 4: Frontend
```bash
cd ..
cp .env.example .env
# Update .env with VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

---

## 2. Docker Startup (Compose)

This is the recommended way to run the entire stack locally or for testing.

### Step 1: Configuration
1. Create a `.env` file in the root directory.
2. Fill it with the required variables from `ENV_GUIDE.md`.

### Step 2: Launch
```bash
docker-compose up --build -d
```

### Expected Output
- `postgres` health check passes.
- `redis` health check passes.
- `backend` starts and logs "Application is running on: http://localhost:4000".
- `frontend` is available at `http://localhost`.

---

## 3. Production Deployment

### Step 1: Infrastructure Setup
1. Provision a VM or Kubernetes Cluster.
2. Set up a Managed Database (e.g., RDS) and Redis (e.g., ElastiCache) for better reliability.

### Step 2: Environment Variables
Ensure all production secrets are set in your CI/CD environment or secret manager.

### Step 3: Deployment
Using Docker:
```bash
docker-compose -f docker-compose.prod.yml up -d
```
*(Note: Create a separate prod compose file if specific volumes or network configurations are needed)*

---

## Troubleshooting & Common Failures

### 1. Database Connectivity Error
- **Cause**: `DB_HOST` is incorrect or DB is not ready.
- **Check**: Run `docker-compose ps` to see if postgres is healthy.
- **Fix**: Verify `.env` credentials and hostnames.

### 2. Redis Connection Refused
- **Cause**: Redis service is down or firewall is blocking port 6379.
- **Check**: `redis-cli -h <REDIS_HOST> ping`.
- **Fix**: Ensure Redis is started before the backend.

### 3. WebSocket Connection Fails (400 Bad Request)
- **Cause**: Nginx is not correctly upgrading the connection.
- **Check**: Nginx logs (`docker logs frontend`).
- **Fix**: Ensure `proxy_set_header Upgrade $http_upgrade;` and `Connection "Upgrade";` are in `nginx.conf`.

### 4. JWT Secret Error
- **Cause**: `JWT_SECRET` is missing.
- **Fix**: Ensure it's defined in the backend `.env`.

### 5. Frontend 404 on Refresh
- **Cause**: SPA routing not configured in Nginx.
- **Fix**: Ensure `try_files $uri $uri/ /index.html;` is present in `nginx.conf`.
