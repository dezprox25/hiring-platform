# 03 — System Architecture

## Overview

The platform is a classic three-tier architecture: a React SPA, a NestJS monolith API (plus one worker process for background jobs), and PostgreSQL + Redis for persistence and coordination. There is no microservices split — `backend` and `worker` in `docker-compose.yml` run the **same built image**, just with different start commands (`worker` overrides the command to run the same `dist/main` in a mode where BullMQ processors execute — the "worker" is not a separate codebase).

```mermaid
flowchart LR
    subgraph Tier1["Presentation"]
        SPA["React 19 SPA\n(Vite build, served by Nginx)"]
    end
    subgraph Tier2["Application"]
        API["NestJS API\n(port 4000)"]
        WS["Socket.IO Gateway\n(/assessment namespace)"]
        Worker["Worker process\n(same image, BullMQ processors)"]
    end
    subgraph Tier3["Data"]
        PG[("PostgreSQL 15")]
        Redis[("Redis 7")]
    end
    subgraph Ext["External"]
        OpenAI["OpenAI API"]
        SMTP["SMTP"]
    end
    SPA <-->|HTTPS + WebSocket| API
    SPA <-->|WebSocket| WS
    API --> PG
    API --> Redis
    WS --> Redis
    Worker --> PG
    Worker --> Redis
    Worker --> OpenAI
    API --> SMTP
```

## Frontend Architecture

- **Framework:** React 19.2.6 + TypeScript 5.9.3, built with Vite 7.3.3.
- **Routing:** TanStack Router 1.100, **file-based** — every file under `src/routes/**` becomes a route automatically via the `@tanstack/router-vite-plugin`, which generates `src/routeTree.gen.ts`. There is no manual route config file to maintain.
- **Data fetching:** TanStack Query 5.100 for all server state (caching, retries, refetch-on-focus). There is **no** Redux/Zustand/global Context for app state — `localStorage` holds the auth token/user, and every page owns its own `useQuery`/`useMutation` calls (a documented duplication problem, see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md)).
- **Styling:** Tailwind CSS v4, CSS-first configuration (no `tailwind.config.js` — theme tokens live in `src/styles.css` under an `@theme inline` block using OKLCH colors). Dark mode toggles a `.dark` class on `<html>` (not persisted across reloads).
- **Component library:** shadcn/ui ("new-york" style) over Radix primitives — 46 files in `src/components/ui/`.
- **Realtime:** `src/lib/socket.ts` wraps `socket.io-client`, connecting to the `/assessment` namespace with the JWT access token passed via `auth.token` in the handshake.
- **Root guard:** `src/routes/__root.tsx` runs a `beforeLoad` check that redirects unauthenticated users away from any `/admin`, `/hr`, `/manager`, `/candidate` route to `/login`, and redirects already-authenticated users away from `/login` to their role's dashboard.

See [`06_FRONTEND.md`](./06_FRONTEND.md) for the full file-by-file breakdown.

## Backend Architecture

- **Framework:** NestJS 11 (modular, decorator-based). 16 feature/infra modules under `dezprox-backend/src/`.
- **ORM:** TypeORM 0.3.29 against PostgreSQL, `SnakeNamingStrategy`, **`synchronize: false` always** — migrations are the only path to schema change.
- **Auth model:** Passport JWT strategies (`jwt`, `jwt-refresh`), guards applied **per-controller** (not globally) via `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`.
- **Global pipeline (`main.ts`):** Helmet (CSP in prod), `ThrottlerGuard` (100 req/min/IP, global), global `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`, `ResponseInterceptor` (wraps every response as `{ data, status: 'success' }`), `MetricsInterceptor`, `ClassSerializerInterceptor`, `SentryGlobalFilter`. No global route prefix (e.g. no `/api/v1`) and no Swagger/OpenAPI setup.
- **Background work:** BullMQ (Redis-backed) — `ai-evaluation` queue (3-attempt exponential backoff, deduped job IDs) and `assessment-timer` queue (delayed jobs that force-submit a round when its timer expires, processed by `TimerProcessor`). A Bull-Board dashboard is mounted at `/queues`.
- **Caching:** `@nestjs/cache-manager` with `cache-manager-ioredis-yet`, applied to all 8 Analytics endpoints (TTL 300–3600s).
- **Observability:** Pino structured logging with explicit secret redaction (`authorization`, `password`, `token`, `refreshToken`), Sentry (errors + profiling), a Prometheus `/metrics` endpoint, and `/health` (Terminus: DB ping, memory heap/RSS thresholds, a placeholder Redis check), `/health/liveness`, `/health/readiness`, `/health/details`.

