# 07 — Backend

Root: `dezprox-backend/`, framework NestJS 11.1.19, TypeORM 0.3.29, package `dezprox-backend@1.0.0`.

## Module Inventory

16 modules under `dezprox-backend/src/`, registered in `AppModule` (`src/app.module.ts`):

| Module | Path | Controller? | Purpose |
|---|---|---|---|
| `AuthModule` | `src/auth/` | ✅ `/auth` | Login, refresh, logout, JWT strategies/guards |
| `UsersModule` | `src/users/` | ❌ **none** | User entity + service, internal-only, consumed by AuthModule |
| `CandidatesModule` | `src/candidates/` | ✅ `/candidates` | Candidate CRUD, pipeline status |
| `AssessmentsModule` | `src/assessments/` | ✅ `/assessments` | 3-round assessment engine (MCQ/Typing/Coding services) |
| `QuestionBankModule` | `src/question-bank/` | ✅ `/question-bank` | Isolated MCQ/Coding question CRUD |
| `ReportsModule` | `src/reports/` | ✅ `/reports` | Aggregated scoring, feedback, shortlist/release |
| `AiEvaluationModule` | `src/ai-evaluation/` | ✅ `/ai-evaluations` | OpenAI code review, BullMQ processor |
| `AnalyticsModule` | `src/analytics/` | ✅ `/analytics` | 8 cached dashboard/chart endpoints |
| `HealthModule` | `src/health/` | ✅ `/health` | Terminus health checks |
| `MetricsModule` | `src/metrics/` | ✅ `/metrics` | Prometheus metrics + Bull-Board (`/queues`) |
| `MailModule` | `src/mail/` | ❌ | nodemailer service + templates (invite email) |
| `RedisModule` | `src/redis/` | ❌ | ioredis wrapper, Socket.IO Redis adapter |
| `DatabaseModule` | `src/database/` | ❌ | TypeORM config, migrations |
| `GatewayModule` (in `src/gateway/`) | `src/gateway/` | N/A (WS) | Socket.IO gateway + timer processor |
| `AlertModule` | `src/common/alerts/` | ❌ | Webhook alerting (`ALERT_WEBHOOK_URL`) |
| `QueueMonitoringModule` | `src/metrics/queue-monitoring.module.ts` | ❌ (mounts Bull-Board UI, not a REST controller) | BullMQ monitoring dashboard |

## Controllers

9 controllers, 60 HTTP routes total. Full route-by-route detail in [`05_API_REFERENCE.md`](./05_API_REFERENCE.md). Consistent pattern across every controller: `@UseGuards(JwtAuthGuard, RolesGuard)` at the class level, `@Roles(...)` per-route or per-class override, `@Public()` to opt out (used only by `/auth/login` and the entire `Health`/`Metrics` controllers).

## Services

Key business-logic services and what they own:

| Service | File | Responsibility |
|---|---|---|
| `AuthService` | `auth/auth.service.ts` | bcrypt password check, JWT sign/verify, refresh-token hash rotation |
| `CandidatesService` | `candidates/candidates.service.ts` | Transactional create (User+Candidate+invite email), ownership checks, status state machine |
| `AssessmentsService` | `assessments/assessments.service.ts` | Round state machine, server-side time-remaining calculation, ownership resolution (`getAssessmentForUser`) — **`create()` exists but is never called from anywhere in the codebase** |
| `McqService` | `assessments/mcq.service.ts` | Question shuffling (per-candidate cache), server-side grading |
| `TypingService` | `assessments/typing.service.ts` | Deterministic passage selection (hash of assessment ID), WPM/accuracy/mistake calculation |
| `CodingService` | `assessments/coding.service.ts` | Question fetch, autosave, submit, manager review, fire-and-forget AI trigger |
| `McqQuestionService` / `CodingQuestionService` | `question-bank/*.service.ts` | Isolated CRUD for the (disconnected) Question Bank |
| `ReportsService` | `reports/reports.service.ts` | Report aggregation/listing/feedback |
| `AiEvaluationService` | `ai-evaluation/ai-evaluation.service.ts` | Enqueue/status/retrigger for AI evaluation jobs |
| `AnalyticsService` | `analytics/analytics.service.ts` | 8 aggregate query methods, each cached |
| `MailService` | `mail/mail.service.ts` | nodemailer wrapper, graceful no-op when SMTP unconfigured |
| `RedisService` | `redis/redis.service.ts` | Thin ioredis wrapper (get/set/del/ping) |
| `GatewayService` | `gateway/gateway.service.ts` | Pure calculation helpers for round timing (`getRoundStartedAt`, `getSecondsRemaining`, `isTimeUp`) |

## DTOs

Every mutating endpoint is backed by a `class-validator`-decorated DTO — enforced globally by `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`, so any field not on the DTO is rejected, not silently dropped. Full DTO shapes are listed per-endpoint in [`05_API_REFERENCE.md`](./05_API_REFERENCE.md).

**Known dead DTOs** (defined, never used by any controller):
- `StartAssessmentDto` (`assessments/dto/start-assessment.dto.ts`) — empty class, unused
- `RefreshTokenDto` (`auth/dto/refresh-token.dto.ts`) — refresh token actually comes from the Passport strategy, not the request body
- `BulkImportMcqDto` (`question-bank/dto/bulk-import-mcq.dto.ts`) — controller uses a raw `@Body('csv') csvString: string` instead

