# Dezprox Hiring Platform - Environment Variables Guide

This document describes all environment variables used in the Dezprox Hiring Platform.

## Backend Variables (`dezprox-backend/.env`)

| Variable | Purpose | Required | Example | Production Recommendation |
|----------|---------|----------|---------|---------------------------|
| `PORT` | Port the NestJS API listens on | No | `4000` | `4000` |
| `NODE_ENV` | Environment mode | Yes | `development`, `production`, `staging` | `production` |
| `FRONTEND_URL` | URL of the frontend (for CORS) | Yes | `http://localhost:5173` | `https://app.dezprox.com` |
| `DB_HOST` | Database host | Yes | `localhost` | `postgres` (if Docker) or cloud DB host |
| `DB_PORT` | Database port | Yes | `5432` | `5432` |
| `DB_USER` | Database username | Yes | `postgres` | Use a dedicated user, not `postgres` |
| `DB_PASS` | Database password | Yes | `postgres` | Use a strong secret |
| `DB_NAME` | Database name | Yes | `dezprox` | `dezprox` |
| `DB_SSL` | Enable SSL for DB connection | No | `false` | `true` |
| `REDIS_HOST` | Redis host | Yes | `localhost` | `redis` (if Docker) |
| `REDIS_PORT` | Redis port | Yes | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis password | No | `""` | Set a strong password |
| `REDIS_DB` | Redis database index | No | `0` | `0` |
| `JWT_SECRET` | Secret for Access Token | Yes | `long-random-string` | 32+ character random string |
| `JWT_REFRESH_SECRET` | Secret for Refresh Token | Yes | `long-random-string` | 32+ character random string |
| `JWT_EXPIRES_IN` | Access token TTL | No | `15m` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | No | `7d` | `7d` |
| `OPENAI_API_KEY` | OpenAI API Key for AI Eval | Yes | `sk-xxxx` | Securely managed secret |
| `AI_MODEL` | OpenAI model to use | No | `gpt-4-turbo` | `gpt-4-turbo` |
| `SMTP_HOST` | SMTP server host | Yes | `smtp.gmail.com` | Use a reliable provider (SendGrid, Postmark) |
| `SMTP_PORT` | SMTP server port | Yes | `587` | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username | Yes | `user@example.com` | Service account email |
| `SMTP_PASS` | SMTP password | Yes | `password` | App-specific password or API key |
| `MAIL_FROM` | From address for emails | Yes | `"Dezprox <noreply@dezprox.com>"` | Verified sender domain |
| `SENTRY_DSN` | Sentry DSN for error tracking | No | `https://xxx@sentry.io/xxx` | Required for production monitoring |

## Frontend Variables (`.env`)

| Variable | Purpose | Required | Example | Production Recommendation |
|----------|---------|----------|---------|---------------------------|
| `VITE_API_URL` | Base URL of the Backend API | Yes | `http://localhost:4000` | `https://api.dezprox.com` |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend | No | `https://xxx@sentry.io/xxx` | Required for production monitoring |

## Infrastructure Variables (Docker Compose)

The `docker-compose.yml` uses the variables defined in your shell or `.env` file at the root.

| Variable | Mapping |
|----------|---------|
| `DB_USER` | Mapped to `POSTGRES_USER` and `DB_USER` in backend |
| `DB_PASS` | Mapped to `POSTGRES_PASSWORD` and `DB_PASS` in backend |
| `DB_NAME` | Mapped to `POSTGRES_DB` and `DB_NAME` in backend |
| `REDIS_PASSWORD` | Mapped to `REDIS_PASSWORD` in backend |
| `JWT_SECRET` | Passed to backend |
| `VITE_API_URL` | Passed to frontend build args |