See [`07_BACKEND.md`](./07_BACKEND.md) for the full module breakdown and [`05_API_REFERENCE.md`](./05_API_REFERENCE.md) for every route.

## Database Architecture

PostgreSQL 15, 12 entities/tables, all relations enforced primarily at the ORM level (several are **not** enforced at the DB level — see [`04_DATABASE.md`](./04_DATABASE.md) for the full list of drift/gaps). Two parallel, unconnected "question" data models exist (`questions` used by the live engine vs. `mcq_questions`/`coding_questions` used by the admin Question Bank UI) — this is the single biggest architectural defect in the system.

```mermaid
erDiagram
    USERS ||--o| CANDIDATES : "1-1"
    USERS ||--o{ FEEDBACKS : "1-M (manager)"
    USERS ||--o{ QUESTIONS : "1-M (createdBy, no DB FK)"
    CANDIDATES ||--o| ASSESSMENTS : "1-1"
    CANDIDATES ||--o| REPORTS : "1-1 (DB-unique)"
    CANDIDATES ||--o| AI_EVALUATIONS : "1-1"
    ASSESSMENTS ||--o| CODING_SUBMISSIONS : "1-1"
    ASSESSMENTS ||--o{ MCQ_ANSWERS : "1-M"
    ASSESSMENTS ||--o| TYPING_RESULTS : "1-1"
    ASSESSMENTS ||--o| REPORTS : "1-1 (DB-unique)"
    ASSESSMENTS ||--o| AI_EVALUATIONS : "1-1 (DB-unique)"
    QUESTIONS ||--o{ CODING_SUBMISSIONS : "1-M (no DB FK)"
    REPORTS ||--o{ FEEDBACKS : "1-M"
    MCQ_QUESTIONS {
        uuid id PK
        text questionText
        text_array options
    }
    CODING_QUESTIONS {
        uuid id PK
        text prompt
    }
```

> `mcq_questions` and `coding_questions` are drawn separately above because they have **zero relations** to anything else in the schema — they are not connected to `QUESTIONS`, `CODING_SUBMISSIONS`, or `MCQ_ANSWERS`. Full column-level detail is in [`04_DATABASE.md`](./04_DATABASE.md).

## Folder Structure

```
project1/                          # repo root — frontend
├── src/
│   ├── routes/                    # TanStack Router file-based pages (admin/hr/manager/candidate/login/index)
│   ├── components/                # dashboard-layout, coming-soon, error-boundary, stat-card
│   │   └── ui/                    # 46 shadcn/Radix primitives
│   ├── hooks/                     # use-mobile.tsx (unused)
│   ├── lib/                       # api.ts, api-base.ts, auth-user.ts, socket.ts, export-csv.ts, utils.ts
│   ├── types/                     # api.ts (shared TS interfaces)
│   ├── router.tsx                 # TanStack Router bootstrap
│   ├── routeTree.gen.ts           # generated — do not hand-edit
│   └── main.tsx                   # app entry
├── e2e/                            # Playwright specs (mostly test.skip())
├── public/
├── docker-compose.yml
├── Dockerfile                      # frontend (Nginx) image
├── nginx.conf
└── dezprox-backend/                # backend — separate npm project
    └── src/
        ├── auth/                   # JWT strategies, guards, decorators
        ├── users/                  # User entity + service (NO controller — no /users API)
        ├── candidates/
        ├── assessments/            # MCQ/Typing/Coding round services + entities
        ├── question-bank/          # isolated MCQ/Coding question CRUD
        ├── reports/
        ├── ai-evaluation/          # OpenAI integration + BullMQ processor
        ├── analytics/
        ├── gateway/                # Socket.IO gateway + timer processor
        ├── mail/                   # nodemailer service + templates
        ├── redis/                  # ioredis wrapper + Socket.IO Redis adapter
        ├── database/               # TypeORM module, data-source, migrations/
        ├── health/                 # Terminus health checks
        ├── metrics/                # Prometheus + Bull-Board
        ├── common/                 # guards, decorators, enums, constants, helpers
        └── config/                 # jwt.config.ts, database.config.ts
```

