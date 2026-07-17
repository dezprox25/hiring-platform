# 15 — Changelog

## Versioning Note

This repository does not currently follow formal semantic versioning. The backend `package.json` (`dezprox-backend`) is pinned at `"version": "1.0.0"` as a placeholder; the frontend `package.json` (`project1`) has no version field at all. Git history is a single "Initial commit" (`5a057a9`) with the entire working tree otherwise uncommitted as of this documentation pass (2026-07-17). **There is no prior tagged release to diff against** — the entries below are reconstructed from the codebase's current state and the migration timeline, not from git log or release tags.

**Recommendation:** adopt semver starting now. Tag the commit that fixes the Sprint 1 blockers (see [`12_ROADMAP.md`](./12_ROADMAP.md)) as `v0.2.0` ("assessment engine functional"), and treat the current uncommitted state as pre-`v0.1.0`.

## [Unreleased] — Current Working Tree (as of 2026-07-17)

### Implemented
- Full JWT authentication (login/refresh/logout) with RBAC across 4 roles
- Candidate CRUD, invite email, status pipeline, soft delete
- 3-round assessment engine backend (MCQ/Typing/Coding services, server-side timing, Socket.IO realtime updates, anti-cheat event forwarding)
- Question Bank CRUD (MCQ + Coding) with CSV bulk import — **not yet connected to the live assessment engine**
- Reports aggregation, shortlist toggle, result release, manager feedback
- Analytics: 8 cached dashboard/chart backend endpoints; Admin/HR frontend wired
- AI Evaluation: OpenAI-based coding-submission review via BullMQ, with retry/backoff and re-trigger capability
- Manager review UI (Monaco read-only viewer, scoring, feedback) — most complete page in the app
- Docker Compose deployment (Postgres, Redis, backend, worker, frontend/Nginx)
- CI pipeline (lint, build, unit/e2e tests, Docker image validation) — no deploy stage
- Observability: Sentry, Pino structured logging with secret redaction, Prometheus `/metrics`, `/health` endpoints, Bull-Board queue dashboard

### Known Broken (see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) for full detail)
- Candidate MCQ and Typing rounds crash on load (missing frontend API client methods)
- No `Assessment` row is ever created for a candidate (`AssessmentsService.create()` is dead code)
- Question Bank writes to tables the live assessment engine never reads
- `candidate/results.tsx` crashes on a released report (missing import)
- 5 routes crash via a broken `ComingSoon` placeholder component
- `GET /reports/:id` uses the wrong lookup method
- `feedbacks` table has a migration/entity schema drift

### Pending (Not Yet Started)
- Assessment Builder persistence (UI exists, no backend, no save/publish wiring)
- Admin/staff user management (`UsersModule` has no controller)
- Settings backend (no module exists for any of the 4 UI tabs)
- In-app notification center
- Forgot-password / password-reset flow
- Resume/document upload
- Code execution sandbox for the coding round
- Manager Analytics page (backend ready, frontend stub)
- Multiple-select and Typing question types in the Question Bank

## Migration History (Database Schema Timeline)

Reconstructed from `dezprox-backend/src/database/migrations/` timestamps — this is the closest thing to a schema changelog that exists:

| Migration | Change |
|---|---|
| `1700000001` | Create `users` |
| `1700000002` | Create `candidates` |
| `1700000003` | Create `assessments` |
| `1700000004` | Create `mcq_answers` |
| `1700000005` | Create `typing_results` |
| `1700000006` | Create `coding_submissions` |
| `1700000007` | Create `reports` |
| `1700000008` | Create `feedbacks` — now stale vs. the current entity, see [`04_DATABASE.md`](./04_DATABASE.md) |
| `1700000009` | Create `ai_evaluations` |
| `1700000010` | Create `question_bank_questions` — later abandoned, orphaned table |
| `1700000011` | Reshape `ai_evaluations` to its current form (`FixAiEvaluations`) |
| `1700000012` | Rename/add columns on `coding_submissions`/`typing_results`; create `mcq_questions`, `coding_questions`, `questions` (`FixEverythingElse`) — irreversible |

## Future Versions (Planned)

| Version | Scope | Maps to |
|---|---|---|
| `v0.2.0` | Sprint 1 complete — assessment engine functional end to end | [`12_ROADMAP.md`](./12_ROADMAP.md) Sprint 1 |
| `v0.3.0` | Sprint 2 complete — assessment experience feature-complete | Sprint 2 |
| `v0.4.0` | Sprint 3 complete — Admin/HR/Manager portals feature-complete | Sprint 3 |
| `v1.0.0` | Sprint 4 complete — hardened, production-ready | Sprint 4 |

## Related Documents

- [`12_ROADMAP.md`](./12_ROADMAP.md) — what each future version actually contains
- [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) — full bug detail behind "Known Broken" above
