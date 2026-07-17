# 16 — Handover Guide

**Read this document first.** Everything else in `/docs` is reference material; this is the operational guide for the developer taking over this codebase.

## Project Summary

Dezprox Hiring Platform is an internal recruitment and technical-assessment tool: React 19 + TanStack Router/Query frontend, NestJS + PostgreSQL + Redis backend, OpenAI-powered code review, Socket.IO realtime. Four roles (Admin, HR, Manager, Candidate). Full context in [`01_PROJECT_OVERVIEW.md`](./01_PROJECT_OVERVIEW.md).

## Current Project Health: 58% Complete

| Layer | Completion | Verdict |
|---|---|---|
| Backend | 68% | Mature, production-grade engineering |
| Database | 65% | Clean schema/indexing, but two real integrity issues (see below) |
| Frontend | 55% | Strong stack, but the core user journey is broken |
| **Core candidate assessment flow** | **~30%** | **Non-functional end to end today** |

**The one sentence that matters:** a candidate cannot complete an assessment today, for reasons that are fully diagnosed and individually small fixes. See Critical Blockers below.

## Critical Blockers (Fix Before Any New Feature Work)

These four things, together, break the entire core product. Each is independently a small fix; nobody has done an integration pass to connect them.

1. **No `Assessment` row is ever created for a candidate.** `AssessmentsService.create()` exists and works, but nothing calls it. Fix: wire it into `CandidatesService`'s candidate-creation flow.
2. **Two frontend API methods are missing.** `candidate/assessment.tsx` calls `assessmentApi.getMcqQuestions()` and `assessmentApi.getTypingPassage()` — neither exists in `src/lib/api.ts`, even though the backend routes they should call already work. Fix: add both methods.
3. **Question Bank writes to tables the live engine never reads.** Admin-created questions in `mcq_questions`/`coding_questions` can never reach a candidate, because the engine reads from a separate `questions` table. Fix: architectural decision + bridge (see [`04_DATABASE.md`](./04_DATABASE.md)).
4. **Two unrelated crash bugs** block the results page (`candidate/results.tsx` missing `Progress` import) and 5 other routes (`ComingSoon` uses the wrong router's `<Link>`). Both are one-line fixes.

Full detail with file:line references: [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md).

## What Works

- Authentication (login/JWT rotation/RBAC) — 90% complete, production-quality
- Candidate Management (CRUD, invite, pipeline, soft delete) — 80%
- Manager Review page (`manager/reviews.tsx`) — the single best-built page in the app, use it as a template
- Reports listing/detail, shortlist, result release — 75%
- Analytics backend (8 cached endpoints) — excellent, just missing one frontend page
- AI Evaluation pipeline (OpenAI + BullMQ) — the most production-ready backend module, currently starved of input by blocker #1 above
- Docker Compose deployment, CI (build/test/validate stage), observability (Sentry, Pino, Prometheus, health checks)

## What Doesn't Work

- Candidate MCQ round — crashes on load (blocker #2)
- Candidate Typing round — crashes on load (blocker #2)
- Question Bank → live assessment — no connection (blocker #3)
- Assessment Builder — UI shell only, Save/Publish do nothing
- 5 routes (`hr/interviews`, `hr/settings`, `manager/analytics`, `manager/settings`, `candidate/profile`) — crash on render (blocker #4)
- Candidate results page — crashes when viewing a released report (blocker #4)
- Settings (all 4 roles) — no backend exists for any of it
- Admin staff/user management — `UsersModule` has no controller, no `/users` API exists at all
- Coding round test execution — "Run" button is a fake string, no sandbox exists

## Critical Bugs (Ranked)

See [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) for the full registry with file:line references. Top 8, in fix order:

1. `AssessmentsService.create()` never called
2. `assessmentApi.getMcqQuestions`/`getTypingPassage` missing
3. Question Bank ↔ live engine disconnect
4. `results.tsx` missing `Progress` import
5. `ComingSoon` router crash (5 routes)
6. `GET /reports/:id` wrong lookup
7. `feedbacks` table migration/entity drift (found during this documentation pass — may 500 on a fresh migration-built DB)
8. MCQ submit payload shape mismatch

## Environment Variables Checklist

Full reference with every key: [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md#environment-variables--full-reference). Before deploying anywhere:

- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET` set (app refuses to boot without these)
- [ ] `DB_HOST/PORT/USER/PASS/NAME` (or `DATABASE_URL`) set, `DB_SSL=true` for any non-local host
- [ ] `REDIS_HOST/PORT` set, `REDIS_PASSWORD` set for anything beyond local dev
- [ ] `FRONTEND_URL` set to the real frontend origin (CORS)
- [ ] `OPENAI_API_KEY` set if AI Evaluation is required (use `OPENAI_MODEL`, **not** `AI_MODEL` — the latter is silently ignored)
- [ ] `SMTP_HOST/PORT/USER/PASS` set if invite emails are required (use `SMTP_FROM`, **not** `MAIL_FROM`)
- [ ] `VITE_API_URL` set at frontend **build time** (baked into the bundle — cannot change post-build without rebuilding)
- [ ] `SENTRY_DSN` / `VITE_SENTRY_DSN` set for production error tracking (optional but recommended)
- [ ] `ALERT_WEBHOOK_URL` set if webhook alerting is desired (undocumented in templates — add manually)
- [ ] ⚠️ If deploying via `docker-compose.yml` as-is, **manually add `SMTP_*` env vars** — the compose file currently passes `MAIL_*` names that the code doesn't read

## Deployment Checklist

- [ ] All env vars above set for the target environment
- [ ] `npm run migration:run` executed against the target database
- [ ] `feedbacks` table drift fixed with a new migration (see Database Migration Status below) **before** the feedback feature is used
- [ ] Postgres/Redis host ports firewalled or unpublished if not local dev (`docker-compose.yml` currently exposes both to the host)
- [ ] SSL/TLS termination added in front of Nginx — `nginx.conf` has none configured
- [ ] `docker-compose up --build -d`, then verify `GET /health` returns 200
- [ ] Verify frontend loads and can reach `/api` and `/socket.io` through Nginx
- [ ] Confirm CI is green on the branch being deployed (`.github/workflows/ci.yml`) — note this does **not** include the skipped e2e specs

Full detail: [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md).

## Database Migration Status

- 12 migrations exist and are sequential/applied-in-order safe (`1700000001`–`1700000012`).
- `synchronize: false` everywhere — migrations are the only legitimate schema-change path. Do not use a GUI to hand-edit the schema.
- **Action required before production use:** write migration `1700000013` to fix the `feedbacks` table drift (add `overall_rating`, `technical_comment`, `communication_comment`; drop or backfill `comment`). See [`04_DATABASE.md` §11](./04_DATABASE.md#11-feedbacks).
- Migration `1700000012` has an **empty, irreversible `down()`** — if you need to roll back past it, you'll need to write the down-migration by hand or restore from a backup.
- Consider a cleanup migration to drop the orphaned `question_bank_questions` table once confirmed unused.
- The CLI `data-source.ts` (used by `migration:generate`) doesn't set the same naming strategy as the runtime `database.module.ts` — manually review any newly generated migration's SQL before applying.

## Third-Party Services & Accounts Required

| Service | Purpose | Required for |
|---|---|---|
| **OpenAI API** | Code evaluation (AI Evaluation module) | AI Evaluation feature — silently no-ops without it |
| **SMTP provider** (e.g. SendGrid, SES, or any SMTP server) | Invite emails | Candidate invite flow — silently no-ops without it |
| **Sentry** | Error tracking (frontend + backend) | Optional but strongly recommended in production |
| **PostgreSQL 15+ hosting** | Primary datastore | Required — self-hosted or managed (the config supports Railway-style `DATABASE_URL` out of the box) |
| **Redis 7+ hosting** | Queues, cache, socket adapter | Required |
| Discord/Slack webhook | `AlertService` critical alerts | Optional |

No other third-party SaaS dependencies exist. No payment processor, no external ATS integration, no SSO/OAuth provider.

## Day 1 Tasks (First Day for the Incoming Developer)

1. Read this document fully, then [`01_PROJECT_OVERVIEW.md`](./01_PROJECT_OVERVIEW.md) and [`11_CURRENT_STATUS.md`](./11_CURRENT_STATUS.md).
2. Follow [`10_DEVELOPER_SETUP.md`](./10_DEVELOPER_SETUP.md) — get the app running locally (frontend + backend + Postgres + Redis).
3. Log in as each of the 4 demo roles; click through every page to see the stubs/crashes firsthand (don't just read about them).
4. Read [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) in full.
5. Reproduce Critical Blocker #2 locally (open the candidate assessment flow, watch it crash in the console) — this builds the intuition needed for the rest of Sprint 1.
6. Set up your own `.env` files from the `.example` templates, being careful of the `AI_MODEL`/`OPENAI_MODEL` and `MAIL_FROM`/`SMTP_FROM` naming mismatches documented in [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md).

## Week 1 Roadmap

| Day | Focus |
|---|---|
| 1 | Environment setup, orientation, reproduce known bugs locally (see Day 1 above) |
| 2 | Fix Blocker #4 (two crash bugs — `Progress` import, `ComingSoon` router) and Blocker #2 (missing API methods) — these are small, build confidence, unblock manual testing of the rest |
| 3 | Fix Blocker #1 (wire `AssessmentsService.create()` into candidate creation) — write/run a test that a new candidate gets an assessment row |
| 4 | Design the Question Bank ↔ live engine bridge (Blocker #3) — this is a real architectural decision, involve the product owner if possible before implementing |
| 5 | Implement the bridge; write the `feedbacks` table fixing migration; do a full manual walkthrough of one candidate completing all 3 rounds |

By end of Week 1, a candidate should be able to complete a full assessment without crashing — this is the single most valuable outcome of the first week.

## Sprint Plan for Completing the MVP

See [`12_ROADMAP.md`](./12_ROADMAP.md) for the full 4-sprint breakdown (Unblock Core Product → Complete Assessment Experience → Admin/HR/Manager Completeness → Hardening). Sprint 1 (~2 weeks) is Week 1 above plus buffer/testing; it is the only sprint that blocks all subsequent product usage.

## Estimated Effort Per Module

| Module | Remaining effort | Notes |
|---|---|---|
| Assessment Engine (MCQ/Typing/Coding bridge) | 1.5–2 weeks | Sprint 1 — highest priority, architectural |
| Question Bank bridge | included above | The core of the Sprint 1 architectural work |
| Reports (`findById` fix + `feedbacks` migration) | 1–2 days | Small, isolated fixes |
| Assessment Builder (real persistence) | 3–5 days | Depends on Question Bank bridge being done first |
| Admin Users/Settings (`UsersController` + backend) | 3–5 days | New module, well-scoped |
| Manager Analytics page | 0.5–1 day | Backend already complete — pure frontend work |
| HR dead-button wiring (Export/Invite) | 0.5–1 day | Small |
| Code execution sandbox (if required) | 1–2 weeks | Only if product requires automated grading; otherwise 0 (document as intentional) |
| Auth hardening (forgot-password, httpOnly cookies, global guard) | 3–5 days | Sprint 4 |
| Notification center | 3–5 days | Sprint 4, needs scoping first |
| ESLint flat config (both projects) | 0.5 day | High value, low effort |

## Production Readiness Checklist

- [ ] All 4 Critical Blockers resolved and manually verified (a candidate can complete a full assessment)
- [ ] `feedbacks` migration fix applied
- [ ] Forgot-password flow exists (or the absence is a conscious, documented product decision)
- [ ] Refresh token storage reviewed (httpOnly cookie migration, or the localStorage/XSS tradeoff is documented and accepted)
- [ ] `JwtAuthGuard` registered globally, or every controller manually re-audited for the guard
- [ ] SSL/TLS termination in front of Nginx
- [ ] Postgres/Redis not exposed on public host ports
- [ ] ESLint actually runs (flat config added) and CI enforces it
- [ ] Playwright specs for the assessment/review/socket flows un-skipped and passing (or explicitly deferred with sign-off)
- [ ] Sentry DSNs configured for both frontend and backend
- [ ] Backup strategy in place for PostgreSQL (not currently documented/implemented anywhere in this repo)
- [ ] A real CD stage exists, or the manual deploy process is documented and rehearsed

## Developer Checklist (Ongoing)

- [ ] Never enable `synchronize: true` — migrations only
- [ ] Any new controller gets `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` — copy an existing controller, don't write from scratch
- [ ] Any new backend route gets added to [`05_API_REFERENCE.md`](./05_API_REFERENCE.md) in the same PR
- [ ] Any new frontend API method is checked against the actual backend route before use (this exact mistake caused Blocker #2)
- [ ] Run `npm run format` before committing in both projects

## Important Files (Know These Before Changing Anything Nearby)

| File | Why it matters |
|---|---|
| `dezprox-backend/src/assessments/assessments.service.ts` | Owns the round state machine; `create()` is the missing link for Blocker #1 |
| `dezprox-backend/src/database/migrations/` | Schema history — never bypass with a manual DB edit |
| `src/lib/api.ts` | The single source of truth for every frontend↔backend call |
| `src/routes/candidate/assessment.tsx` | The core (currently broken) candidate journey — 636 lines, owns all 3 rounds + timer + anti-cheat in one file |
| `src/routes/__root.tsx` | Auth guard for every route — get this wrong and you break login redirects app-wide |
| `dezprox-backend/src/main.ts` | Global middleware stack (guards, pipes, interceptors) — changes here affect every route |
| `docker-compose.yml` | Production topology — has the `MAIL_*`/`SMTP_*` env mismatch, fix carefully |

## High Priority Modules

Authentication, Assessment Engine (all 3 rounds + the bridge), Candidate Management, Reports — these are the modules the entire product depends on.

## Low Priority Modules (Until Scoped)

Settings (all roles), Notifications (in-app), HR Interview Scheduling — these have no backend and no clear spec; building UI further without a scoping conversation risks more throwaway work like the current Assessment Builder shell.

## Things to Never Change Without Review

- **`synchronize` setting** in `database.module.ts`/`data-source.ts` — must stay `false`. Enabling it even temporarily against a real database risks silent, undocumented schema drift on top of the drift that already exists.
- **JWT secret rotation** — rotating `JWT_SECRET`/`JWT_REFRESH_SECRET` invalidates every active session instantly; coordinate with users/ops before doing this in production.
- **The global `ValidationPipe` config** (`whitelist`/`forbidNonWhitelisted`) — loosening this reopens a class of bugs the current strictness prevents.
- **Migration `down()` methods that are already broken** (11, 12) — don't attempt to "fix" them retroactively by editing an already-applied migration file; write a new forward migration instead.
- **`RolesGuard`/`@Roles()` on existing controllers** — removing or loosening role checks on any existing route without a security review.

## Recommended Development Order

1. Sprint 1 (Critical Blockers) — see Week 1 Roadmap above.
2. `feedbacks` migration fix (small, but do it before Reports feedback is used in any environment beyond local dev).
3. Sprint 2 (complete the assessment experience).
4. Sprint 3 (Admin/HR/Manager completeness) — do the Manager Analytics page early in this sprint, it's nearly free.
5. Sprint 4 (hardening) — do the ESLint flat config early regardless of sprint order; it's cheap and immediately improves every subsequent change's safety net.

## Risks & Assumptions

| Risk/Assumption | Detail |
|---|---|
| Assumes candidates are intentionally invite-only | If self-registration is actually desired, this is a bigger scope change than anything in the current roadmap |
| Assumes AI+manual grading is the intended design for coding | If automated test-case grading is actually required, budget 1–2 extra weeks for a sandbox |
| Assumes current scale doesn't need horizontal DB scaling | Revisit if candidate volume grows an order of magnitude |
| Assumes the single "Initial commit" git state means no other developer has WIP elsewhere | Confirm no other branches/forks exist with in-progress fixes before starting Sprint 1 from scratch |
| Assumes `PRODUCTION_READINESS_REPORT.md`'s "GO" verdict is outdated/inaccurate | The Critical Blockers above directly contradict it — do not deploy to production based on that document |

## Definition of Done for the MVP

The MVP is done when:
1. A candidate can log in, complete all 3 assessment rounds (MCQ, Typing, Coding) without any crash, and see their result once released.
2. An Admin/HR user can invite a candidate and see them move through the full pipeline to a hiring decision.
3. A Manager can review a coding submission (with AI evaluation visible) and submit a score/feedback that persists correctly (including the `feedbacks` table fix).
4. Every route in the app renders without a crash — including the currently-broken `ComingSoon` stub routes (even if their content is still "coming soon," the page itself must not throw).
5. `npm run lint` actually runs in both projects.
6. The production readiness checklist above is fully checked.

## Related Documents

Every other file in `/docs` — this guide is the front door, not a replacement for the detail in each. Start with [`01_PROJECT_OVERVIEW.md`](./01_PROJECT_OVERVIEW.md) if you haven't already, then come back here.
