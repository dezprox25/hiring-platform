# 13 — Known Issues

Every entry below was verified by direct code inspection (either during the 2026-07-09 audit or during this documentation pass on 2026-07-17). File:line references are as accurate as the source at time of writing — re-verify line numbers if the file has since changed.

## App-Breaking Bugs

### #01 — 🔴 Critical — MCQ round crashes on load
`src/routes/candidate/assessment.tsx:61` calls `assessmentApi.getMcqQuestions()`, which is not defined in `src/lib/api.ts`. `TypeError: assessmentApi.getMcqQuestions is not a function`.
**Fix:** add `getMcqQuestions(assessmentId)` to `assessmentApi`, calling `GET /assessments/:id/mcq/questions` (this backend route already exists and works).

### #02 — 🔴 Critical — Typing round crashes on load
`src/routes/candidate/assessment.tsx:154` calls `assessmentApi.getTypingPassage()`, also undefined in the API client.
**Fix:** add `getTypingPassage(assessmentId)` to `assessmentApi`, calling `GET /assessments/:id/typing/passage`.

### #03 — 🔴 Critical — Assessments are never created
`AssessmentsService.create()` (`dezprox-backend/src/assessments/assessments.service.ts`) is never invoked anywhere in the codebase (verified by full-repo grep). No candidate-creation path calls it. `GET /candidates/me/assessment` always returns `assessmentId: null`.
**Fix:** call `AssessmentsService.create(candidateId)` from `CandidatesService`'s candidate-creation transaction (or from the invite-acceptance flow — confirm the intended trigger point with the product owner).

### #04 — 🔴 Critical — Question Bank is disconnected from the assessment engine
`question-bank/*` writes to `mcq_questions`/`coding_questions`; the live engine reads only from `questions` (`assessments/mcq.service.ts:34`, `assessments/coding.service.ts:19`). No code bridges them. See [`04_DATABASE.md`](./04_DATABASE.md) for the schema-level detail.
**Fix:** architectural decision required — either point the live engine at `mcq_questions`/`coding_questions`, or build an explicit publish/sync step from Question Bank into `questions`.

### #05 — 🔴 Critical — Results page crashes on a missing import
`src/routes/candidate/results.tsx:201` renders `<Progress value={100} />` with no `Progress` import in the file. `ReferenceError` the moment a released report renders its Integrity Report card.
**Fix:** `import { Progress } from '@/components/ui/progress'`.

### #06 — 🔴 Critical — `ComingSoon` crashes on render, breaking 5 routes
`src/components/coming-soon.tsx` uses `react-router-dom`'s `<Link>`, but the app only mounts TanStack Router's `<RouterProvider>` — there is no `react-router-dom` `<Router>` anywhere in the tree. Affects `hr/interviews`, `hr/settings`, `manager/analytics`, `manager/settings`, `candidate/profile`.
**Fix:** replace with TanStack Router's `<Link>` from `@tanstack/react-router`.

### #07 — 🔴 Critical — Report lookup uses the wrong ID
`dezprox-backend/src/reports/reports.controller.ts:70-76` — `GET /reports/:id` calls `findByCandidateId(id, user)`, treating a report ID as a candidate ID. Flagged in the original developer's own code comment as unfinished.
**Fix:** implement a real `findById` lookup in `ReportsService`.

### #08 — 🔴 Critical — `feedbacks` table migration/entity drift (found during this documentation pass)
Migration `1700000008-CreateFeedbacks.ts` creates `comment` (NOT NULL) + a flat `recommendation`. The current `Feedback` entity instead expects `overall_rating`, `technical_comment`, `communication_comment` — none of which were ever added by a later migration. On a database built purely from migrations, `POST /reports/:id/feedback` will likely fail (missing columns / NOT NULL violation on the unused `comment` column). See [`04_DATABASE.md` §11](./04_DATABASE.md#11-feedbacks).
**Fix:** write a new migration adding the three missing columns and dropping or backfilling `comment`.

## High-Severity Bugs

### #09 — 🟠 High — MCQ submit payload shape mismatch
`assessment.tsx:66-67` posts `{selectedOption}` cast `as any`; the backend's `SubmitMcqDto` expects `{ answers: [{questionId, selectedOption}] }`. The cast is hiding a real contract mismatch — fix alongside #01.

### #10 — 🟠 High — Missing FK constraints
`mcq_answers.question_id` has no relation or FK at either the ORM or DB level. `coding_submissions.question_id` and `questions.created_by_id` have an ORM `@ManyToOne` relation but **no DB-level FK constraint** (the migrations that add these columns omit the `REFERENCES` clause). Referential integrity currently relies entirely on application code.

### #11 — 🟠 High — Timer expiry is not server-authoritative
BullMQ's `TimerProcessor` only emits a WebSocket event (`assessment:forcesubmit`) on expiry; it does not independently finalize the round server-side beyond that. A client that drops the socket connection can potentially outlast the timer, mitigated only by a 5-second grace check on manual submit (`AssessmentsService.validateTimeLimit`).

### #12 — 🟠 High — Migration 12 is fully irreversible
`1700000012-FixEverythingElse.ts` ships an **empty `down()`** — cannot be cleanly rolled back in any environment. Migration 11's `down()` is also only a partial rollback (documented in the migration's own comment).

## Dead Code / Unused

