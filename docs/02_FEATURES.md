# 02 — Features

Every feature is documented with: purpose, business value, user flow, frontend components, backend modules, database tables, current status, dependencies, and future improvements. Status percentages match [`11_CURRENT_STATUS.md`](./11_CURRENT_STATUS.md) (source: code-verified audit, 2026-07-09, cross-checked during this documentation pass).

---

## 1. Authentication

**Purpose:** Secure, role-based login for four internal user types; issue and rotate JWTs.

**Business value:** Gatekeeps every other feature; without it nothing else in the platform is safe to expose.

**User flow:** User submits email/password on `/login` → backend validates via bcrypt → returns access token (15m) + refresh token (7d) + user object → frontend stores all three in `localStorage` → Axios interceptor attaches `Authorization: Bearer <token>` to every request → on 401, an interceptor silently calls `/auth/refresh` and retries once → logout clears storage and calls `/auth/logout` to invalidate the stored refresh-token hash server-side.

**Frontend:** `src/routes/login.tsx`, `src/lib/api.ts` (`authApi`), `src/lib/auth-user.ts`, root route guard in `src/routes/__root.tsx` (redirects unauthenticated users away from `/admin`, `/hr`, `/manager`, `/candidate`).

**Backend:** `AuthModule` (`src/auth/`) — `AuthController`, `AuthService`, `JwtStrategy`, `JwtRefreshStrategy`, `JwtAuthGuard`, `JwtRefreshGuard`, `RolesGuard`, `@Public()`/`@Roles()` decorators.

**Database:** `users.password_hash`, `users.refresh_token_hash` (bcrypt-hashed, never returned to client), `users.role`, `users.is_active`.

**Status:** 🟡 90% — Partial. Login/JWT rotation/RBAC are solid and production-quality. Missing: forgot-password/reset flow, email verification, self-registration (intentionally absent — candidates are invite-only).

**Dependencies:** Nothing upstream; everything else depends on this.

**Future improvements:** Move refresh token to an httpOnly cookie instead of JSON body/localStorage (currently exposed to XSS); register `JwtAuthGuard` globally instead of per-controller opt-in; add a stricter rate limit on `/auth/login` specifically (currently shares the global 100 req/min); add forgot-password.

---

## 2. Candidate Management

**Purpose:** Track candidates through the hiring pipeline from invite to hire/reject.

**Business value:** Single source of truth for "who is in the pipeline and where," replacing spreadsheets.

**User flow:** HR/Admin creates a candidate (name, email, role applied) → backend creates a `User` (role=CANDIDATE) + `Candidate` record in one transaction and emails a temp password → candidate logs in → HR/Admin/Manager can view, filter, search, and move candidates through statuses (`invited → active → submitted → evaluated → hired/rejected`) → Admin can soft-delete.

**Frontend:** `src/routes/admin/candidates.tsx`, `src/routes/hr/candidates.tsx`, `src/routes/hr/pipeline.tsx` (kanban), `src/routes/manager/candidates.tsx` (read-only view), `src/routes/candidate/index.tsx` (self view).

**Backend:** `CandidatesModule` (`src/candidates/`) — `CandidatesController` (9 routes under `/candidates`), `CandidatesService`, ownership-check helper (`assertOwnership`).

**Database:** `candidates` table (full_name, phone, role_applied, status, notes, is_deleted, indexed on status/role_applied/is_deleted/created_at), 1–1 to `users`.

**Status:** 🟡 80% — Partial. Full backend CRUD, pagination/search/filter, transactional creation + invite email, soft delete, status state machine with role restrictions all work. Missing: resume/document upload (no file upload endpoint exists anywhere in the backend). Known dead buttons: `hr/candidates.tsx` Export and "+ Invite candidate" have no `onClick` handler.

**Dependencies:** Authentication (creates a `User` row); Mail service (invite email); feeds Assessment Engine (a candidate is the anchor for an assessment, though the link is currently broken — see Assessment feature below).

**Future improvements:** Wire the two dead HR buttons; extract a shared `CandidateListView` component (the same ~450 lines of list logic are duplicated across admin/HR/manager); add resume upload if required by the product spec.

---

## 3. Question Bank

**Purpose:** Admin/Manager-authored library of MCQ and coding questions, reusable across assessments.

