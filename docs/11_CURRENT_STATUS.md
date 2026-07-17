# 11 — Current Status

Source: code-verified technical audit (2026-07-09) cross-checked against direct code inspection during this documentation pass (2026-07-17). No commits exist between those dates (this repository has a single "Initial commit" with everything else uncommitted), so these findings reflect the current working tree.

**Overall completion: 58%.** The backend and database are mature, production-grade engineering. The frontend's core product journey — a candidate actually taking an assessment — is broken end to end by a chain of three independent defects across three layers. See [`16_HANDOVER_GUIDE.md`](./16_HANDOVER_GUIDE.md) for the fix path.

| Area | Completion | One-line summary |
|---|---|---|
| Frontend | 55% | Strong stack/data layer; core candidate flow crashes; several dead-button screens |
| Backend | 68% | Mature engineering; docked for the assessment-provisioning gap and missing Users controller |
| Database | 65% | Clean schema/indexing; docked for the orphaned Question Bank relationship and `feedbacks` drift |
| Authentication | 90% | Login/JWT rotation/RBAC solid; no forgot-password or self-registration |
| Assessment (core flow) | 30% | Extensive code on both ends; non-functional as an end-to-end journey |
| Analytics | 55% | Backend excellent; Manager portal has no page |
| AI Evaluation | 40% | Most mature backend module; currently has nothing to evaluate in the live flow |

---

## Module-by-Module Status

### Authentication — 🟡 90%

**Completed:** Login, JWT access(15m)/refresh(7d) rotation, refresh tokens bcrypt-hashed before storage, RBAC via `RolesGuard`+`@Roles()`, `@Public()` opt-out, global rate limiting, dev-only demo logins.
**Partial/Missing:** Forgot-password/reset (no endpoint, no UI), email verification, self-registration (intentional — candidates are invite-only, confirm this is the desired product decision).
**Known bugs:** none crash-level; see security notes below.
**Technical debt:** Refresh token in JSON body (likely `localStorage`) — XSS exposure; `JwtAuthGuard` opt-in per controller, not global; no stricter throttle on `/auth/login`.
**Priority:** High (forgot-password is a real operational gap before any real launch).

### Dashboards (Admin/HR/Manager/Candidate) — 🟡 75%

**Completed:** All four dashboards wired to real APIs via TanStack Query; loading/error/empty states present; candidate dashboard polls while an assessment is active.
**Partial/Missing:** Nothing structurally missing, but data is starved by the assessment-provisioning gap.
**Known bugs:** none.
**Technical debt:** Identical query/fetch logic duplicated across all four dashboard files — no shared hook.
**Priority:** Medium (extract `useDashboardData(role)`).

### Candidate Management — 🟡 80%

**Completed:** Full backend CRUD, pagination/search/filter, transactional creation + invite email, ownership checks, soft delete, status state machine with role restrictions.
**Missing:** Resume/document upload (no file-upload endpoint anywhere in the backend).
**Known bugs:** `hr/candidates.tsx` Export and "+ Invite candidate" buttons have no `onClick`.
**Technical debt:** ~450 lines of near-duplicate candidate-list implementation across admin/HR/manager routes.
**Priority:** Medium.

### Assessment Builder — 🔴 15%

**Completed:** `admin/builder.tsx` UI shell with local `useState` sections.
**Missing:** "Save draft"/"Publish" have no `onClick` at all; no backend endpoint to persist a builder-authored structure.
**Known bugs:** entirely a frontend mock — no persistence path exists end to end.
**Priority:** Low until the Question Bank bridge (below) is fixed — building persistence on top of a broken question model would compound the debt.

### Question Bank — 🔴 55% (architecturally broken)

**Completed:** MCQ + Coding CRUD, CSV bulk import, role/difficulty/status fields, soft delete.
**Missing:** "Multiple Select" question type doesn't exist; `CreateMcqQuestionDto` hardcodes exactly 4 options; "Typing" question type doesn't exist (passages are 10 hardcoded strings); "Save question" create dialog has no handler.
**Known bugs (Critical):** `mcq_questions`/`coding_questions` tables are completely disconnected from the `questions` table the live assessment engine reads. Nothing an admin creates here can ever reach a candidate.
**Priority:** 🔴 **P0 — the single highest-value architectural fix in the codebase.**

### MCQ Assessment (Round 1) — 🔴 20% (broken)

**Completed:** Server-side round/timer state machine; `MCQRound` UI component with submit mutation.
**Known bugs (Critical):** `candidate/assessment.tsx` calls `assessmentApi.getMcqQuestions()`, undefined in `src/lib/api.ts` — throws on every load. Submit payload shape mismatch vs. backend DTO.
**Blocked by:** no `Assessment` row exists for any candidate (see Assessment Engine below).
**Priority:** 🔴 P0.

### Typing Test (Round 2) — 🔴 20% (broken)

**Completed:** Backend computes WPM/accuracy/mistakes server-side; `TypingResult` entity stores results.
**Missing:** Passages not manageable via any admin UI; no "Typing" `QuestionType`.
**Known bugs (Critical):** `assessment.tsx` calls `assessmentApi.getTypingPassage()`, undefined — throws on load. Passages hardcoded (10 fixed strings).
**Priority:** 🔴 P0.

### Coding Assessment (Round 3) — 🟡 45%