## State Management

Frontend: **no global state library.** Server state → TanStack Query. Auth state → `localStorage` (`accessToken`, `refreshToken`, `user`), read via `src/lib/auth-user.ts`. UI state → local `useState` per component. This is a deliberate simplicity choice that works at current scale but means there's no single place to look for "what does the app currently know" beyond each page's own queries.

## API Layer

All frontend↔backend communication goes through a single Axios instance in `src/lib/api.ts`:
- Request interceptor injects `Authorization: Bearer <accessToken>` (skipped for `/auth/login`).
- Response interceptor: on `401`, attempts one silent `/auth/refresh` + retry; on `403`/`500`/network errors, shows a global toast (via `sonner`).
- `unwrapData()` helper strips the backend's `{ data, status: 'success' }` envelope (set by the global `ResponseInterceptor` on the NestJS side).
- Seven API objects: `authApi`, `candidatesApi`, `analyticsApi`, `reportsApi`, `questionBankApi`, `assessmentApi`, `aiEvaluationApi` — full method list in [`06_FRONTEND.md`](./06_FRONTEND.md) and [`05_API_REFERENCE.md`](./05_API_REFERENCE.md).

## Socket Architecture

Single Socket.IO namespace, `/assessment`, guarded by `WsJwtGuard` (verifies the JWT passed in `handshake.auth.token`). Backed by a Redis adapter (`RedisIoAdapter`) so it can scale horizontally across multiple backend instances.

```mermaid
sequenceDiagram
    participant C as Candidate Browser
    participant GW as AssessmentGateway (/assessment)
    participant Q as BullMQ (assessment-timer)
    participant HR as HR/Admin Browser

    C->>GW: connect (auth.token = JWT)
    C->>GW: assessment:join {assessmentId}
    GW->>GW: verify ownership, join rooms [assessmentId, candidate:{sub}]
    GW->>Q: schedule delayed "check-timer" job
    GW-->>C: assessment:joined {status, secondsRemaining}
    C->>GW: code:autosave {assessmentId, draftCode}
    GW-->>C: code:autosaved {savedAt}
    C->>GW: anticheat:violation {type, detail}
    GW-->>HR: candidate:violation {candidateId, type, detail} (room hr-room)
    Q-->>GW: timer job fires (time up)
    GW-->>C: assessment:forcesubmit {round}
    HR->>GW: hr:join
    GW-->>HR: hr:joined (room hr-room)
```

Rooms: `assessmentId` (per-assessment), `candidate:{userId}` (private), `hr-room` (HR/Admin monitoring, joined via `hr:join`).

## Queue Architecture

```mermaid
flowchart LR
    subgraph API["NestJS API process"]
        CodingSubmit["POST /assessments/:id/coding/submit"]
    end
    subgraph Redis["Redis (BullMQ backend)"]
        AIQ["ai-evaluation queue"]
        TimerQ["assessment-timer queue"]
    end
    subgraph Worker["Worker process (same image)"]
        AIProc["AiEvaluationProcessor"]
        TimerProc["TimerProcessor"]
    end
    CodingSubmit -->|enqueue, deduped jobId| AIQ
    GW["Socket Gateway assessment:join"] -->|delayed job| TimerQ
    AIQ --> AIProc
    TimerQ --> TimerProc
    AIProc -->|3x exp backoff| OpenAI["OpenAI API"]
    AIProc --> PG[("coding_submissions.ai_*")]
    TimerProc -->|"time's up"| GW2["gateway.emitForceSubmit"]
    BullBoard["Bull-Board dashboard /queues"] -.monitors.-> AIQ
    BullBoard -.monitors.-> TimerQ
```