**Business value:** Lets non-engineers (or engineers) build up a question library without touching code.

**User flow (intended):** Admin/Manager creates MCQ or Coding questions (or bulk-imports via CSV) → questions are tagged by topic/role/difficulty → questions should feed the live candidate assessment engine.

**User flow (actual):** Admin/Manager creates/reads/deletes questions in `mcq_questions`/`coding_questions` tables. **These tables are never read by the live assessment engine**, which instead reads from a separate `questions` table. Nothing an admin creates in the Question Bank UI can ever reach a candidate.

**Frontend:** `src/routes/admin/questions.tsx` (list + delete wired to real API; create dialog has no submit handler).

**Backend:** `QuestionBankModule` (`src/question-bank/`) — `QuestionBankController` (13 routes under `/question-bank`), `McqQuestionService`, `CodingQuestionService`.

**Database:** `mcq_questions`, `coding_questions` — both entirely isolated tables with **zero relations** to any other entity in the schema (confirmed by full entity/migration inspection).

**Status:** 🔴 55% — Partial, but architecturally broken. CRUD, CSV bulk import, role/difficulty/status fields, and soft delete all work as isolated CRUD. The connection to the live assessment engine (the entire point of a "question bank") does not exist.

**Dependencies:** None upstream. Should feed the Assessment Engine but doesn't.

**Future improvements (P0):** Bridge or unify the two question data models — either make the live engine read from `mcq_questions`/`coding_questions`, or build an explicit publish/sync step from Question Bank into the `questions` table. Add a "Multiple Select" question type (`QuestionType` enum currently only has `MCQ`/`CODING`; `CreateMcqQuestionDto` hardcodes exactly 4 options). Add a "Typing" question type and move the 10 hardcoded typing passages into the DB. Wire the "Save question" create dialog.

---

## 4. Assessment Builder

**Purpose:** Let Admins compose a custom assessment (rounds, durations, question sets) instead of using one fixed structure.

**Business value:** Flexibility to tailor assessments per role without a developer.

**User flow:** UI presents sliders/sections for round configuration — **but nothing persists**. "Save draft" and "Publish" have no `onClick` handler at all.

**Frontend:** `src/routes/admin/builder.tsx` — a UI shell with local `useState`, no data wiring.

**Backend:** None. No endpoint exists to persist a builder-authored assessment structure.

**Database:** None. The `assessments` table has fixed round-duration columns (`mcqDuration`, `typingDuration`, `codingDuration` with hardcoded defaults 30/10/45 minutes) rather than a configurable structure.

**Status:** 🔴 15% — Not started (functionally). Front-end mock only; no persistence path exists end to end.

**Dependencies:** Should depend on Question Bank (to select questions) once both are built out.

**Future improvements:** Design and build a real save/publish flow that composes an assessment from Question Bank entries — this also requires fixing the Question Bank/assessment bridge first.

---

## 5. Assessment Engine — MCQ Round (Round 1)

**Purpose:** First-stage technical screening via multiple-choice questions, timed and server-scored.

**Business value:** Fast, objective, low-effort-to-administer first filter.

**User flow:** Candidate clicks "Start Assessment" → backend creates round state → candidate is served 15 shuffled MCQ questions (options also shuffled per-candidate) filtered by their `roleApplied` category → candidate answers within the time limit → submits → backend grades server-side and advances to Round 2.

**Frontend:** `src/routes/candidate/assessment.tsx` (MCQ section) + realtime timer via `src/lib/socket.ts`.

**Backend:** `AssessmentsModule` → `McqService` (`src/assessments/mcq.service.ts`), endpoints `GET /assessments/:id/mcq/questions`, `POST /assessments/:id/mcq/submit`.

**Database:** `mcq_answers` (assessment_id FK cascade, `question_id` — **no FK constraint**, selected_option, is_correct), `questions` (type=MCQ), `assessments.mcqScore`.

**Status:** 🔴 20% — Not started (broken) despite substantial backend code. **Critical bug:** `candidate/assessment.tsx` calls `assessmentApi.getMcqQuestions()`, which does not exist in `src/lib/api.ts` (only `questionBankApi.getMcqQuestions()` exists, a different endpoint). This throws immediately on round load. Submit payload shape (`{selectedOption}` cast `as any`) does not match the backend's `SubmitMcqDto` shape either.

