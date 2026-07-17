# Dezprox Monitoring & Observability

This document outlines the monitoring, logging, and observability architecture for the Dezprox Hiring Platform.

## 1. Error Tracking (Sentry)
The platform uses Sentry for centralized error tracking across both Frontend and Backend.

### Frontend Integration
- **Initialization**: Configured in `src/main.tsx`.
- **Features**: Captures React runtime crashes, route errors, and API failures.
- **Source Maps**: Automatically uploaded during build for readable stack traces.
- **Global Error Boundary**: All uncaught errors are reported via `GlobalErrorBoundary`.

### Backend Integration
- **Initialization**: Configured in `src/main.ts`.
- **Global Filter**: `SentryGlobalFilter` captures all unhandled exceptions.
- **Profiling**: Enabled for performance analysis of slow requests and AI evaluations.

## 2. Structured Logging (Pino)
The backend uses `nestjs-pino` for structured, machine-readable logs.

- **Format**: JSON in production, pretty-printed in development.
- **Redaction**: Sensitive data (Authorization headers, passwords, tokens) is automatically redacted.
- **Context**: Every log includes a request ID for correlation.
- **Log Levels**:
    - `INFO`: Standard request/response flow.
    - `WARN`: Slow requests (>1s), retry attempts.
    - `ERROR`: Exceptions, failed integrations.

## 3. Metrics (Prometheus)
A dedicated `/metrics` endpoint exposes operational data for Prometheus.

- **HTTP Metrics**: Request counts, status codes, and latency histograms.
- **WebSocket Metrics**: Active connections count and event frequency.
- **AI Metrics**: Histograms of AI evaluation durations.
- **Custom Metrics**: Authentication failures, active assessments.

## 4. Health Monitoring
Health checks are available at `/health` using NestJS Terminus.

- **Liveness**: `/health/liveness` (returns 200 if process is running).
- **Readiness**: `/health/readiness` (checks database connectivity).
- **Deep Health**: `/health` (checks DB, memory heap, and RSS usage).
- **Details**: `/health/details` (returns uptime and system timestamp).

## 5. Operational Alerting
The `AlertService` provides hooks for real-time notifications.

- **Channels**: Supports Discord/Slack webhooks via `ALERT_WEBHOOK_URL`.
- **Triggers**:
    - Backend crashes.
    - AI Evaluation failures.
    - Critical database connectivity issues.

## 6. WebSocket Observability
Socket.IO operations are instrumented for visibility.

- **Logging**: Connection/disconnection events with user context and reasons.
- **Metrics**: Active connection gauge and event counters.
- **Diagnostics**: Traceable join/leave events for assessment rooms.

## 7. Performance Monitoring
- **Slow Request Interceptor**: Automatically logs any HTTP request taking longer than 1 second.
- **AI Timing**: Explicitly tracks the duration of OpenAI API calls and processing.
- **Database Tracing**: Sentry captures slow TypeORM queries.

---

### Environment Variables
The following variables control the observability stack:
- `SENTRY_DSN`: Backend Sentry DSN.
- `VITE_SENTRY_DSN`: Frontend Sentry DSN.
- `ALERT_WEBHOOK_URL`: Discord/Slack webhook URL for alerts.
- `NODE_ENV`: 'production' enables full reporting and JSON logging.