## Redis Usage

Redis is shared infrastructure for four distinct purposes, all configured from the same `REDIS_HOST/PORT/PASSWORD/DB` env vars:
1. **BullMQ** job queues (`ai-evaluation`, `assessment-timer`).
2. **Socket.IO adapter** (`RedisIoAdapter`) — enables horizontal scaling of the WebSocket gateway.
3. **HTTP response cache** (`cache-manager-ioredis-yet`) — Analytics endpoints, 300–3600s TTL.
4. Direct key/value access via `RedisService` (`src/redis/redis.service.ts`) — thin wrapper (get/set/del/ping) available to any service that needs it.

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL

    U->>FE: submit email/password
    FE->>API: POST /auth/login
    API->>DB: find user by email
    API->>API: bcrypt.compare(password, password_hash)
    API->>API: sign accessToken (15m) + refreshToken (7d)
    API->>DB: store bcrypt(refreshToken) as refresh_token_hash
    API-->>FE: {accessToken, refreshToken, user}
    FE->>FE: store all three in localStorage
    Note over FE,API: subsequent requests
    FE->>API: any request + Authorization: Bearer accessToken
    API->>API: JwtStrategy verifies signature+expiry
    API->>API: RolesGuard checks @Roles() vs user.role
    Note over FE,API: on 401 (expired access token)
    FE->>API: POST /auth/refresh (JwtRefreshGuard)
    API->>DB: bcrypt.compare(refreshToken, refresh_token_hash)
    API-->>FE: new {accessToken, refreshToken}
    FE->>FE: retry original request once
```

Full detail in [`08_AUTHENTICATION.md`](./08_AUTHENTICATION.md).

## AI Evaluation Flow

```mermaid
sequenceDiagram
    participant C as Candidate
    participant API as AssessmentsController
    participant Svc as CodingService
    participant Q as BullMQ (ai-evaluation)
    participant AI as OpenAI API
    participant DB as PostgreSQL

    C->>API: POST /assessments/:id/coding/submit
    API->>Svc: submit(dto)
    Svc->>DB: save coding_submissions row
    Svc->>Svc: advanceRound() -> assessment completed
    Svc-->>Q: void triggerAiAnalysis(submissionId) (fire-and-forget)
    Q->>AI: responses.create({model, prompt: question+code})
    AI-->>Q: JSON {logic, readability, structure, summary, recommendation}
    Q->>DB: update coding_submissions.ai_score/ai_analysis
    Note over Q,AI: 3 retries, exponential backoff from 5s, Sentry capture on failure
```

Note: `triggerAiAnalysis` is only invoked from the live coding-submit path. Because assessments are never provisioned today (see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) Bug #03), this pipeline currently has no real input in production use, despite being fully implemented.

## Deployment Flow

```mermaid
flowchart LR
    Dev["Developer pushes to main"] --> CI["GitHub Actions: ci.yml"]
    CI --> Lint["lint-and-build\n(frontend+backend lint/typecheck/build, backend unit+e2e tests)"]
    Lint --> DockerVal["docker-validation\n(builds both images, no push)"]
    Lint --> E2E["e2e-tests\n(docker-compose up + Playwright, 60min timeout)"]
    DockerVal -.no deploy step exists.-> Manual["Manual deploy\n(docker-compose up -d on target host)"]
```

**Important:** despite the workflow being named "CI/CD Pipeline," there is **no deployment/CD stage** anywhere in `.github/workflows/ci.yml`. Deployment today is a manual `docker-compose up -d` on whatever host is targeted. Full detail in [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md).

## Related Documents

- [`04_DATABASE.md`](./04_DATABASE.md) — full schema, every column, every drift issue
- [`05_API_REFERENCE.md`](./05_API_REFERENCE.md) — all 60 REST routes + WebSocket events
- [`06_FRONTEND.md`](./06_FRONTEND.md) / [`07_BACKEND.md`](./07_BACKEND.md) — implementation detail per side
- [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md) — Docker, env vars, infra
