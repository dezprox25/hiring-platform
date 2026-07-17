# Dezprox Hiring Platform - Infrastructure Architecture

This document explains the containerized infrastructure and deployment flow.

## Architecture Overview

The platform is divided into three logical layers:
1.  **Frontend Layer**: Static React assets served via Nginx.
2.  **Application Layer**: NestJS Backend API and BullMQ Worker.
3.  **Data Layer**: PostgreSQL for persistence and Redis for caching/queueing/real-time.

### Container Dependency Diagram

```mermaid
graph TD
    User([User Browser]) --> Frontend[Frontend (Nginx)]
    Frontend --> Backend[Backend API (NestJS)]
    Worker[Queue Worker (BullMQ)] --> Redis[(Redis)]
    Worker --> DB[(PostgreSQL)]
    Backend --> Redis
    Backend --> DB
    
    subgraph "Docker Network (frontend_network)"
        Frontend
        Backend
    end
    
    subgraph "Docker Network (backend_network)"
        Backend
        Worker
        Redis
        DB
    end
```

## Network Isolation

We use two separate Docker networks for security:
- `frontend_network`: Connects the Frontend (Nginx) and the Backend API. The frontend only needs to talk to the backend.
- `backend_network`: Connects the Backend API, Worker, PostgreSQL, and Redis. The data services are isolated from the frontend and the public internet.

## Service Descriptions

### 1. PostgreSQL
- **Image**: `postgres:15-alpine`
- **Role**: Main relational database for users, candidates, assessments, and reports.
- **Persistence**: Data is stored in a named volume `postgres_data`.
- **Healthcheck**: Uses `pg_isready` to ensure the database is ready before other services start.

### 2. Redis
- **Image**: `redis:7-alpine`
- **Role**: Used as a BullMQ message broker, Socket.IO adapter for scaling, and general cache.
- **Persistence**: Uses `appendonly yes` for data durability, stored in `redis_data`.
- **Healthcheck**: Uses `redis-cli ping`.

### 3. Backend API
- **Role**: Serves the REST API and handles WebSocket connections.
- **Scaling**: Can be horizontally scaled; uses the Redis adapter for Socket.IO synchronization.
- **Restart Policy**: `always` ensures high availability.

### 4. BullMQ Worker
- **Role**: Processes background tasks like AI evaluations, email sending, and assessment timers.
- **Scaling**: Can be scaled independently of the API to handle high background workloads.

### 5. Frontend (Nginx)
- **Role**: Serves the React SPA and proxies API/WebSocket requests.
- **Security**: Implements security headers (CSP, HSTS, etc.) and gzip compression.

## Deployment Flow

1.  **Build**:
    - Backend Docker image is built using `dezprox-backend/Dockerfile`.
    - Frontend Docker image is built using the root `Dockerfile`.
    - `VITE_API_URL` is injected as a build argument.
2.  **Startup**:
    - `docker-compose up -d`
    - PostgreSQL and Redis start first.
    - Backend and Worker wait for DB/Redis healthchecks to pass.
    - Frontend starts last.
3.  **Runtime**:
    - Frontend serves static files.
    - API requests to `/api/*` are proxied to the backend.
    - WebSocket requests to `/socket.io/*` are proxied to the backend with upgrade headers.
