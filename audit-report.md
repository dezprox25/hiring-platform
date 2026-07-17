# Dezprox Hiring Platform — Implementation Status Report

**Technical Audit · Not for build · Evidence-based, code-verified**

A full-repository inspection of the frontend (React 19 + TanStack Router/Query), backend (NestJS + PostgreSQL/TypeORM), and database — covering architecture, security, UI, and product completeness against the intended feature set.

- **Audit date:** 9 Jul 2026
- **Frontend scope:** `src/` · 93 files
- **Backend scope:** `dezprox-backend/src/` · 128 files, 16 modules
- **Method:** static code inspection, 3 parallel deep-dives

## Headline Stats

| Metric | Value |
|---|---|
| Overall completion | 58% |
| Frontend | 55% |
| Backend | 68% |
| Database | 65% |
| Authentication | 90% |
| Assessment (core flow) | 30% |
| Analytics | 55% |
| AI Evaluation | 40% |

---

## Table of Contents

1. [Executive Summary](#01-executive-summary)
2. [Module Status](#02-module-status)
3. [Feature Checklist](#03-feature-checklist)
4. [UI Review](#04-ui-review)
5. [Backend Review](#05-backend-review)
6. [Database Review](#06-database-review)
7. [Security Audit](#07-security-audit)
8. [Performance Review](#08-performance-review)
9. [Code Quality](#09-code-quality)
10. [Missing Features](#10-missing-features)
11. [Bugs](#11-bugs)
12. [Technical Debt](#12-technical-debt)
13. [Recommendations](#13-recommendations)
14. [Development Roadmap](#14-development-roadmap)
15. [Final Score](#15-final-score)

---

## 01 / Executive Summary

**Overall completion: 58%. Overall quality: Fair.**

The codebase splits sharply into two halves: the backend and database show mature, production-grade engineering (transactions, RBAC, queues, retries, secret redaction, no injection vectors found), while the frontend's core product journey — a candidate actually taking an assessment — is **broken end to end** by a chain of three separate defects across three layers.

### The one finding that matters most

A candidate cannot complete an assessment today, for three independent reasons that compound each other:

1. **Backend never provisions an assessment.** `AssessmentsService.create()` in `dezprox-backend/src/assessments` is never invoked anywhere in the codebase (verified by full-repo grep) — not from candidate creation, not from any controller. Every candidate's `GET /candidates/me/assessment` returns `assessmentId: null`.
2. **Frontend calls API methods that don't exist.** `candidate/assessment.tsx:61` calls `assessmentApi.getMcqQuestions()` and `candidate/assessment.tsx:154` calls `assessmentApi.getTypingPassage()` — neither exists in `src/lib/api.ts`, so both round 1 (MCQ) and round 2 (Typing) throw immediately on load.
3. **Question Bank data can never reach a candidate anyway.** The admin-facing Question Bank writes to `mcq_questions`/`coding_questions` tables, while the live assessment engine reads exclusively from an unrelated `questions` table — no code path connects them.

Each is independently fixable (items 2 and the missing-import bug in `results.tsx` are one-line fixes), but together they mean the platform's flagship feature has never been exercised end to end as committed. See [Section 11](#11-bugs) and [Section 14](#14-development-roadmap).

Set against that, the parts of the system that *are* wired up are genuinely solid: candidate management, reports, analytics, and the manager review screen (`manager/reviews.tsx`) are well-built, real-data, production-quality work. Security fundamentals (JWT rotation, bcrypt, global validation, Helmet, rate limiting, structured logging with secret redaction) are implemented correctly and consistently. The gap is concentrated in exactly two places: the assessment-taking pipeline, and a long tail of admin/HR/manager screens that render a UI shell with no working submit handler behind it.

| Area | Completion | Note |
|---|---|---|
| Frontend | 55% | Strong stack & data layer; core candidate flow crashes; several dead-button screens |
| Backend | 68% | Mature engineering; docked for the assessment-provisioning gap and missing Users controller |
| Database | 65% | Clean schema/indexing; docked for the orphaned Question Bank relationship |
| Authentication | 90% | Login/JWT rotation/RBAC solid; no forgot-password or self-registration |
| Assessment (core flow) | 30% | Extensive code exists on both ends; non-functional as an end-to-end journey |
| Analytics | 55% | Backend endpoints excellent; one of three portals (Manager) has no page |
| AI Evaluation | 40% | Most mature backend module in the app; currently has nothing to evaluate |

---

## 02 / Module Status

Progress % reflects functional completeness (does it work end to end for a user), not lines of code written.

### Authentication — 🟡 Partial — 90%

**Implemented**
- Login, JWT access (15m) + refresh (7d) rotation
- Refresh tokens hashed (bcrypt) before storage — `auth.service.ts:81-84`
- RBAC via `RolesGuard` + `@Roles()`, `@Public()` opt-out
- Global rate limiting (100/min) via `ThrottlerGuard`
- Dev-only one-click demo logins, gated by `import.meta.env.DEV`

**Missing**
- Forgot-password / reset flow (no endpoint, no UI)
- Email verification
- Self-registration (candidates are invite-only by design — confirm this is intentional)

**Issues**
- Refresh token returned in JSON body, likely stored in `localStorage` — exposed to any future XSS **[Medium]**
- `JwtAuthGuard` is opt-in per controller, not global — `auth/strategies/jwt.strategy.ts:17-23` also doesn't re-check DB user state, so a disabled user stays valid up to 15 min
- No stricter throttle specifically on `/auth/login` (same 100/min as everything else)

**Recommendations**
- Add forgot-password flow before launch
- Move tokens to httpOnly secure cookies, or consciously accept the XSS-exposure tradeoff
- Register `JwtAuthGuard` globally with explicit `@Public()` opt-outs

### Dashboard (Admin / HR / Manager / Candidate) — 🟡 Partial — 75%

**Implemented**
- All four role dashboards wired to real APIs (`analyticsApi.getDashboardData`, `candidatesApi.findAll`, `reportsApi.findAll`) via TanStack Query
- Loading / error / empty states present on every dashboard
- Candidate dashboard polls (`refetchInterval`) while an assessment is active

**Missing**
- Nothing structurally missing — but data will mostly be empty for candidates until the assessment-provisioning bug is fixed

**Issues**
- Identical query/fetch logic duplicated across all four dashboard files — no shared hook

**Recommendations**
- Extract a shared `useDashboardData(role)` hook

### Candidate Management — 🟡 Partial — 80%

**Implemented**
- Full backend CRUD, pagination/search/filter, transactional creation + invite email — `candidates.service.ts:58-139`
- Ownership checks (`assertOwnership`), soft delete, status state machine with role restrictions — `candidates.service.ts:301-320`
- `admin/candidates.tsx` and `hr/pipeline.tsx` fully wired, real CRUD/kanban

**Missing**
- No resume/document upload anywhere in the backend (no `multer`/`FileInterceptor` found)

**Issues**
- `hr/candidates.tsx:76-77` — Export and + Invite candidate buttons have no `onClick`
- ~450 lines of near-duplicate candidate-list implementation across admin/HR/manager routes

**Recommendations**
- Wire the two dead HR buttons
- Extract a shared `CandidateListView` component
- Add resume upload if the product spec requires it

### Assessment Builder — 🔴 Not Started — 15%

**Implemented**
- `admin/builder.tsx` UI shell with local `useState` sections

**Missing**
- "Save draft" and "Publish" have no `onClick` handler at all
- No backend endpoint to persist a builder-authored assessment structure

**Issues**
- Entirely a front-end mock — no persistence path exists end to end

**Recommendations**
- Design and build a real save/publish flow that composes an assessment from Question Bank entries (this also requires fixing the Question Bank/assessment bridge — see Section 11)

### Question Bank — 🟡 Partial — 55%

**Implemented**
- MCQ + Coding CRUD, CSV bulk import, role/difficulty/status fields, soft delete — `question-bank/mcq-question.service.ts:24`, `coding-question.service.ts:14`
- `admin/questions.tsx` read + delete wired to real API

**Missing**
- "Multiple Select" question type doesn't exist — `QuestionType` enum is `{MCQ, CODING}` only
- `CreateMcqQuestionDto` hardcodes exactly 4 options + one `correctAnswer` — multi-select is architecturally impossible without a schema change
- "Typing" question type doesn't exist; passages are 10 hardcoded strings, not DB-backed or admin-editable
- "Save question" (create) dialog has no handler — `admin/questions.tsx:109`

**Issues**
- **[Critical]** `mcq_questions`/`coding_questions` tables are completely disconnected from the `questions` table the live assessment engine reads (`assessments/mcq.service.ts:34`, `assessments/coding.service.ts:19`). Nothing an admin creates here can ever reach a candidate.

**Recommendations**
- P0: bridge or unify the two question data models
- Add a Multiple-Select question type with a variable-option DTO
- Move typing passages into the DB as a real question type

### MCQ Assessment (Stage 1) — 🔴 Not Started (broken) — 20%

**Implemented**
- Server-side round/timer state machine on the backend
- `MCQRound` UI component with submit mutation

**Missing**
- No candidate has ever completed this round as shipped

**Issues**
- **[Critical]** `candidate/assessment.tsx:61` calls `assessmentApi.getMcqQuestions()`, which does not exist in `src/lib/api.ts` — throws on every load
- Submit payload shape mismatch (`{selectedOption}` cast `as any`) vs. the backend DTO — `assessment.tsx:66-67`
- Upstream: no Assessment row exists for any candidate in the first place (see Section 11)

**Recommendations**
- P0 — see Roadmap Sprint 1

### Typing Test (Stage 2) — 🔴 Not Started (broken) — 20%

**Implemented**
- Backend computes WPM/accuracy/mistakes server-side from submitted text vs. passage; `TypingResult` entity stores results

**Missing**
- Passages not manageable via any admin UI (see Question Bank)
- No "Typing" `QuestionType` exists

**Issues**
- **[Critical]** `candidate/assessment.tsx:154` calls `assessmentApi.getTypingPassage()`, which does not exist — throws on load
- Passages hardcoded, 10 fixed strings — `typing.service.ts:12-23`

**Recommendations**
- Add the missing API client method; move passages to the DB with an admin management UI

### Coding Assessment (Stage 3) — 🟡 Partial — 45%

**Implemented**
- Real Monaco editor, autosave every 30s, submit mutation
- Backend stores code/language, manual manager scoring + feedback, AI reads raw code text

**Missing**
- No code execution / sandbox of any kind (no Judge0/Docker/test runner)

**Issues**
- "Run" button just prints a canned "testing disabled in live mode" string — `assessment.tsx:365`
- Grading is 100% subjective (manager) + AI text analysis, with no objective correctness signal

**Recommendations**
- Integrate a sandboxed execution service if automated grading is required; otherwise document AI+manual grading as the intended design

### Candidate Portal (overall) — 🔴 Not Started (broken) — 35%

**Implemented**
- Dashboard with status polling; coding-round UI; anti-cheat visibility/blur listeners emitting socket events — `assessment.tsx:480-497`
- Realtime timer/round-advance socket wiring

**Missing**
- Working MCQ/Typing rounds (see above); profile page (ComingSoon, itself broken)

**Issues**
- **[Critical]** `candidate/results.tsx:201` uses `<Progress>` with no import — crashes when a released report is viewed
- "Session Integrity 100%" is hardcoded, not derived from real anti-cheat violation data

**Recommendations**
- Highest-priority area in the app — Roadmap Sprint 1

### Reports — 🟡 Partial — 75%

**Implemented**
- Backend: findAll/feedback/shortlist-toggle/result-release, all role-gated
- `admin/reports.tsx` list + detail with full AI-eval display

**Missing**
- Dedicated `findById` implementation

**Issues**
- `GET /reports/:id` calls `findByCandidateId(id, user)` — treats a report ID as a candidate ID. The developer's own code comment flags this as unfinished — `reports.controller.ts:70-76`

**Recommendations**
- Implement the dedicated lookup the existing TODO calls for

### Analytics — 🟡 Partial — 55%

**Implemented**
- 8 cached backend endpoints (dashboard/radar/topics/pass-fail/trends/leaderboard/score-distribution), sensible TTLs (300–3600s), role-gated (`trends` Admin-only)
- Admin dashboard/reports use real `recharts` against these endpoints

**Missing**
- `manager/analytics.tsx` is a `ComingSoon` stub — no page built against the (already solid) backend

**Issues**
- The stub itself is broken — see Bug #6

**Recommendations**
- Build the Manager analytics page — this is a frontend-only gap, backend is ready

### AI Evaluation — 🟡 Partial — 40%

**Implemented**
- Real OpenAI integration, BullMQ queue with job de-dupe, exponential backoff retry (3x), Sentry capture, metrics histogram — `ai-evaluation.service.ts`
- Strips `rawResponse`/`errorMessage` from client-facing responses
- Read-only display in `admin/reports.tsx` and `manager/reviews.tsx`, plus a working "Request AI re-evaluation" button (`aiEvaluationApi.retrigger`, `api.ts:190-195`)

**Missing**
- No standalone AI Evaluation page/route

**Issues**
- Given assessments are never created (Section 11), this pipeline currently has nothing to evaluate in the live flow — built but unreachable

**Recommendations**
- Once assessment provisioning is fixed, this module needs little further work — it is the most production-ready feature in the app

### Settings — 🔴 Not Started — 10%

**Implemented**
- `admin/settings.tsx` 4-tab UI shell

**Missing**
- No backend settings module/entity of any kind
- All Switches/Inputs are uncontrolled defaults; only the branding tab has a Save button, and it's inert
- HR/Manager settings are `ComingSoon` stubs (and broken — see Bug #6)
- No Admin-facing user/staff management API — `UsersModule` has no controller at all; accounts only exist via a hardcoded dev-seed (`users.service.ts:13-80`) or internal creation from Candidates. `admin/users.tsx` explicitly states "no staff directory API wired yet."

**Recommendations**
- Define scope (branding? notification prefs? role/permission management?) before building — currently pure UI scaffolding with zero backing on both frontend and backend

### Notifications — 🔴 Not Started — 20%

**Implemented**
- WebSocket events exist (`candidate:statusUpdated`, `round:advanced`, `assessment:forcesubmit`, `anticheat:violation` forwarded to an `hr-room`)
- One transactional email: invite with temp password, real nodemailer SMTP with graceful no-op if unconfigured — `mail.service.ts:47-66`

**Missing**
- No in-app notification center (bell/list) UI anywhere in `src/`
- No "results released," password-reset, or reminder emails

**Issues**
- Temp password emailed in plaintext with no forced-change-on-first-login flag on the `User` entity

**Recommendations**
- Decide if "Notifications" means in-app, email, or both; build missing templates; add a forced-password-change flag

---

## 03 / Feature Checklist

### Authentication
- [x] Login
- [x] Logout
- [x] JWT (access + refresh)
- [x] Refresh token rotation
- [x] RBAC guards/decorators
- [ ] Forgot password
- [ ] Email verification
- [ ] Global auth guard (currently opt-in)

### Candidate Management
- [x] Create / invite candidate
- [x] List / search / filter / paginate
- [x] Status pipeline (kanban)
- [x] Soft delete
- [ ] Resume / document upload
- [ ] HR export candidates
- [ ] HR quick-invite button (dead in UI)

### Assessment Builder & Question Bank
- [x] MCQ question CRUD (backend)
- [x] Coding question CRUD (backend)
- [x] CSV bulk import
- [ ] Create-question UI handler
- [ ] Multiple-select question type
- [ ] Typing question type
- [ ] Question Bank → live assessment bridge
- [ ] Builder save / publish

### Assessment Portal (Candidate)
- [x] Server-side round/timer state machine
- [x] Anti-cheat visibility/blur detection
- [x] Realtime socket updates
- [x] Coding editor (Monaco) + autosave
- [ ] MCQ round functional
- [ ] Typing round functional
- [ ] Assessment provisioned on candidate creation
- [ ] Code execution / test runner
- [ ] Server-side authoritative timer expiry
- [ ] Results page renders without crashing

### Reports, Analytics & AI
- [x] Report list / detail
- [x] Shortlist toggle
- [x] Result release
- [x] Admin analytics dashboard (charts)
- [x] AI evaluation pipeline (OpenAI + queue)
- [x] AI re-evaluation trigger (UI)
- [ ] `GET /reports/:id` correct lookup
- [ ] Manager analytics page
- [ ] Standalone AI Evaluation page

### Settings & Notifications
- [ ] Settings backend
- [ ] Settings persistence (any tab)
- [ ] Admin user/staff management API
- [ ] In-app notification center
- [ ] Results-released email
- [ ] Password-reset email
- [x] Invite email (temp password)

---

## 04 / UI Review

> **Methodology note:** This review is based on static code inspection (component structure, Tailwind classes, shadcn/radix primitive usage, data wiring), not a manual browser/screen-reader pass. All pages share the same shadcn/radix component library and Tailwind responsive utilities, which gives every screen a consistent baseline of accessible primitives (semantic roles, keyboard-operable controls, focus states) and responsive layout — that baseline is not repeated per row below. Live cross-device and assistive-technology testing is recommended as a follow-up and is called out again in Section 8.

| Page | Purpose | Completion | Data wiring | Missing / UX problems | Suggestion |
|---|---|---|---|---|---|
| admin/index.tsx | Admin dashboard | 85% | Real API | — | — |
| admin/candidates.tsx | Candidate CRUD | 85% | Real API | — | — |
| admin/assessments.tsx | Assessment list | 15% | Hardcoded array | No path to real data | Wire to a real assessments-list endpoint |
| admin/builder.tsx | Assessment builder | 15% | Local state only | Save/Publish have no handler | See Sprint 3 |
| admin/questions.tsx | Question bank | 55% | Read/delete real, create dead | "Save question" has no handler | Wire the create dialog |
| admin/reports.tsx | Reports + AI eval | 80% | Real API | — | — |
| admin/settings.tsx | Platform settings | 10% | Uncontrolled UI, no backend | Every control is inert | Scope + build backend first |
| admin/users.tsx | Staff directory | 10% | Explicit placeholder | Invite button disabled, honestly labeled | Build `UsersController` first |
| hr/index.tsx | HR dashboard | 80% | Real API | — | — |
| hr/candidates.tsx | Candidate list | 55% | Read real | Export & Invite buttons dead | Wire both handlers |
| hr/pipeline.tsx | Kanban pipeline | 80% | Real API | — | — |
| hr/interviews.tsx | Interview scheduling | 0% | ComingSoon stub | **Crashes on render** (Bug #6) | Scope this feature; fix the stub crash regardless |
| hr/settings.tsx | HR settings | 0% | ComingSoon stub | Crashes on render (Bug #6) | Fix stub crash; build once Settings backend exists |
| manager/index.tsx | Manager dashboard | 80% | Real API | — | — |
| manager/reviews.tsx | Review + score submissions | 90% | Real API, Monaco viewer, AI eval, e2e-tested selectors | Best-built page in the app | Use as the template for other pages |
| manager/candidates.tsx | Candidate read view | 75% | Real API | — | — |
| manager/analytics.tsx | Manager analytics | 0% | ComingSoon stub | Crashes on render (Bug #6) | Build against existing backend endpoints (low effort, high value) |
| manager/settings.tsx | Manager settings | 0% | ComingSoon stub | Crashes on render (Bug #6) | Fix stub crash |
| candidate/index.tsx | Candidate dashboard | 80% | Real API, polling | — | — |
| candidate/assessment.tsx | **Assessment portal (core feature)** | 35% | Coding round real; MCQ/Typing crash | Two rounds unusable; Run button is fake; submit payload mismatch | P0 — Roadmap Sprint 1 |
| candidate/results.tsx | Results / integrity report | 40% | Real API | **Crashes** on released report (missing `Progress` import); integrity % hardcoded | Fix import; derive integrity from real violation data |
| candidate/profile.tsx | Candidate profile | 0% | ComingSoon stub | Crashes on render (Bug #6) | Fix stub crash; scope feature |

---

## 05 / Backend Review

Bootstrap (`main.ts`, `app.module.ts`) is genuinely production-grade: Helmet with a real CSP, global `ThrottlerGuard`, global `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`, Pino logging with explicit secret redaction (`authorization`, `password`, `token`, `refreshToken` — `app.module.ts:44`), Sentry, environment-aware CORS, Redis-backed Socket.IO adapter, BullMQ queues, and response caching. This is not scaffold-quality code.

| Category | Rating | Basis |
|---|---|---|
| API Design | Good | Consistent REST conventions and role gating across controllers; docked for a missing `UsersController` and the `reports.controller.ts:70-76` ID-confusion bug |
| Controllers | Good | Thin, consistent `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles()` pattern applied on every controller inspected |
| Services | Good | Transactions, ownership checks, and state machines are well engineered (`candidates.service.ts`, `assessments` round logic); docked hard for `AssessmentsService.create()` being dead code that breaks the core flow |
| Database | Good | See Section 6 for full detail |
| Validation | Excellent | Global `ValidationPipe` with whitelist/transform, consistent `class-validator` DTOs throughout |
| Error Handling | Good | Sentry capture on failures, NestJS default HTTP exception semantics used consistently; a dedicated global exception filter was not independently confirmed in this audit |
| Logging | Excellent | Pino structured logging with explicit secret redaction configured at the module level |
| Security | Good | Strong fundamentals (see Section 7); one critical architectural gap, no classic vulnerabilities found |

**Bottom line:** backend engineering quality is well above what the module-status percentages alone suggest. Almost every module that looks "complete" by code volume is undermined by exactly one missing connective piece — a service method never called, a controller never written, a table never joined. This is a codebase that was built module-by-module without a final integration pass.

---

## 06 / Database Review

PostgreSQL via TypeORM 0.3.29 with `SnakeNamingStrategy` (`database.module.ts:26`). `synchronize: false` is correctly set in both `database.module.ts:25` and `data-source.ts:20` — migrations are the only path to schema change, which is the right call for production safety.

| Table | Key columns | Notable |
|---|---|---|
| `users` | email (unique), password_hash, role, is_active, refresh_token_hash | 1–1 → candidates, 1–M → feedbacks |
| `candidates` | full_name, phone, role_applied (idx), status (idx), is_deleted (idx), created_at (idx) | 1–1 → users/assessment/report/ai_evaluation |
| `assessments` | candidate_id (idx, FK), status (idx), round timestamps | 1–1 → coding_submission/typing_result/report/ai_evaluation (cascade), 1–M → mcq_answers (cascade) |
| `questions` | type, category, difficulty, text, options (json), correct_answer, created_by_id (FK → users) | The table the *live* assessment engine actually reads |
| `mcq_answers` | assessment_id (FK, cascade), question_id, selected_option, is_correct | `question_id` has **no FK constraint** — inconsistent with `coding_submissions` |
| `typing_results` | assessment_id (unique FK, cascade), passage, typed_text, wpm, accuracy, mistakes | — |
| `coding_submissions` | assessment_id (unique FK, cascade), question_id (FK), code, language, manager_score/feedback, ai_score, ai_analysis (jsonb) | — |
| `mcq_questions` | question_text, options (text[]), correct_answer, topic, role_applied, difficulty, status, is_deleted | **Orphaned** — no relation to the live assessment engine |
| `coding_questions` | prompt, language, difficulty, status, is_deleted | **Orphaned** — same issue |
| `reports` | candidate_id (unique, idx, FK), assessment_id (unique, idx, FK), scores, total_score (idx), is_shortlisted (idx) | 1–M → feedbacks |
| `feedbacks` | report_id (FK, cascade), manager_id (FK), overall_rating, recommendation | — |
| `ai_evaluations` | candidate_id (unique FK), assessment_id (unique FK), status, strengths/weaknesses (text[]), analyses (jsonb), overallScore, rawResponse | — |

> **Critical — the schema encodes the same disconnect the frontend/backend audits found independently.** Nothing in the codebase reads from both `{mcq_questions, coding_questions}` and `questions` together — confirmed by grepping both directions. There is no seed script, sync job, or migration bridging them. Structurally, the platform has **two parallel question banks** that have never been connected, which is the database-level root cause of the broken assessment flow described throughout this report.

**Relations** (text graph): `User 1–1 Candidate 1–1 Assessment`, `Assessment 1–1 CodingSubmission`, `Assessment 1–M McqAnswer`, `Assessment 1–1 TypingResult`, `Assessment 1–1 Report`, `Assessment 1–1 AiEvaluation`, `Candidate 1–1 Report`, `Candidate 1–1 AiEvaluation`, `User 1–M Question (createdBy)`, `CodingSubmission M–1 Question`, `Report 1–M Feedback`, `Feedback M–1 User`. `McqQuestion` and `CodingQuestion` stand isolated, with no relation to anything else.

- **Indexes:** reasonably placed on every filter/sort-heavy column found in query paths (`candidates.status/.roleApplied/.isDeleted/.createdAt`, `reports.totalScore/.isShortlisted`, `assessments.status/.candidateId`). No missing index found on an FK that's actually queried.
- **Constraints:** `mcq_answers.question_id` lacks a FK constraint **[Medium]**; `questions.created_by_id` is non-nullable at the entity level but the migration DDL never enforces `NOT NULL` — DB-level drift from entity intent **[Low]**.
- **Naming:** fully consistent — `SnakeNamingStrategy` + explicit overrides produce snake_case columns and camelCase TS properties throughout.
- **Migrations:** 12 total, one per entity plus two later patches — `1700000011-FixAiEvaluations.ts` and `1700000012-FixEverythingElse.ts`. Both names signal reactive, after-the-fact fixes rather than planned schema evolution; `1700000012...:89` ships an **empty `down()`**, making the migration irreversible **[Medium]**.
- **Missing tables:** Settings, Notifications, File/Resume attachments — none exist, matching the frontend/backend gaps above.
- **Scalability:** fine for current scale — stateless JWT auth, Redis-backed sockets/cache, BullMQ for async work. No partitioning or read replicas needed at this stage; revisit if candidate volume grows an order of magnitude.

---

## 07 / Security Audit

Fundamentals are solid: no SQL injection vectors, no secrets committed to git, correct password hashing, and consistent RBAC. The one **Critical** item is architectural (a broken data flow), not a classic exploit.

| Control | Finding | Risk |
|---|---|---|
| JWT | Access 15m / refresh 7d, both secrets required from env with a hard throw if missing (`jwt.config.ts:9-14`); no hardcoded fallback secret found anywhere | Low |
| Refresh token storage | Hashed with bcrypt server-side (`auth.service.ts:82`), but returned in the JSON response body — client likely persists it in `localStorage`, exposing it to any future XSS | Medium |
| RBAC | `RolesGuard` + `@Roles()` correctly present on every controller inspected; no unguarded sensitive endpoint found | Low |
| Global auth guard | `JwtAuthGuard` is registered per-controller, not globally via `APP_GUARD` — every existing controller opts in correctly today, but a future controller that forgets the decorator is open by default | Medium |
| Input validation | Global `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`; `SECURITY_GUIDE.md` claims Zod is also used — zero Zod imports found in the backend. Documentation inaccuracy, not a defect. | Low |
| SQL injection | All queries use `createQueryBuilder` with parameterized `:param` bindings; no string-concatenated SQL found anywhere | None found |
| XSS | No backend HTML templating echoes unescaped user input (mail templates use a templating engine); frontend was not exhaustively checked for `dangerouslySetInnerHTML` in this pass | Low (needs a targeted follow-up) |
| CSRF | No CSRF middleware, but auth is Bearer-token-in-header, not cookie-based — inherently low risk as long as tokens never move to cookies | Low |
| Rate limiting | Global `ThrottlerModule` (100 req/min per IP) applied uniformly, including `/auth/login` — no tighter limit on the login/refresh endpoints specifically | Medium |
| Password hashing | bcrypt, cost factor 10, applied consistently across `users.service.ts:45`, `candidates.service.ts:72,273`, `auth.service.ts:82` | Low (12 is more current best practice) |
| Secrets / env vars | `.env` files (root and backend) contain real dev secrets but are correctly gitignored and not tracked by git; `.env.example` files contain placeholders only | None found |
| CORS | Dev: reflects any origin with credentials (standard dev convenience); Prod: locked to a single `FRONTEND_URL` with credentials | Low |
| File upload security | No file upload endpoints exist anywhere in the backend — not a vulnerability, but a missing capability for a hiring platform (resumes) | N/A — missing feature |
| Security headers | Helmet applied with a real CSP in production | None found |
| Logging hygiene | Pino redacts `authorization`, `password`, `token`, `refreshToken` at the module level | None found |

| Risk level | Count | Items |
|---|---|---|
| Critical | 1 | Question Bank fully disconnected from the live assessment engine — a functional/architectural break, not a classic vuln |
| High | 0 | — |
| Medium | 5 | Refresh-token XSS exposure; auth guard opt-in-per-controller; no stricter login throttle; irreversible migrations; missing FK on `mcq_answers.question_id` |
| Low | 4 | bcrypt cost 10 vs. 12; `SECURITY_GUIDE.md` Zod claim is inaccurate; dev-mode CORS reflection; unenforced `NOT NULL` at DB level |

---

## 08 / Performance Review

> **Methodology note:** No production build or runtime profiling was executed as part of this audit — the findings below are structural, drawn from source inspection. Actual bundle size (KB), Lighthouse scores, and query latency were not measured; a build-time bundle report (`vite build` + visualizer) is recommended as a concrete follow-up.

- **Bundle size:** not measured. Structural risk: Monaco Editor (`@monaco-editor/react`, a multi-MB dependency) is statically imported in both `manager/reviews.tsx:53` and `candidate/assessment.tsx:11`, with no code-splitting.
- **Lazy loading:** none found. A repo-wide search for `React.lazy`, dynamic `import()`, or `Suspense` in application code returned zero matches (the only hit was in the dead `src/server.ts`). TanStack Router's file-based routing supports route-level code splitting but it is not being used here — every route, including Monaco, ships in the initial bundle.
- **API calls:** TanStack Query is used consistently for caching/dedupe/refetch, which is the right pattern. Undercut by the duplicated candidate-list query logic across admin/HR/manager (Section 9) — not necessarily extra network calls if query keys match, but definitely extra maintenance surface and cache-shape drift risk.
- **Backend caching:** `@nestjs/cache-manager` applied to all 8 analytics endpoints with sensible TTLs (300–3600s) — a genuine strength.
- **Query performance:** indexes are present on the columns actually filtered/sorted on (Section 6); no N+1 patterns were flagged by the backend audit, though this was not exhaustively profiled with real data volume.
- **Large components:** `candidate/assessment.tsx` is 636 lines and owns three round implementations, timer logic, socket wiring, and anti-cheat listeners in one file — a strong candidate for splitting into per-round components regardless of the functional bugs it contains.
- **Repeated logic:** the ~450 lines of near-duplicate candidate-list code (admin/HR/manager) and duplicated dashboard-query logic (Section 2) both mean identical fetch/render work is maintained three-to-four times over rather than shared.

---

## 09 / Code Quality

- **Folder structure:** conventional and easy to navigate on both sides — frontend organized by role under `src/routes/{admin,hr,manager,candidate}`, backend by domain module under `dezprox-backend/src/`. No structural complaints.
- **Type safety:** `tsconfig.json` has `"strict": true` and `noFallthroughCasesInSwitch`, but `noUnusedLocals`/`noUnusedParameters` are both `false` — dead variables and unused imports (like the missing-but-also-just-generally-unchecked `Progress` case) won't be caught by the compiler as configured.
- **Linting:** both `package.json`s define a `lint` script (`eslint .` / `eslint "{src,apps,libs,test}/**/*.ts" --fix`) and pin ESLint 9, which requires a flat `eslint.config.js`/`.mjs` by default — **no such file exists at either project root.** As committed, `npm run lint` does not run successfully in either project.
- **Reusability / component design:** shadcn/radix primitives (`src/components/ui/`, 45 files) are used consistently and not over-customized — good baseline. Above that layer, reusability is weak: three to four near-identical page implementations for "list of candidates" and "dashboard for role X" instead of one parameterized component/hook.
- **Hooks:** the app has exactly one custom hook, `src/hooks/use-mobile.tsx`, and it is never imported anywhere — dead code. There's no shared data-fetching hook layer; every page inlines its own `useQuery`/`useMutation` calls.
- **Utilities:** `src/lib/` is well organized (`api.ts`, `api-base.ts`, `auth-user.ts`, `socket.ts`, `export-csv.ts`, `utils.ts`) with a single source of truth for the API client and base URL.
- **Documentation:** nine root-level markdown guides exist (`SECURITY_GUIDE.md`, `DATABASE_GUIDE.md`, `QUEUE_GUIDE.md`, etc.) — good instinct, but several have drifted from the code (the Zod claim in `SECURITY_GUIDE.md` being the clearest example) and should be reconciled.
- **Dead code:** `src/App.tsx` (unused router entry), `src/server.ts` and `src/start.ts` (reference an uninstalled package, `@tanstack/react-start`), `src/hooks/use-mobile.tsx` — see Section 11 for the full list with line references.
- **Duplication:** the candidate-list and dashboard-query duplication noted above is the single largest maintainability liability in the frontend.

---

## 10 / Missing Features

Compared against the intended feature set (Authentication/RBAC, Candidate Management, Assessment Builder, Question Bank, 3-stage Assessment Portal, Reports, Analytics, AI Evaluation, Settings):

- ❌ Functional MCQ round for candidates (frontend API client method missing)
- ❌ Functional Typing round for candidates (frontend API client method missing + hardcoded passages)
- ❌ Server-side assessment provisioning for new candidates
- ❌ Question Bank → live assessment bridge
- ❌ Code execution / test-case sandbox for the coding round
- ❌ Admin user/staff management (no backend controller, no working UI)
- ❌ Assessment Builder persistence (Save/Publish are unwired; no backend endpoint)
- ❌ Multiple-Select question type (spec requires it; enum only has MCQ/CODING)
- ❌ Resume / document upload (no file upload endpoint anywhere in the backend)
- ❌ Forgot-password / reset flow
- ❌ Email verification
- ❌ In-app notification center
- ❌ "Results released" / reminder / password-reset email templates
- ❌ HR interview-scheduling page (stub only)
- ❌ HR and Manager settings pages (stubs only)
- ❌ Manager analytics page (stub only, backend already supports it)
- ❌ Candidate profile page (stub only)
- ❌ Settings backend (no module/entity exists)
- ❌ Forced password change on first login
- ❌ Working ESLint configuration in either project

---

## 11 / Bugs

### App-breaking

**#01 — Critical — MCQ round crashes on load.**
`candidate/assessment.tsx:61` calls `assessmentApi.getMcqQuestions()`, which is not defined in `src/lib/api.ts`.
`TypeError: assessmentApi.getMcqQuestions is not a function`

**#02 — Critical — Typing round crashes on load.**
`candidate/assessment.tsx:154` calls `assessmentApi.getTypingPassage()`, also undefined in the API client.

**#03 — Critical — Assessments are never created.**
`AssessmentsService.create()` is never invoked anywhere in `dezprox-backend/src` (verified by full-repo grep). No candidate creation path calls it. `GET /candidates/me/assessment` always returns `assessmentId: null`.

**#04 — Critical — Question Bank is disconnected from the assessment engine.**
`question-bank/*` writes to `mcq_questions`/`coding_questions`; the live engine reads only from `questions` (`assessments/mcq.service.ts:34`, `assessments/coding.service.ts:19`). No code bridges them.

**#05 — Critical — Results page crashes on a missing import.**
`candidate/results.tsx:201` renders `<Progress value={100} />` with no `Progress` import in the file — `ReferenceError` the moment a released report renders its Integrity Report card.

**#06 — Critical — `ComingSoon` crashes on render, breaking 5 routes.**
`components/coming-soon.tsx:1` uses `react-router-dom`'s `<Link>`, but the app only mounts TanStack Router's `RouterProvider` — there is no `react-router-dom` `<Router>` in the tree. Affects `hr/interviews`, `hr/settings`, `manager/analytics`, `manager/settings`, `candidate/profile`.

**#07 — Critical — Report lookup uses the wrong ID.**
`reports.controller.ts:70-76` — `GET /reports/:id` calls `findByCandidateId(id, user)`, treating a report ID as a candidate ID. Flagged in the developer's own code comment as unfinished.

### High

**#08 — High — MCQ submit payload shape mismatch.**
`assessment.tsx:66-67` posts `{selectedOption}` cast `as any`; the backend DTO shape needs verification once bug #01 is fixed — the cast is hiding a real contract mismatch.

**#09 — High — Missing FK constraint.**
`mcq_answers.question_id` is a plain UUID column with no foreign key, inconsistent with `coding_submissions.question_id` which does have one.

**#10 — High — Timer expiry is not server-authoritative.**
BullMQ's `TimerProcessor` only emits a WebSocket event on expiry; it does not finalize the round server-side. A client that drops the socket can outlast the timer, mitigated only by a 5-second grace check on manual submit.

### Dead code / unused

- **#11 — Dead** — `src/App.tsx` — never imported; the app boots via `src/router.tsx` + TanStack's `RouterProvider` instead.
- **#12 — Dead** — `src/server.ts`, `src/start.ts` — import `@tanstack/react-start`, which is not a dependency in `package.json`.
- **#13 — Dead** — `src/hooks/use-mobile.tsx` — defined, never imported anywhere.
- **#14 — Dead** — `react-router-dom` dependency — used only by the two broken/dead files above.
- **#15 — Dead UI** — Buttons with no handler: `admin/builder.tsx` (Save draft, Publish), `admin/questions.tsx` (Save question), `hr/candidates.tsx` (Export, + Invite candidate), 3 of 4 tabs in `admin/settings.tsx`.

---

## 12 / Technical Debt

- **Two parallel "question" data models.** This needs an actual architectural decision (merge the schemas, or build an explicit publish/sync step from Question Bank into the live pool) — not a patch. Every day this stays unresolved, more product logic gets built on top of the wrong table.
- **Reactive migration naming.** `1700000011-FixAiEvaluations.ts` and `1700000012-FixEverythingElse.ts` read as after-the-fact patches rather than planned schema evolution, and at least one ships an empty, irreversible `down()`.
- **No shared data-fetching layer on the frontend.** Every page inlines its own query/mutation logic; the candidate-list view alone is duplicated three times (~450 lines). This will compound as more roles/pages are added.
- **Auth guard is opt-in, not default-secure.** `JwtAuthGuard` must be manually added per controller. It has been added correctly everywhere so far, but the pattern has no safety net for the next controller someone writes under deadline pressure.
- **No code-splitting anywhere in the frontend**, despite shipping a multi-MB Monaco editor unconditionally. This will show up as a slow first paint once measured.
- **Lint is not actually enforceable as committed** — both projects pin ESLint 9 (flat-config-only) but ship no `eslint.config.js`. Any CI step that runs "lint" today either silently no-ops or fails outright, depending on the runner.
- **E2E coverage is largely aspirational.** 6 of 8 Playwright tests are `test.skip()`'d; the one covering the assessment flow targets a URL scheme (`/candidate/assessment/test-id?round=1`) that doesn't match the real single-route, status-driven implementation — it was written against an earlier design and never updated, on top of being disabled.
- **Documentation drift.** `SECURITY_GUIDE.md` claims Zod validation that doesn't exist in the code; other root-level guides should be spot-checked against implementation before being trusted as onboarding material.

---

## 13 / Recommendations

### Critical — blocks any real usage of the core product
- Wire `AssessmentsService.create()` into the candidate creation/invite flow
- Add `getMcqQuestions` / `getTypingPassage` to `src/lib/api.ts` and align the MCQ submit DTO shape
- Decide and implement the Question Bank ↔ live assessment bridge
- Fix the missing `Progress` import in `results.tsx`
- Replace `ComingSoon`'s `react-router-dom` `Link` with TanStack Router's `Link` (or remove the dependency entirely)

### High
- Fix `GET /reports/:id` to use a dedicated lookup instead of `findByCandidateId`
- Add the FK constraint on `mcq_answers.question_id`
- Make round-timer expiry server-authoritative, not just socket-notified
- Build a real `UsersController` + admin staff-management UI
- Add a code execution/sandbox for the coding round, or explicitly document AI+manual as the intended grading model

### Medium
- Move refresh tokens to httpOnly cookies, or consciously document the localStorage tradeoff
- Register `JwtAuthGuard` globally with explicit `@Public()` opt-outs
- Add a stricter rate limit specifically on `/auth/login`
- Wire the dead buttons (builder save/publish, question create, HR export/invite)
- Extract a shared candidate-list component and a shared dashboard-data hook
- Add an `eslint.config.js` to both projects so `npm run lint` actually runs
- Build the Manager Analytics page against the already-complete backend endpoints

### Low
- Bump bcrypt cost factor from 10 to 12
- Reconcile `SECURITY_GUIDE.md` and other root-level docs with actual implementation
- Code-split Monaco and route bundles
- Delete confirmed dead files (`App.tsx`, `server.ts`, `start.ts`, `use-mobile.tsx`) or wire them up if they were meant to be used
- Re-enable and fix (or delete) the 6 skipped Playwright tests, rewriting the assessment spec against the real route/URL scheme

---

## 14 / Development Roadmap

Sequenced so each sprint unblocks the next; Sprint 1 is the only one that must happen before any candidate can use the product at all.

### Sprint 1 — Unblock the core product (High difficulty, ~2 weeks)
1. Wire `AssessmentsService.create()` into candidate creation (touches a transactional flow — needs care)
2. Decide and implement the Question Bank ↔ live assessment bridge (the architectural centerpiece of this sprint)
3. Add missing frontend API methods (`getMcqQuestions`, `getTypingPassage`) and align the MCQ submit contract
4. Fix the `results.tsx` missing import and the `ComingSoon` router crash

### Sprint 2 — Complete the assessment experience (Medium–High difficulty, ~2 weeks)
1. Move typing passages into the DB with an admin management UI
2. Add a Multiple-Select question type end to end (schema, DTO, UI)
3. Integrate a code execution sandbox for the coding round, or formally scope it out
4. Fix the `GET /reports/:id` bug and the missing `mcq_answers` FK constraint

### Sprint 3 — Admin / HR / Manager completeness (Medium difficulty, ~2–3 weeks)
1. Build `UsersController` + admin staff-management UI
2. Wire Assessment Builder save/publish end to end
3. Wire HR export/invite buttons and admin Settings persistence (after scoping Settings)
4. Build Manager Analytics page (backend already ready — lowest-effort item this sprint)
5. Scope and build HR interview scheduling

### Sprint 4 — Hardening & production readiness (Medium difficulty, ~2 weeks)
1. Forgot-password flow, forced password change on first login, results-released/reminder emails
2. Move refresh token to httpOnly cookie (or document the tradeoff), add stricter login throttling, register `JwtAuthGuard` globally
3. Add working ESLint config to both projects; re-enable and fix the skipped e2e tests; code-split Monaco and routes
4. Build the in-app notification center

---

## 15 / Final Score

| Dimension | Score |
|---|---|
| Architecture | 7 / 10 |
| Frontend | 6 / 10 |
| Backend | 7.5 / 10 |
| UI | 6.5 / 10 |
| UX | 5 / 10 |
| Database | 7 / 10 |
| Security | 7.5 / 10 |
| Performance | 6 / 10 |
| Scalability | 6.5 / 10 |
| Maintainability | 5.5 / 10 |
| Code Quality | 6 / 10 |

### Overall Product Readiness — 4.5 / 10

**Not production ready.** The core candidate assessment journey — the entire reason this platform exists — is non-functional end to end due to a three-layer bug chain that is fully diagnosed in this report. The surrounding engineering (security posture, backend architecture, database design, and the admin/HR/manager read-and-review surfaces) is well above average for a project at this stage of maturity. This is a codebase that is closer to done than its bug list makes it look: Sprint 1 alone, focused entirely on the diagnosed chain, would move product readiness substantially.