| # | Item | Detail |
|---|---|---|
| #13 | `src/App.tsx` | Never imported; app boots via `src/router.tsx` + TanStack's `RouterProvider` instead. Uses `react-router-dom`'s `BrowserRouter` — a different router than the app actually uses. |
| #14 | `src/server.ts`, `src/start.ts` | Import `@tanstack/react-start`, which is **not a dependency** in `package.json` at all. |
| #15 | `src/lib/error-capture.ts`, `src/lib/error-page.ts` | Only consumed by the dead files above. |
| #16 | `src/hooks/use-mobile.tsx` | Defined, never imported anywhere. |
| #17 | `react-router-dom`, `@cloudflare/vite-plugin` dependencies | Used only by dead/broken files above. |
| #18 | `question_bank_questions` DB table | Created by migration 10, no entity maps to it — superseded by migration 12's separate tables. Safe to drop via a proper migration after confirming with the team. |
| #19 | `typing_results.word_count` column | Added by migration 5, never referenced by the entity or dropped later. |
| #20 | `StartAssessmentDto`, `RefreshTokenDto`, `BulkImportMcqDto` | Defined, never actually used by their respective controllers. |

## Dead UI (No Handler Wired)

| Page | Element | Detail |
|---|---|---|
| `admin/builder.tsx` | "Save draft", "Publish" | No `onClick` at all |
| `admin/questions.tsx` | "Save question" (create dialog) | No submit handler |
| `hr/candidates.tsx` | "Export", "+ Invite candidate" | No `onClick` |
| `admin/settings.tsx` | 3 of 4 tabs (Notifications, Security, and one other) | Uncontrolled inputs, no Save handler; only Branding tab has a Save button and it's inert |

## Documentation Drift (Prior-Developer Docs vs. Actual Code)

Found while compiling this `/docs` set — the following root-level guides contain claims that don't match the implementation. Treat this `/docs` folder as the current source of truth going forward; consider retiring or heavily revising the old guides to avoid future confusion.

| Doc | Claim | Reality |
|---|---|---|
| `SECURITY_GUIDE.md` | Zod is used for validation alongside `class-validator` | Zero Zod imports exist anywhere in the backend — validation is `class-validator` + global `ValidationPipe` only |
| `ENV_GUIDE.md` / `.env.example` | `AI_MODEL` configures the OpenAI model | Code reads `OPENAI_MODEL`; `AI_MODEL` is silently ignored |
| `ENV_GUIDE.md` / `.env.example` | `MAIL_FROM` sets the outbound email sender | Code reads `SMTP_FROM`; `MAIL_FROM` is silently ignored |
| `docker-compose.yml` | Passes `MAIL_HOST/PORT/USER/PASS` to backend/worker | Code reads `SMTP_HOST/PORT/USER/PASS` — Compose is wiring the wrong variable names |
| `MONITORING.md` | Documents `ALERT_WEBHOOK_URL` | Correctly documented in that file, but absent from every `.env.example`/`docker-compose.yml` |
| `INFRASTRUCTURE.md` | Postgres/Redis are network-isolated | Both publish host ports directly in `docker-compose.yml` (5432, 6379) — reachable outside Docker |
| `STARTUP_GUIDE.md` | References `docker-compose.prod.yml` for production | This file does not exist in the repository — only one `docker-compose.yml` exists |
| `PRODUCTION_READINESS_REPORT.md` | Declares "GO" for launch (dated 2026-05-14) | Self-assessed by the same prior agent that wrote the other docs; contradicted by the app-breaking bugs above, which were still present as of 2026-07-17. Treat this verdict skeptically. |
| `TESTING_CHECKLIST.md` | Implies broad manual+automated QA coverage | Automated coverage is thin — 6 of 8 Playwright specs are `test.skip()`'d |

## Security Findings (from the 2026-07-09 audit, still valid)

| Finding | Risk |
|---|---|
| Refresh token returned in JSON response body, likely persisted in `localStorage` | Medium — exposed to any future XSS |
| `JwtAuthGuard` registered per-controller, not globally | Medium — no safety net for a future controller |
| No stricter throttle on `/auth/login` specifically | Medium — shares the global 100/min limit |
| bcrypt cost factor 10 (12 is more current best practice) | Low |
| No file upload endpoints exist anywhere | N/A — missing capability, not a vulnerability |

No SQL injection vectors, no secrets committed to git, no hardcoded JWT fallback secret, and consistent RBAC were found — the security fundamentals are genuinely solid. See [`08_AUTHENTICATION.md`](./08_AUTHENTICATION.md) for the full picture.

## E2E Test Coverage Gap

`e2e/specs/assessment.spec.ts`, `review.spec.ts`, `socket.spec.ts` are **entirely `test.skip()`'d**. `auth.spec.ts` has 2 active tests (invalid-credentials, redirect-to-login) and 2 skipped (admin login, logout). The one assessment spec, even if unskipped, targets a URL scheme (`/candidate/assessment/test-id?round=1`) that doesn't match the real single-route, status-driven implementation — it was written against an earlier design and never updated.

## Related Documents

- [`11_CURRENT_STATUS.md`](./11_CURRENT_STATUS.md) — module-level status these bugs map to
- [`04_DATABASE.md`](./04_DATABASE.md) — full detail on schema-level issues
- [`16_HANDOVER_GUIDE.md`](./16_HANDOVER_GUIDE.md) — critical blockers checklist for a new developer