## Entities

12 entities map to 12 tables (full column-level detail in [`04_DATABASE.md`](./04_DATABASE.md)): `User`, `Candidate`, `Assessment`, `McqAnswer`, `TypingResult`, `CodingSubmission`, `Question`, `McqQuestion`, `CodingQuestion`, `Report`, `Feedback`, `AiEvaluation`. TypeORM repositories are injected via `@InjectRepository(Entity)` — there is no separate repository-pattern abstraction layer; services talk to TypeORM repositories directly.

## Guards

| Guard | File | What it checks |
|---|---|---|
| `JwtAuthGuard` | `auth/guards/jwt-auth.guard.ts` | Valid access-token JWT (Passport `jwt` strategy); bypassed by `@Public()` |
| `JwtRefreshGuard` | `auth/guards/jwt-refresh.guard.ts` | Valid refresh-token JWT (Passport `jwt-refresh` strategy) |
| `RolesGuard` | `common/guards/roles.guard.ts` | `request.user.role` against `@Roles(...)` metadata |
| `WsJwtGuard` | `common/guards/ws-jwt.guard.ts` | Same JWT validation for WebSocket connections/messages |
| `ThrottlerGuard` | global (`APP_GUARD`) | 100 req/min per IP across the whole app |

**Note:** `JwtAuthGuard` is applied **per-controller**, not globally via `APP_GUARD`. Every existing controller has it correctly, but a future controller written without the decorator would be open by default. See [`08_AUTHENTICATION.md`](./08_AUTHENTICATION.md) and [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md).

## Interceptors

| Interceptor | Scope | Purpose |
|---|---|---|
| `ResponseInterceptor` | Global (`APP_INTERCEPTOR`) | Wraps every response as `{ data, status: 'success' }` |
| `MetricsInterceptor` | Global | Records request duration/count for Prometheus |
| `ClassSerializerInterceptor` | Global | Applies `@Exclude()` (e.g. `password_hash`, `correctAnswer`) |
| `CacheInterceptor` | Per-route, `AnalyticsController` only | Redis-backed response caching, TTL 300–3600s |

## Filters

`SentryGlobalFilter` — global exception filter that reports unhandled exceptions to Sentry before returning the standard NestJS HTTP error response.

## Queues & Schedulers

BullMQ (Redis-backed), configured globally via `BullModule.forRootAsync` in `app.module.ts`.

| Queue | Processor | Trigger | Behavior |
|---|---|---|---|
| `ai-evaluation` | `AiEvaluationProcessor` (`ai-evaluation/ai-evaluation.processor.ts`) | Fire-and-forget call from `CodingService.submit()` | Deduped job ID, 3 attempts, exponential backoff from 5s, Sentry capture on final failure |
| `assessment-timer` | `TimerProcessor` (`gateway/timer.processor.ts`) | Delayed job scheduled on `assessment:join` (WebSocket) | Re-validates round hasn't already changed; if time is up, force-submits via `gateway.emitForceSubmit`; else re-queues |

Monitoring: **Bull-Board** dashboard mounted at `/queues` (`@bull-board/nestjs` + `@bull-board/express`, registered for the `ai-evaluation` queue) via `QueueMonitoringModule`.

## Caching

`@nestjs/cache-manager` + `cache-manager-ioredis-yet` (`redisStore`), default TTL 600s, applied selectively via `CacheInterceptor` to all 8 `AnalyticsController` routes (per-route TTL 300–3600s, cache key `analytics_dashboard` for the two dashboard variants).

## Validation

Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, enableImplicitConversion: true })` set in `main.ts` — this is the **only** validation layer; `SECURITY_GUIDE.md` (a prior-developer doc) incorrectly claims Zod is also used — zero Zod imports exist anywhere in the backend. Trust the code, not that doc, on this point.

## Bootstrap (`main.ts`) — Full Middleware Stack

1. Helmet (CSP only in production)
2. CORS (`origin: true` dev / `FRONTEND_URL` prod, `credentials: true`)
3. Global `ValidationPipe`
4. Global `ResponseInterceptor` + `MetricsInterceptor` + `ClassSerializerInterceptor`
5. Global `ThrottlerGuard` (100/min/IP)
6. Global `SentryGlobalFilter`
7. Redis-backed Socket.IO adapter attached before `listen()`
8. Pino structured logging with secret redaction (`authorization`, `password`, `token`, `refreshToken`)
9. Listens on `PORT` (default 4000)

No global route prefix, no Swagger/OpenAPI setup.

## Related Documents

- [`05_API_REFERENCE.md`](./05_API_REFERENCE.md) — every route this backend exposes
- [`04_DATABASE.md`](./04_DATABASE.md) — every entity/table this backend persists to
- [`08_AUTHENTICATION.md`](./08_AUTHENTICATION.md) — full auth flow detail
- [`03_SYSTEM_ARCHITECTURE.md`](./03_SYSTEM_ARCHITECTURE.md) — queue/socket/redis diagrams