**Dependencies:** Requires an `Assessment` row to exist for the candidate — see Bug #03 in [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md): `AssessmentsService.create()` is never called anywhere in the codebase, so no candidate ever has an assessment provisioned.

**Future improvements:** Add the missing `assessmentApi.getMcqQuestions(assessmentId)` method calling `GET /assessments/:id/mcq/questions`; fix the submit payload to match `SubmitMcqDto`; wire assessment provisioning into candidate creation/invite.

---

## 6. Assessment Engine — Typing Round (Round 2)

**Purpose:** Measure typing speed/accuracy as a secondary signal (relevant for roles needing fast, accurate text input).

**Business value:** Cheap, objective, hard-to-fake baseline metric.

**User flow:** Candidate is shown a passage → types it within the time limit → backend computes WPM, accuracy %, and mistake count server-side from the submitted text vs. the passage → advances to Round 3.

**Frontend:** `src/routes/candidate/assessment.tsx` (Typing section).

**Backend:** `TypingService` (`src/assessments/typing.service.ts`), endpoints `GET /assessments/:id/typing/passage`, `POST /assessments/:id/typing/submit`.

**Database:** `typing_results` (assessment_id unique FK cascade, passage, typed_text, wpm, accuracy, mistakes; note: an orphaned `word_count` column exists in the live table from an early migration but is not used by the entity).

**Status:** 🔴 20% — Not started (broken). **Critical bug:** `assessment.tsx` calls `assessmentApi.getTypingPassage()`, which does not exist in `src/lib/api.ts` — throws on load. Passages are 10 hardcoded strings in `typing.service.ts` (deterministically selected by hashing the assessment ID), not DB-backed or admin-editable.

**Dependencies:** Same as MCQ round — requires assessment provisioning to be fixed first.

**Future improvements:** Add the missing API client method; move passages into the database with an admin management UI (ties into the "Typing" question type gap in Question Bank).

---

## 7. Assessment Engine — Coding Round (Round 3)

**Purpose:** Real-world coding ability assessment with a Monaco-based editor.

**Business value:** The highest-signal round — actual code, reviewed by both AI and a human manager.

**User flow:** Candidate is served one coding question (filtered by role, or a random fallback) → writes code in a Monaco editor → code autosaves every 30 seconds (also reachable via the `code:autosave` WebSocket event) → candidate submits final code → assessment marked complete → an AI evaluation job is queued in the background → a manager later reviews the code and adds a manual score/feedback.

**Frontend:** `src/routes/candidate/assessment.tsx` (Coding section, Monaco editor), `src/routes/manager/reviews.tsx` (read-only Monaco viewer + scoring UI — the best-built page in the app).

**Backend:** `CodingService` (`src/assessments/coding.service.ts`), endpoints `GET /assessments/:id/coding/question`, `POST /assessments/:id/coding/autosave`, `POST /assessments/:id/coding/submit`, `POST /assessments/:id/coding/review`, `GET /assessments/:id/coding/submission`.

**Database:** `coding_submissions` (assessment_id unique FK cascade, question_id — entity relation exists but **no DB-level FK constraint**, code, language, manager_score/feedback, ai_score, ai_analysis jsonb).

**Status:** 🟡 45% — Partial, most functional of the three rounds. Real Monaco editor, autosave, submit mutation, manual manager scoring, and AI code analysis (raw text sent to OpenAI) all work. **Missing:** no code execution/sandbox of any kind (no Judge0, Docker runner, or test-case validation) — the "Run" button just prints a canned "testing disabled in live mode" string. Grading is 100% subjective (manager) + AI text analysis with no objective correctness signal.

**Dependencies:** Requires assessment provisioning; requires reaching Round 3 (blocked by Rounds 1–2 being broken today).

**Future improvements:** Integrate a sandboxed execution service if automated grading is required, or explicitly document AI+manual as the intended grading model (it may be the intended design — confirm with product owner).

---

## 8. Reports

**Purpose:** Aggregate a candidate's full assessment performance into a single reviewable report.

**Business value:** One screen for a hiring decision instead of piecing together three separate round results.

