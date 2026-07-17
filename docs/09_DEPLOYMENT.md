# 09 — Deployment

## Environment Variables — Full Reference

> `.env` (root) and `dezprox-backend/.env` hold real secrets and are gitignored. The tables below are compiled from `.env.example`/`.env.development`/`.env.production.example`/`.env.staging.example` templates **and cross-checked against what the code actually reads** — several documented/templated vars are unused, and several vars the code reads are undocumented. Both are flagged explicitly.

### Backend (`dezprox-backend/.env`)

| Key | Purpose | Required |
|---|---|---|
| `PORT` | API listen port | Optional (default 4000) |
| `NODE_ENV` | `development` / `staging` / `production` — toggles logging format, Sentry env, dev-user seeding | Required |
| `FRONTEND_URL` | CORS allowed origin (HTTP + WebSocket) | Required |
| `APP_URL` | Base URL used in outbound email links | Required in staging/prod (missing from dev `.env.example`) |
| `SEED_DEV_LOGIN_USERS` | Force/skip demo staff auto-seed | Optional (default: auto true outside prod/staging) |
| `DATABASE_URL` / `DATABASE_PUBLIC_URL` | Full Postgres connection string (Railway-style), parsed into discrete `DB_*` vars if present | Optional override |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | Discrete Postgres connection params | Required (unless `DATABASE_URL` set) |
| `DB_SSL` | Enable TLS to Postgres | Optional (auto-derived false for localhost) |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection | Required |
| `REDIS_PASSWORD` | Redis auth | Optional |
| `REDIS_DB` | Redis logical DB index | Optional (default 0) |
| `JWT_SECRET` | Access-token signing secret | **Required — app throws at startup if missing** |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret | **Required — same** |
| `JWT_EXPIRES_IN` | Access-token TTL | Optional (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token TTL | Optional (default `7d`) |
| `OPENAI_API_KEY` | OpenAI API key for AI code evaluation | Required for AI Evaluation to function (silently no-ops otherwise) |
| `OPENAI_MODEL` | OpenAI model name (default `'gpt-4'` in code) | Optional — **this is the real var; see ⚠️ below** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Outbound mail server | Required for invite emails (silent no-op otherwise) |
| `SMTP_SECURE` | TLS/SSL for SMTP | Optional (default false) — **undocumented in `.env.example`** |
| `SMTP_FROM` | From-address override | Optional (falls back to `noreply@dezprox.com`) — **this is the real var; see ⚠️ below** |
| `SENTRY_DSN` | Backend Sentry DSN | Optional (recommended in prod) |
| `ALERT_WEBHOOK_URL` | Discord/Slack webhook for critical `AlertService` alerts | Optional — **undocumented, absent from all `.env.example`/`docker-compose.yml`** |

⚠️ **Doc/template vs. code mismatches found during this audit — fix before relying on `.env.example`:**
- `.env.example` documents `AI_MODEL` — **the code reads `OPENAI_MODEL` instead.** `AI_MODEL` is silently ignored.
- `.env.example`/docs mention `MAIL_FROM` — **the code reads `SMTP_FROM` instead.** `MAIL_FROM` is silently ignored.
- `docker-compose.yml` passes `MAIL_HOST`/`MAIL_PORT`/`MAIL_USER`/`MAIL_PASS` to the `backend`/`worker` containers — **the code reads `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`.** Mail will silently fail to configure if you rely purely on `docker-compose.yml`'s env block — you must also set the `SMTP_*` names.
- `docker-compose.yml` also passes `MOCK_ADMIN_EMAIL`, `MOCK_MANAGER_EMAIL`, `MOCK_HR_EMAIL`, `MOCK_CANDIDATE_EMAIL`, `MOCK_PASSWORD_HASH` — **none of these are referenced anywhere in `dezprox-backend/src`.** Dead passthroughs; ignore or remove.

### Frontend (root `.env`)

| Key | Purpose | Required |
|---|---|---|
| `VITE_API_URL` | Backend base URL, baked into the build at build time | Required for production builds |
| `VITE_DEV_API_PROXY` | Vite dev-server proxy target (used only when `VITE_API_URL` is unset) | Optional, dev only |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN | Optional |

## Docker

### `docker-compose.yml` — Services

| Service | Image / Build | Ports | Depends On | Notes |
|---|---|---|---|---|
| `postgres` | `postgres:15-alpine` | `5432:5432` (host-published) | — | healthcheck `pg_isready`, volume `postgres_data` |
| `redis` | `redis:7-alpine` | `6379:6379` (host-published) | — | `--appendonly yes`, healthcheck `redis-cli ping`, volume `redis_data` |
| `backend` | build `./dezprox-backend` | `4000:4000` | postgres (healthy), redis (healthy) | REST API + WebSocket gateway |
| `worker` | build `./dezprox-backend` (same image) | none published | postgres (healthy), redis (healthy) | overrides command to run BullMQ processors |
| `frontend` | build `.` (root `Dockerfile`), arg `VITE_API_URL` | `80:80` | backend (started, not health-gated) | Nginx serving the built SPA |

Networks: `backend_network`, `frontend_network` (both bridge). **Note:** despite `INFRASTRUCTURE.md`'s "isolated network" framing, `postgres` and `redis` both publish host ports directly — they are reachable from outside Docker if the host firewall allows it. Tighten this for any environment beyond local dev (remove the host port mappings, or firewall them).

### Dockerfiles

**Root `Dockerfile` (frontend):** 2-stage — `node:20-alpine` builds via `npm ci` + `vite build` (accepts `VITE_API_URL` as a build ARG, baked into the JS bundle at build time — **cannot be changed post-build without rebuilding**), then `nginx:alpine` serves `dist/` with `nginx.conf` copied in.

**`dezprox-backend/Dockerfile`:** 2-stage — `node:20-alpine` builder runs `npm ci` + `npm run build` (tsc), then a second `node:20-alpine` runtime stage copies `dist/` + `package*.json`, runs `npm ci --omit=dev`, and **runs as the non-root `node` user**. Exposes 4000, `CMD ["node", "dist/main"]`.

### `nginx.conf`

- SPA routing: `/` → `try_files $uri $uri/ /index.html`.
- `/assets` cached 1 year immutable.
- `/api/` → `proxy_pass http://backend:4000/` with upgrade headers.
- `/socket.io/` → `proxy_pass http://backend:4000` with WebSocket upgrade headers.
- `/health` → static `200` (this is **nginx's own** health check, not the backend's `/health`).
- Security headers set (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, a CSP that allows `unsafe-inline`/`unsafe-eval` + Sentry + Google Fonts).
- **No SSL/TLS termination configured** — add a reverse proxy/load balancer in front (or Certbot layer) for any public deployment.

## Database Setup (Production)

1. Provision PostgreSQL 15+.
2. Set `DB_HOST/PORT/USER/PASS/NAME` (or `DATABASE_URL`) and `DB_SSL=true` for any non-local host.
3. Run migrations: `npm run migration:run` (from `dezprox-backend/`) — **never** rely on `synchronize: true`; it is hardcoded `false` everywhere in this codebase by design.
4. **Before going further, read [`04_DATABASE.md` §9 Data Integrity Issues](./04_DATABASE.md#9-data-integrity-issues)** — the `feedbacks` table has a known migration/entity drift that will likely break `POST /reports/:id/feedback` on a freshly-migrated database. Write and apply a fixing migration before this endpoint is exercised.

## Redis Setup (Production)

Single Redis instance serves four roles (BullMQ, Socket.IO adapter, HTTP cache, direct KV) — see [`03_SYSTEM_ARCHITECTURE.md` §Redis Usage](./03_SYSTEM_ARCHITECTURE.md#redis-usage). Set `REDIS_PASSWORD` for anything beyond local dev. A single Redis instance is sufficient at current scale (no cluster/sentinel setup exists or is currently needed).

## Build Process

**Frontend:** `npm run build` → `vite build` → static output in `dist/`. Type-checking is a separate step in CI (`vite build -- --noEmit`), not part of the default `build` script.

**Backend:** `npm run build` (from `dezprox-backend/`) → `tsc` (Nest's build wrapper) → output in `dezprox-backend/dist/`.

## Deployment Steps (Docker Compose — the only environment this repo currently supports out of the box)

```bash
# 1. Clone and configure
git clone <repo>
cd project1
cp dezprox-backend/.env.example dezprox-backend/.env   # fill in real secrets
cp .env.production.example .env                          # fill in VITE_API_URL etc.

# 2. Build and start everything
docker-compose up --build -d

# 3. Run database migrations (one-time / per-deploy)
docker-compose exec backend npm run migration:run

# 4. Verify
curl http://localhost:4000/health
curl http://localhost/          # frontend via nginx
```

⚠️ `STARTUP_GUIDE.md` (a prior-developer doc) references a `docker-compose.prod.yml` for production deployment — **this file does not exist in the repository.** Only one `docker-compose.yml` exists. Either treat that doc's production section as aspirational, or create the file if a genuinely separate prod compose config is needed (e.g. without host-published DB/Redis ports).

## CI/CD

`.github/workflows/ci.yml` — **"CI/CD Pipeline"**, but it is CI-only. Three jobs on every push/PR to `main`/`master`:

1. **lint-and-build** — frontend lint/typecheck/build; backend lint, unit tests (`npm run test`), e2e tests (`npm run test:e2e`), build.
2. **docker-validation** — builds both Docker images (no registry push, no deploy).
3. **e2e-tests** — `docker-compose up -d` then Playwright against `http://localhost:5173`, 60-minute timeout, uploads report on failure.

**There is no deployment stage.** Deploying to any real environment today is a manual `docker-compose up -d` (or equivalent) on the target host. If continuous deployment is required, this is a concrete, well-scoped piece of work to add (e.g. push images to a registry + `docker-compose pull && up -d` over SSH, or a proper orchestrator).

Also note: nearly all Playwright e2e specs are `test.skip()`'d (only 2 lightweight negative-path auth tests run for real) — CI passing does **not** mean the assessment/review/socket flows are verified. See [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md).

## Environments

| Environment | Config source | Notes |
|---|---|---|
| Development | `.env.development` (frontend), `.env` (backend, from `.env.example`) | Vite dev server + `npm run start:dev` (Nest watch mode) |
| Staging | `.env.staging.example` templates | Adds `APP_URL`; otherwise same shape as prod |
| Production | `.env.production.example` templates | `NODE_ENV=production` enables CSP, disables dev-user seeding by default |

## Common Errors

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend fails to start: `JWT_SECRET is required` | Missing/blank `JWT_SECRET` or `JWT_REFRESH_SECRET` | Set both in `.env` |
| `POST /reports/:id/feedback` returns 500 | `feedbacks` table missing columns (migration/entity drift) | See [`04_DATABASE.md` §11](./04_DATABASE.md#11-feedbacks) — apply a fixing migration |
| Invite emails never send, no error shown | SMTP env vars unset — `MailService` no-ops gracefully by design | Set `SMTP_HOST/PORT/USER/PASS` (not `MAIL_*` — see mismatch above) |
| AI evaluation never runs / `OPENAI_API_KEY` seemingly ignored | `AI_MODEL` set instead of `OPENAI_MODEL` (harmless — model just falls back to default `gpt-4`); or `OPENAI_API_KEY` genuinely unset | Set `OPENAI_API_KEY`; optionally set `OPENAI_MODEL` (not `AI_MODEL`) |
| `docker-compose up` — postgres/redis "unhealthy" and backend never starts | Healthcheck timing on first run (image pull + init) | Wait, or increase `retries`/`start_period` in `docker-compose.yml` |
| MCQ/Typing round throws `TypeError` in the browser | Known frontend bug, not a deployment issue | See [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) Bug #01/#02 |
| `npm run lint` fails or no-ops silently in either project | ESLint 9 requires flat config (`eslint.config.js`/`.mjs`) — neither project has one | Add a flat ESLint config before trusting `npm run lint` in CI |

## Related Documents

- [`10_DEVELOPER_SETUP.md`](./10_DEVELOPER_SETUP.md) — local (non-Docker) setup for day-to-day development
- [`04_DATABASE.md`](./04_DATABASE.md) — migration details and the `feedbacks` drift issue
- [`16_HANDOVER_GUIDE.md`](./16_HANDOVER_GUIDE.md) — full deployment/production readiness checklist