**Completed:** Real Monaco editor, autosave every 30s, submit mutation, manager manual scoring/feedback, AI reads raw code text.
**Missing:** No code execution/sandbox of any kind.
**Known bugs:** "Run" button prints a canned "testing disabled" string; grading is 100% subjective (manager) + AI text analysis, no objective correctness signal.
**Priority:** Medium — decide and document whether AI+manual grading is the intended design, or scope a sandbox.

### Candidate Portal (overall) — 🔴 35% (broken)

**Completed:** Dashboard with status polling; coding-round UI; anti-cheat visibility/blur listeners emitting socket events; realtime timer/round-advance socket wiring.
**Missing:** Working MCQ/Typing rounds; a functioning profile page.
**Known bugs (Critical):** `candidate/results.tsx` renders `<Progress>` without importing it — crashes on a released report. "Session Integrity 100%" is hardcoded, not derived from real anti-cheat data.
**Priority:** 🔴 **Highest-priority area in the app.**

### Reports — 🟡 75%

**Completed:** `findAll`/feedback/shortlist-toggle/result-release, all role-gated; `admin/reports.tsx` list+detail with full AI-eval display.
**Missing:** Dedicated `findById` implementation.
**Known bugs:** `GET /reports/:id` calls `findByCandidateId(id, user)` — treats a report ID as a candidate ID (flagged by the original developer's own TODO comment). Additionally (found during this documentation pass): the `feedbacks` table has migration/entity drift — `POST /reports/:id/feedback` may fail against a migration-built database (see [`04_DATABASE.md`](./04_DATABASE.md)).
**Priority:** High.

### Analytics — 🟡 55%

**Completed:** 8 cached backend endpoints, sensible TTLs, role-gated; Admin dashboard/reports use real `recharts` data.
**Missing:** `manager/analytics.tsx` is a `ComingSoon` stub — no page built against an already-solid backend.
**Known bugs:** the stub itself crashes on render (see `ComingSoon` router bug, [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md)).
**Priority:** Medium — lowest-effort high-value item (backend needs no work).

### AI Evaluation — 🟡 40%

**Completed:** Real OpenAI integration, BullMQ queue with job de-dupe, exponential backoff retry (3x), Sentry capture, metrics histogram; strips sensitive fields from client responses; working "Request AI re-evaluation" UI.
**Missing:** No standalone AI Evaluation page/route.
**Known bugs:** given assessments are never created, this pipeline currently has nothing to evaluate in the live flow — built but unreachable.
**Priority:** Low (once assessment provisioning is fixed, this module needs little further work — it is the most production-ready feature in the app).

### Settings — 🔴 10%

**Completed:** `admin/settings.tsx` 4-tab UI shell.
**Missing:** No backend settings module/entity of any kind; all controls uncontrolled/inert except one inert Save button; HR/Manager settings are broken `ComingSoon` stubs; no admin user/staff management API (`UsersModule` has no controller at all).
**Priority:** Low until scoped — pure UI scaffolding with zero backing on both sides; needs a product decision before engineering work starts.

### Notifications — 🔴 20%

**Completed:** WebSocket events exist and work (`candidate:statusUpdated`, `round:advanced`, `assessment:forcesubmit`, `anticheat:violation`); one transactional email (invite) with graceful SMTP no-op.
**Missing:** No in-app notification center anywhere in `src/`; no results-released/password-reset/reminder emails.
**Known issues:** temp password emailed in plaintext with no forced-change-on-first-login flag.
**Priority:** Low-Medium — decide scope (in-app vs. email vs. both) before building.

---

## Cross-Cutting Technical Debt

| Item | Detail |
|---|---|
| Two parallel "question" data models | Needs an actual architectural decision — merge or explicit sync step — not a patch |
| `feedbacks` table migration/entity drift | Found during this documentation pass — write a fixing migration before this endpoint is exercised (see [`04_DATABASE.md`](./04_DATABASE.md)) |
| Reactive migration naming (`FixAiEvaluations`, `FixEverythingElse`) | Signal after-the-fact patches; the last one has a fully empty, irreversible `down()` |
| No shared frontend data-fetching hook layer | Candidate-list view alone duplicated 3× (~450 lines); will compound as more pages are added |
| Auth guard opt-in, not default-secure | `JwtAuthGuard` has been added correctly everywhere so far, but has no safety net for the next controller |
| No code-splitting anywhere in the frontend | Monaco Editor (multi-MB) is statically imported in two places unconditionally |
| Lint not actually enforceable as committed | ESLint 9 pinned in both projects, no flat config exists in either |
| E2E coverage is largely aspirational | 6 of 8 Playwright specs are `test.skip()`'d; the one assessment spec that isn't skipped targets a URL scheme that doesn't match the real implementation |
| Documentation drift | Several root-level guides (`SECURITY_GUIDE.md`, `ENV_GUIDE.md`, `INFRASTRUCTURE.md`, `STARTUP_GUIDE.md`) contain claims that don't match the code — see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) for the specific discrepancies found |

## Related Documents

- [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) — every bug with file:line references
- [`12_ROADMAP.md`](./12_ROADMAP.md) — sprint plan to close these gaps
- [`16_HANDOVER_GUIDE.md`](./16_HANDOVER_GUIDE.md) — what to do first