**User flow:** After an assessment completes, a `Report` row aggregates MCQ %, typing WPM/accuracy, coding scores, and total score → Admin/HR/Manager can list/filter reports, view detail, add feedback, toggle shortlist, and release the result to the candidate.

**Frontend:** `src/routes/admin/reports.tsx` (list + detail, full AI-eval display), `src/routes/candidate/results.tsx` (candidate's own view).

**Backend:** `ReportsModule` (`src/reports/`) — `ReportsController` (8 routes under `/reports`), `ReportsService`.

**Database:** `reports` (candidate_id/assessment_id both unique FK, mcq/typing/coding score columns, total_score indexed, is_shortlisted indexed, is_result_released), `feedbacks` (1–M from reports).

**Status:** 🟡 75% — Partial. `findAll`/feedback/shortlist-toggle/result-release all role-gated and working. **Bug:** `GET /reports/:id` calls `findByCandidateId(id, user)` internally — treating a report ID as a candidate ID — flagged by the original developer's own TODO comment in `reports.controller.ts`. Also, `candidate/results.tsx` crashes on a released report because it renders `<Progress>` without importing it.

**Dependencies:** Requires a completed `Assessment` to generate meaningful data (currently starved by the assessment-provisioning gap); requires AI Evaluation for the AI-analysis display section.

**Future improvements:** Implement a real `findById` lookup; fix the missing `Progress` import; derive the "Session Integrity" percentage from actual anti-cheat violation data instead of a hardcoded 100%.

---

## 9. Analytics

**Purpose:** Dashboard-level visibility into hiring funnel health for leadership and reviewers.

**Business value:** Answers "how is our pipeline doing" without manual spreadsheet work.

**User flow:** Dashboards fetch cached aggregate data (candidate counts, pass/fail ratio, score distribution, topic breakdowns, hiring trends, leaderboard) and render charts.

**Frontend:** `src/routes/admin/index.tsx`, `admin/analytics.tsx`, `hr/index.tsx`, `manager/index.tsx` — all wired to real APIs via `recharts`. `manager/analytics.tsx` is a `ComingSoon` stub.

**Backend:** `AnalyticsModule` (`src/analytics/`) — `AnalyticsController` (8 routes under `/analytics`), each wrapped in `@nestjs/cache-manager`'s `CacheInterceptor` with TTLs from 300s to 3600s. `/analytics/trends` is Admin-only; all others are open to all staff roles.

**Database:** Reads across `candidates`, `assessments`, `reports` (no dedicated analytics tables — computed on read, then cached in Redis).

**Status:** 🟡 55% — Partial. Backend is excellent (8 well-designed, cached, role-gated endpoints). The gap is entirely frontend: `manager/analytics.tsx` is an unbuilt stub even though the backend already fully supports it — described in the audit as "lowest-effort item" to close.

**Dependencies:** Data quality depends on the assessment engine actually producing completed assessments (currently limited).

**Future improvements:** Build the Manager Analytics page against the existing backend (no backend work needed).

---

## 10. AI Evaluation

**Purpose:** Automated, OpenAI-based second opinion on a candidate's coding submission.

**Business value:** Reduces manager review time; provides a consistent, structured evaluation (logic/readability/structure scores + summary + recommendation) alongside human judgment.

**User flow:** On coding submission, a background job is queued (BullMQ, deduped by job ID) → `CodingService.triggerAiAnalysis` sends the question + candidate code to OpenAI (`gpt-4.1-mini` per the assessment coding path; `OPENAI_MODEL` env var configurable elsewhere) → parses a structured JSON response → stores `aiScore`/`aiAnalysis` on the `coding_submissions` row → Admin/Manager can view it in Reports/Reviews and trigger a re-evaluation.

**Frontend:** Read-only display in `admin/reports.tsx` and `manager/reviews.tsx`; a working "Request AI re-evaluation" button (`aiEvaluationApi.retrigger`).

**Backend:** `AiEvaluationModule` (`src/ai-evaluation/`) — `AiEvaluationController` (3 routes under `/ai-evaluations`), `AiEvaluationService`, BullMQ processor with exponential backoff (3 attempts), Sentry capture on failure, a Prometheus histogram metric. `rawResponse`/`errorMessage` are stripped from client-facing responses.

**Database:** `ai_evaluations` (candidate_id/assessment_id both unique FK, status, strengths/weaknesses text[], jsonb analyses, overallScore, rawResponse).

**Status:** 🟡 40% — Partial, but this is **the single most production-ready module in the entire codebase** by engineering quality. It is rated low only because, given assessments are never created (see Assessment Engine above), this pipeline currently has nothing to evaluate in the live flow — built but unreachable.

**Dependencies:** Hard-blocked by the assessment-provisioning gap. Requires `OPENAI_API_KEY` to be configured.

**Future improvements:** Once assessment provisioning is fixed, this module needs little further work. Consider a standalone AI Evaluation page/route (currently only embedded inside Reports/Reviews).

---

## 11. Settings

**Purpose:** Platform configuration — branding, notification preferences, staff/user management, security settings.

**Business value:** Intended, not yet realized — currently zero backing.

**User flow:** UI shows a 4-tab shell (Admin) with switches/inputs — none persist. HR/Manager settings are `ComingSoon` stubs.

**Frontend:** `src/routes/admin/settings.tsx` (UI shell, only Save button on branding tab exists and is inert), `admin/users.tsx` (explicit placeholder — "no staff directory API wired yet"), `hr/settings.tsx` and `manager/settings.tsx` (`ComingSoon` stubs, which crash — see Bug #06 in [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md)).

**Backend:** None. No `SettingsModule`, no entity, no endpoints. `UsersModule` exists but has **no controller at all** — there is no `/users` REST API of any kind.

**Database:** None.

**Status:** 🔴 10% — Not started. Pure UI scaffolding with zero backing on both sides.

**Dependencies:** None functional today.

**Future improvements:** Scope what "Settings" actually needs to cover (branding? notification prefs? role/permission management?) before building anything. Build a real `UsersController` + admin staff-management API/UI — this is a concrete, well-defined first step.

---

## 12. Notifications

**Purpose:** Keep staff and candidates informed of pipeline/assessment events.

**Business value:** Reduces the need to manually check dashboards for status changes.

**User flow (implemented):** WebSocket events fire on candidate status change, round advancement, forced submission, and anti-cheat violations (forwarded live to an `hr-room` of connected HR/Admin users). One transactional email — invite with temp password — sends via SMTP with a graceful no-op if unconfigured.

**Frontend:** No in-app notification center (bell icon, list, etc.) exists anywhere in `src/`. Socket events are consumed inline by the pages that need them (e.g., the candidate assessment page listens for `round:advanced`, `assessment:forcesubmit`).

**Backend:** `MailModule` (`src/mail/`) for email; `AssessmentGateway` (`src/gateway/`) for realtime events — see [`03_SYSTEM_ARCHITECTURE.md`](./03_SYSTEM_ARCHITECTURE.md) for the full event list.

**Database:** No notification-log table exists.

**Status:** 🔴 20% — Not started as a user-facing feature, though the underlying transport (WebSocket + SMTP) is real and working.

**Dependencies:** SMTP env vars (`SMTP_HOST/PORT/USER/PASS`) must be configured or invite emails silently no-op.

**Future improvements:** Decide if "Notifications" means in-app, email, or both. Build missing templates (results-released, password-reset, reminder). Add a forced-password-change flag on `User` — currently a temp password is emailed in plaintext with no forced-change-on-first-login mechanism. Build an in-app notification center consuming the existing socket events.

---

## Feature Status Summary

| Feature | Status | Completion |
|---|---|---|
| Authentication | 🟡 Partial | 90% |
| Candidate Management | 🟡 Partial | 80% |
| Question Bank | 🔴 Partial (broken bridge) | 55% |
| Assessment Builder | 🔴 Not started | 15% |
| MCQ Round | 🔴 Not started (broken) | 20% |
| Typing Round | 🔴 Not started (broken) | 20% |
| Coding Round | 🟡 Partial | 45% |
| Reports | 🟡 Partial | 75% |
| Analytics | 🟡 Partial | 55% |
| AI Evaluation | 🟡 Partial (unreachable) | 40% |
| Settings | 🔴 Not started | 10% |
| Notifications | 🔴 Not started | 20% |

See [`11_CURRENT_STATUS.md`](./11_CURRENT_STATUS.md) for module-by-module bug lists and technical debt, and [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) for the full bug registry.
