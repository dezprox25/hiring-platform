# 10 — Developer Setup

This is the local, non-Docker setup for day-to-day development. For containerized setup see [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md).

## Prerequisites

- Node.js 20.x (matches the Docker images; not pinned via `engines` in either `package.json`, but treat 20 as the target)
- npm (repo uses `npm ci`/`package-lock.json`, not yarn/pnpm)
- PostgreSQL 15+ (local install or via `docker-compose up postgres`)
- Redis 7+ (local install or via `docker-compose up redis`)
- Git

## 1. Clone

```bash
git clone <repository-url>
cd "project1"
```

## 2. Install Dependencies

```bash
# Frontend (repo root)
npm install

# Backend
cd dezprox-backend
npm install
cd ..
```

## 3. Database Setup

Easiest path — start just the DB via Docker:
```bash
docker-compose up -d postgres
```
Or point `DB_HOST`/`DB_PORT`/etc. at an existing local Postgres instance.

Then, from `dezprox-backend/`:
```bash
cp .env.example .env
# edit .env: set DB_HOST=localhost, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, JWT_REFRESH_SECRET (required — app won't boot without these two)
npm run migration:run
```

⚠️ Before your first real use of the Reports/Feedback feature, read [`04_DATABASE.md` §11 `feedbacks`](./04_DATABASE.md#11-feedbacks) — there is a known migration/entity mismatch on that table that will need a fixing migration.

## 4. Redis Setup

```bash
docker-compose up -d redis
```
Set `REDIS_HOST=localhost`, `REDIS_PORT=6379` in `dezprox-backend/.env`. Redis is required — BullMQ, the Socket.IO adapter, and the Analytics cache all depend on it; the backend will not function correctly without it.

## 5. Run the Backend

```bash
cd dezprox-backend
npm run start:dev     # watch mode, auto-restarts on change
```
Backend listens on `http://localhost:4000` (or `PORT` if set). Verify with:
```bash
curl http://localhost:4000/health
```

To seed demo staff accounts manually (also happens automatically outside `production`/`staging` if the `users` table is empty):
```bash
npm run seed:dev-users
```

## 6. Run the Frontend

From the repo root:
```bash
cp .env.example .env   # or .env.development
npm run dev
```
Frontend dev server runs on Vite's default port (`5173`) and proxies API calls per `VITE_DEV_API_PROXY`/`VITE_API_URL` config in `src/lib/api-base.ts`.

Log in with a seeded demo account, or use the dev-only one-click demo login buttons on `/login` (only rendered when `import.meta.env.DEV` is true).

## 7. Build

```bash
# Frontend
npm run build          # vite build -> dist/
npm run build:dev       # development-mode build (source maps, unminified-ish)

# Backend
cd dezprox-backend
npm run build            # tsc -> dist/
```

## 8. Test

```bash
# Frontend e2e (Playwright) — from repo root
npm run test:e2e
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:headed   # headed browser mode
```
⚠️ Most Playwright specs are `test.skip()`'d (assessment flow, review flow, socket resilience, most auth flows) — only 2 lightweight negative-path auth tests run for real today. Passing `test:e2e` does **not** mean the core product flows work. See [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md).

```bash
# Backend unit + e2e (Jest) — from dezprox-backend/
npm run test              # unit tests
npm run test:watch
npm run test:cov            # coverage report
npm run test:e2e            # Jest e2e config (separate from Playwright)
```

## 9. Lint & Format

```bash
npm run lint      # both projects define this script
npm run format    # prettier --write .
```
⚠️ Both projects pin **ESLint 9**, which requires a flat config (`eslint.config.js`/`.mjs`) — **neither project has one in the repo.** As committed, `npm run lint` will likely fail or no-op depending on your ESLint installation. Adding a flat config to both projects is a fast, high-value fix — see [`14_CODING_GUIDELINES.md`](./14_CODING_GUIDELINES.md) and [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md).

## 10. Debug

**Backend:**
```bash
cd dezprox-backend
npm run start:debug   # Nest with --inspect, attach a debugger on the default Node port (9229)
```
Structured logs come from Pino — in `NODE_ENV=development` they're pretty-printed to the console; secrets (`authorization`, `password`, `token`, `refreshToken`) are automatically redacted, so don't expect to see them in logs even in dev.

**Frontend:** standard Vite HMR + React DevTools + browser devtools. Sentry only initializes in production builds (`src/main.tsx`), so local errors surface in the console, not Sentry.

**Queues:** visit `http://localhost:4000/queues` for the Bull-Board dashboard (monitors the `ai-evaluation` queue — jobs, retries, failures).

**Database:** any standard Postgres client (psql, TablePlus, DBeaver) against your local `DB_HOST/PORT/USER/PASS/NAME`. Remember `synchronize: false` — schema changes only happen via migrations, never by connecting a GUI and editing the table directly (or if you must for local experimentation, immediately follow up with a matching migration).

## Quick Reference — All npm Scripts

**Root (frontend):** `dev`, `build`, `build:dev`, `preview`, `lint`, `format`, `test:e2e`, `test:e2e:ui`, `test:e2e:headed`

**`dezprox-backend/` (backend):** `build`, `format`, `start`, `start:dev`, `start:debug`, `start:prod`, `lint`, `test`, `test:watch`, `test:cov`, `test:debug`, `test:e2e`, `typeorm`, `migration:gen`, `migration:run`, `migration:revert`, `seed:dev-users`

## Related Documents

- [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md) — Docker/production setup and full env var reference
- [`04_DATABASE.md`](./04_DATABASE.md) — schema and migration details
- [`16_HANDOVER_GUIDE.md`](./16_HANDOVER_GUIDE.md) — Day 1 checklist for a new developer
