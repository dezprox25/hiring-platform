# 05 — API Reference

**Base URL:** none configured — no global prefix (`app.setGlobalPrefix` is not called). In development the frontend proxies through Vite; in production requests go through Nginx (`/api/` → `http://backend:4000/`, see [`09_DEPLOYMENT.md`](./09_DEPLOYMENT.md)). All paths below are relative to the backend root, e.g. `POST /auth/login`.

**Response envelope:** every successful response is wrapped by the global `ResponseInterceptor`:
```json
{ "data": { /* actual payload */ }, "status": "success" }
```
The frontend's `unwrapData()` helper (`src/lib/api.ts`) strips this automatically.

**Auth header:** `Authorization: Bearer <accessToken>` on every route except those marked **Public**.

**Validation:** global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` — any request body field not declared on the DTO is **rejected with 400**, not silently dropped.

**No Swagger/OpenAPI** is set up in this backend — this document is the only structured API reference that exists.

**Rate limiting:** global `ThrottlerGuard`, 100 requests/minute per client IP, applied to every route including `/auth/login` (no stricter login-specific limit exists).

---

## Role Legend

| Group | Roles included |
|---|---|
| `ADMIN_ONLY` | ADMIN |
| `ADMIN_HR` | ADMIN, HR |
| `ADMIN_MANAGER` | ADMIN, MANAGER |
| `ADMIN_HR_MANAGER` | ADMIN, HR, MANAGER |
| `ALL_STAFF` | ADMIN, HR, MANAGER |
| `ALL_ROLES` | ADMIN, HR, MANAGER, CANDIDATE |

## Standard Error Codes

| Code | Meaning | When |
|---|---|---|
| 400 | Bad Request | DTO validation failure, business-rule violation (e.g. wrong round state) |
| 401 | Unauthorized | Missing/invalid/expired JWT |
| 403 | Forbidden | Valid JWT, wrong role, or ownership check failure |
| 404 | Not Found | Entity doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded (100/min/IP) |
| 500 | Internal Server Error | Unhandled exception (captured by Sentry via `SentryGlobalFilter`) |

---

## 1. Auth — `/auth` (`AuthController`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Validate credentials, issue token pair |
| POST | `/auth/refresh` | `JwtRefreshGuard` | Rotate access+refresh tokens |
| POST | `/auth/logout` | `JwtAuthGuard` | Clear stored refresh-token hash |

### `POST /auth/login`
Request:
```json
{ "email": "user@dezprox.com", "password": "min6chars" }
```
Response `200`:
```json
{ "data": { "accessToken": "...", "refreshToken": "...", "user": { "id": "uuid", "email": "...", "role": "admin" } }, "status": "success" }
```
Errors: `400` invalid body shape, `401` wrong credentials.

### `POST /auth/refresh`
No body (refresh token is validated by `JwtRefreshStrategy` from the `Authorization` header, not the request body — note: a `RefreshTokenDto` exists in the codebase but is **unused/dead**). Returns a new `{accessToken, refreshToken}` pair. `200`.

### `POST /auth/logout`
No body. Clears `users.refresh_token_hash` server-side. `204 No Content`.

---

## 2. Candidates — `/candidates` (`CandidatesController`)

Class guard: `JwtAuthGuard, RolesGuard` on every route below.

| Method | Path | Roles | Body / Query | Description |
|---|---|---|---|---|
| POST | `/candidates` | ADMIN_HR | `CreateCandidateDto` | Create candidate (+ User + invite email, transactional) |
| POST | `/candidates/:id/invite` | ADMIN_HR | — | Resend invite email |
| GET | `/candidates` | ADMIN_HR_MANAGER | `status?, roleApplied?, search?, page?, limit?` | Paginated/filterable list |
| GET | `/candidates/me` | CANDIDATE | — | Current candidate's own record |
| GET | `/candidates/me/assessment` | CANDIDATE | — | `{ assessmentId }` for current candidate |
| GET | `/candidates/me/result` | CANDIDATE | — | **Stub** — always returns `{message:'Results not yet released', result:null}` |
| GET | `/candidates/:id` | ALL_ROLES | — | Get one (ownership-enforced for CANDIDATE) |
| PATCH | `/candidates/:id` | ADMIN_HR | `UpdateCandidateDto` (partial of Create) | Update fields |
| PATCH | `/candidates/:id/status` | ADMIN_HR_MANAGER | `{ status }` (enum) | Move pipeline status |
| DELETE | `/candidates/:id` | ADMIN_ONLY | — | Soft delete |

`CreateCandidateDto`: `{ fullName: string(min 2), email: string(email), phone?: string, roleApplied: string, notes?: string }`
`CandidateStatus` enum: `invited, active, submitted, evaluated, hired, rejected`

Errors: `400` validation / invalid status transition, `403` ownership violation (CANDIDATE accessing another candidate's `:id`), `404` not found.

---

## 3. Assessments — `/assessments` (`AssessmentsController`)

Class guard: `JwtAuthGuard, RolesGuard`.

| Method | Path | Roles | Body | Description |
|---|---|---|---|---|
| POST | `/assessments/:id/start` | CANDIDATE | — | Start round 1, sets `startedAt` |
| GET | `/assessments/:id/status` | ALL_ROLES | — | `{status, currentRound, timeRemaining}` |
| GET | `/assessments/:id/mcq/questions` | CANDIDATE | — | 15 shuffled MCQ questions (round 1 only) |
| POST | `/assessments/:id/mcq/submit` | CANDIDATE | `SubmitMcqDto` | Grade + store answers, advance to round 2 |
| GET | `/assessments/:id/typing/passage` | CANDIDATE | — | Typing passage text (round 2 only) |
| POST | `/assessments/:id/typing/submit` | CANDIDATE | `SubmitTypingDto` | Score WPM/accuracy, advance to round 3 |
| GET | `/assessments/:id/coding/question` | CANDIDATE | — | One coding question (round 3 only) |
| POST | `/assessments/:id/coding/autosave` | CANDIDATE | `AutosaveCodingDto` | Save draft code, no round advance |
| POST | `/assessments/:id/coding/submit` | CANDIDATE | `SubmitCodingDto` | Final submit, completes assessment, queues AI eval |
| POST | `/assessments/:id/coding/review` | ADMIN, MANAGER | `ManagerReviewDto` | Add manual score/feedback |
| GET | `/assessments/:id/coding/submission` | ALL_STAFF | — | Fetch submission for staff review |

**DTOs:**
```ts
SubmitMcqDto { answers: { questionId: string; selectedOption: string }[] } // min 1 item
SubmitTypingDto { typedText: string; timeTakenSeconds: number (≥1); passage: string }
SubmitCodingDto { code: string; language: 'javascript'|'typescript'|'python'|'java'|'cpp'; timeTakenSeconds: number (≥1) }
AutosaveCodingDto { draftCode: string }
ManagerReviewDto { managerScore: number (0–100); managerFeedback: string }
```

⚠️ **Frontend integration bug:** `src/lib/api.ts`'s `assessmentApi` does **not** define `getMcqQuestions()` or `getTypingPassage()` — but `src/routes/candidate/assessment.tsx` calls both. These two GET endpoints exist and work on the backend; only the frontend client method is missing. See [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) Bug #01/#02.

Errors: `400` wrong round state / time limit exceeded, `403` not the assessment owner, `404` assessment/question not found.

---

## 4. Question Bank — `/question-bank` (`QuestionBankController`)

Class guard + role: `JwtAuthGuard, RolesGuard`, `@Roles(ADMIN_MANAGER)` — HR and CANDIDATE cannot access any route in this controller.

| Method | Path | Roles (override) | Body / Query | Description |
|---|---|---|---|---|
| POST | `/question-bank/mcq` | ADMIN_MANAGER | `CreateMcqQuestionDto` | Create MCQ question |
| POST | `/question-bank/mcq/bulk-import` | ADMIN_MANAGER | `{ csv: string }` (raw field — the `BulkImportMcqDto` class exists but is unused) | Bulk import from CSV text |
| GET | `/question-bank/mcq` | ADMIN_MANAGER | `status?, topic?, roleApplied?, difficulty?, page?=1, limit?=20(max100)` | Paginated list |
| GET | `/question-bank/mcq/:id` | ADMIN_MANAGER | — | Get one (answer redacted) |
| PATCH | `/question-bank/mcq/:id` | ADMIN_MANAGER | Partial `CreateMcqQuestionDto` | Update |
| PATCH | `/question-bank/mcq/:id/status` | ADMIN_MANAGER | `{ status }` | Toggle active/inactive |
| DELETE | `/question-bank/mcq/:id` | **ADMIN_ONLY** | — | Soft delete |
| POST | `/question-bank/coding` | ADMIN_MANAGER | `CreateCodingQuestionDto` | Create coding question |
| GET | `/question-bank/coding` | ADMIN_MANAGER | `status?, language?, difficulty?, page?=1, limit?=20(max100)` | Paginated list |
| GET | `/question-bank/coding/:id` | ADMIN_MANAGER | — | Get one |
| PATCH | `/question-bank/coding/:id` | ADMIN_MANAGER | Partial `CreateCodingQuestionDto` | Update |
| PATCH | `/question-bank/coding/:id/status` | ADMIN_MANAGER | `{ status }` | Toggle active/inactive |
| DELETE | `/question-bank/coding/:id` | **ADMIN_ONLY** | — | Soft delete |

```ts
CreateMcqQuestionDto { questionText: string; options: string[4]; correctAnswer: string; topic: string; roleApplied: string; difficulty?: 'easy'|'medium'|'hard'; status?: 'active'|'inactive' }
CreateCodingQuestionDto { prompt: string; language: ProgrammingLanguage; difficulty?; status? }
```

⚠️ Remember: writes here never reach `questions`, the table the live assessment engine reads. See [`04_DATABASE.md`](./04_DATABASE.md).

---

## 5. Reports — `/reports` (`ReportsController`)

Class guard: `JwtAuthGuard, RolesGuard`.

| Method | Path | Roles | Body / Query | Description |
|---|---|---|---|---|
| GET | `/reports/me` | CANDIDATE | — | Candidate's own report |
| GET | `/reports` | ADMIN, HR, MANAGER | `roleApplied?, isShortlisted?, minScore?, maxScore?, page?, limit?` | Paginated/filterable list |
| GET | `/reports/candidate/:candidateId` | ADMIN, HR, MANAGER | — | Report by candidate ID (registered before `:id` to avoid route collision) |
| GET | `/reports/:id` | ADMIN, HR, MANAGER | — | ⚠️ **Bug:** internally calls `findByCandidateId(id, user)`, not a true report-ID lookup — flagged by an explicit TODO in the source (`reports.controller.ts`) |
| PATCH | `/reports/:id/release` | ADMIN, HR | `{ released: boolean; message?: string }` | Release/withhold candidate visibility |
| PATCH | `/reports/:id/shortlist` | ADMIN, HR | `{ isShortlisted: boolean }` | Toggle shortlist flag |
| POST | `/reports/:id/feedback` | ADMIN, MANAGER | `CreateFeedbackDto` | Add feedback — ⚠️ see [`04_DATABASE.md`](./04_DATABASE.md) `feedbacks` drift, this may 500 on a migration-only DB |
| GET | `/reports/:id/feedback` | ADMIN, HR, MANAGER | — | List feedback entries |

```ts
CreateFeedbackDto { overallRating: number (1-5); technicalComment?: string; communicationComment?: string; recommendation: 'hire'|'reject'|'hold' }
```

---

## 6. AI Evaluation — `/ai-evaluations` (`AiEvaluationController`)

Class guard: `JwtAuthGuard, RolesGuard`.

| Method | Path | Roles | Body | Description |
|---|---|---|---|---|
| GET | `/ai-evaluations/:candidateId` | ALL_STAFF | — | Fetch AI evaluation result |
| GET | `/ai-evaluations/:candidateId/status` | ALL_STAFF | — | Poll job status (pending/running/completed/failed) |
| POST | `/ai-evaluations/:candidateId/trigger` | ADMIN_MANAGER | `{ force?: boolean = false }` | Re-queue evaluation job |

---

## 7. Analytics — `/analytics` (`AnalyticsController`)

Class guard + role: `JwtAuthGuard, RolesGuard`, `@Roles(ALL_STAFF)` — CANDIDATE excluded from the entire controller.

| Method | Path | Roles (override) | Cache TTL | Description |
|---|---|---|---|---|
| GET | `/analytics` | ALL_STAFF | 300s | Dashboard aggregate data |
| GET | `/analytics/dashboard` | ALL_STAFF | 300s | Dashboard stats variant |
| GET | `/analytics/radar/:candidateId` | ALL_STAFF | none | Radar-chart skill data |
| GET | `/analytics/topics` | ALL_STAFF | 600s | Topic-wise performance breakdown |
| GET | `/analytics/pass-fail` | ALL_STAFF | 600s | Pass/fail ratio |
| GET | `/analytics/trends` | **ADMIN only** | 3600s | Hiring trends over time |
| GET | `/analytics/leaderboard` | ALL_STAFF | 600s | Top-candidate leaderboard |
| GET | `/analytics/scores/distribution` | ALL_STAFF | 1200s | Score distribution histogram |

Common query DTO (`AnalyticsFilterDto`): `{ startDate?: ISO date; endDate?: ISO date; roleApplied?: string }`

---

## 8. Health — `/health` (`HealthController`) — all Public

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Full check: DB ping, memory heap <150MB, memory RSS <300MB, Redis indicator (placeholder implementation) |
| GET | `/health/liveness` | Always `{status:'up'}` |
| GET | `/health/readiness` | DB ping only |
| GET | `/health/details` | `{status, uptime:{seconds, readable}, timestamp}` |

## 9. Metrics — `/metrics` (`MetricsController`) — Public

| Method | Path | Description |
|---|---|---|
| GET | `/metrics` | Prometheus-format text metrics (`Content-Type: text/plain; version=0.0.4`) |

Also: **`/queues`** — Bull-Board dashboard (not a REST API; a mounted Express UI for monitoring the `ai-evaluation` BullMQ queue). Not authenticated by the app's own JWT guards — verify network exposure before production use.

---

## No `/users` API

`UsersModule` exists (`src/users/`) but has **no controller**. There is no `POST/GET/PATCH/DELETE /users` endpoint of any kind. `UsersService` is only consumed internally by `AuthModule`. This is a known gap — see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) and [`02_FEATURES.md` §11 Settings](./02_FEATURES.md#11-settings).

---

## WebSocket API — namespace `/assessment`

Guard: `WsJwtGuard` — reads `handshake.auth.token`, verifies as a JWT, rejects with `WsException('Unauthorized')` if invalid.

### Client → Server events

| Event | Payload | Behavior |
|---|---|---|
| `assessment:join` | `{ assessmentId }` | Validates ownership, joins rooms `assessmentId` + `candidate:{sub}`, schedules a BullMQ timer-check job, replies `assessment:joined` |
| `anticheat:violation` | `{ assessmentId, type, detail? }` | Broadcasts `candidate:violation` to `hr-room` |
| `code:autosave` | `{ assessmentId, draftCode }` | Persists draft via `CodingService.autosave`, replies `code:autosaved` |
| `timer:request` | `{ assessmentId }` | Replies `timer:tick` with remaining seconds |
| `hr:join` | none | If role is HR/ADMIN, joins `hr-room`, replies `hr:joined` |

### Server → Client events

| Event | Trigger | Target |
|---|---|---|
| `assessment:joined` | after `assessment:join` | joining client |
| `error` | join failure | joining client |
| `candidate:violation` | `anticheat:violation` received | `hr-room` |
| `code:autosaved` | after `code:autosave` | sender |
| `timer:tick` | after `timer:request` | sender |
| `hr:joined` | after `hr:join` (HR/ADMIN only) | sender |
| `round:advanced` | round state change (server-initiated) | `assessmentId` room |
| `candidate:statusUpdated` | candidate status change (server-initiated) | `hr-room` |
| `assessment:forcesubmit` | timer expiry (BullMQ) or manual force-complete | `assessmentId` room |

Full sequence diagram in [`03_SYSTEM_ARCHITECTURE.md`](./03_SYSTEM_ARCHITECTURE.md#socket-architecture).

---

## Route Count Summary

| Controller | Routes | Notes |
|---|---|---|
| AuthController | 3 | 1 public |
| CandidatesController | 9 | |
| AssessmentsController | 11 | 2 have frontend client gaps |
| QuestionBankController | 13 | disconnected from live engine |
| ReportsController | 8 | 1 has a known bug |
| AiEvaluationController | 3 | |
| AnalyticsController | 8 | |
| HealthController | 4 | all public |
| MetricsController | 1 | public |
| **Total HTTP routes** | **60** | plus 1 WS namespace (5 listened / 8 emitted events) |

## Known API-Layer Gaps (cross-reference)

| Gap | Detail |
|---|---|
| `assessmentApi.getMcqQuestions` / `getTypingPassage` missing in frontend | Backend routes exist; frontend client doesn't call them correctly — [Bug #01/#02](./13_KNOWN_ISSUES.md) |
| `GET /reports/:id` uses wrong lookup | [Bug #07](./13_KNOWN_ISSUES.md) |
| No `/users` controller | [`02_FEATURES.md` §11](./02_FEATURES.md#11-settings) |
| `StartAssessmentDto`, `RefreshTokenDto`, `BulkImportMcqDto` defined but unused | Dead DTOs — safe to remove or wire up |
| No global route prefix / no Swagger | Consider adding both for future API consumers |
