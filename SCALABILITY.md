# Dezprox Scalability & Distributed Architecture

This document outlines the distributed systems architecture, queue management, and scaling strategy for the Dezprox Hiring Platform.

## 1. Redis Infrastructure
Redis serves as the central shared infrastructure layer for the platform.

- **RedisModule**: A global module providing a typed `RedisService` abstraction using `ioredis`.
- **Use Cases**:
    - **BullMQ**: Shared state for background jobs and workers.
    - **Socket.IO Adapter**: Synchronizes events across multiple backend replicas.
    - **Caching**: Distributed read-cache for expensive analytics and reports.
    - **Distributed Coordination**: Shared locks and rate-limiting.

## 2. Queue System (BullMQ)
The platform uses BullMQ for robust, distributed background processing.

- **Queue Architecture**: Separates API request handling from heavy computational tasks.
- **Retry Strategy**: All jobs use exponential backoff (starting at 5s) with up to 3 attempts.
- **Monitoring**: A web-based dashboard is available at `/queues` (for administrators) to track job status, failures, and throughput.

## 3. Async AI Evaluation Pipeline
AI evaluation has been refactored from a synchronous path to a fully async, queue-driven workflow.

- **Workflow**:
    1. API enqueues a job to the `ai-evaluation` queue and returns a `PENDING` status.
    2. A background worker (the `AiEvaluationProcessor`) picks up the job.
    3. The worker orchestrates the OpenAI evaluation and updates the database.
    4. The frontend polls or receives a WebSocket update when the status changes to `COMPLETED`.
- **Reliability**: Idempotent processing ensures that multiple enqueues for the same candidate do not result in duplicate OpenAI calls.

## 4. Distributed Socket.IO
The `RedisIoAdapter` allows the platform to scale horizontally across multiple instances.

- **Cross-Instance Sync**: Events emitted on one server instance are automatically broadcast to clients connected to other instances.
- **Room Consistency**: Candidates and HR staff can join the same assessment rooms regardless of which server node they are connected to.

## 5. Caching Strategy
A distributed caching layer using `cache-manager` and Redis has been implemented.

- **Analytics**: Dashboard data is cached for 5 minutes (`analytics_dashboard` key).
- **Invalidation**: The cache is automatically purged when a new report is generated or updated, ensuring managers see fresh data while minimizing database load.

## 6. Infrastructure & Deployment
The platform is designed to be deployed as a set of coordinated containers.

- **Services**:
    - `backend`: Handles HTTP and WebSocket traffic.
    - `worker`: Dedicated container for processing BullMQ jobs (runs same code as backend).
    - `redis`: High-performance data structure store.
    - `postgres`: Primary relational database.

### Horizontal Scaling
To scale the platform, simply increase the replica count of the `backend` and `worker` services. The `RedisIoAdapter` and `BullMQ` will handle the distribution of traffic and tasks automatically.

---

## Scalability Recommendations
1. **Connection Pooling**: As the number of worker replicas increases, consider using a tool like `PgBouncer` for PostgreSQL connection pooling.
2. **Redis Cluster**: For extreme loads, migrate from a single Redis instance to a Redis Cluster for higher availability and throughput.
3. **K8s HPA**: The platform is ready for Kubernetes Horizontal Pod Autoscaler (HPA) based on CPU/Memory or custom metrics from the `/metrics` endpoint.
