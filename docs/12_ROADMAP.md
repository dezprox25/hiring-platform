# 12 — Roadmap

Sequenced so each phase unblocks the next. Sprint 1 is the only phase that must happen before any candidate can use the product at all.

## Current Phase — Sprint 1: Unblock the Core Product

**Goal:** a candidate can complete a full assessment (MCQ → Typing → Coding) end to end without crashing.
**Difficulty:** High. **Estimate:** ~2 weeks for one senior full-stack developer.

| # | Task | Priority |
|---|---|---|
| 1 | Wire `AssessmentsService.create()` into the candidate creation/invite flow (transactional — needs care, touches `CandidatesService`) | 🔴 Critical |
| 2 | Decide and implement the Question Bank ↔ live assessment bridge — the architectural centerpiece of this sprint | 🔴 Critical |
| 3 | Add missing frontend API methods `getMcqQuestions`/`getTypingPassage` to `assessmentApi` in `src/lib/api.ts`; align the MCQ submit payload with `SubmitMcqDto` | 🔴 Critical |
| 4 | Fix `candidate/results.tsx` missing `Progress` import | 🔴 Critical |
| 5 | Fix `ComingSoon`'s `react-router-dom` `<Link>` crash (swap for TanStack Router's `<Link>`) — unblocks 5 routes | 🔴 Critical |
| 6 | Write a fixing migration for the `feedbacks` table drift (found during this documentation pass) | 🔴 Critical |

## Next Phase — Sprint 2: Complete the Assessment Experience

**Goal:** the assessment is not just functional but complete against the intended feature set.
**Difficulty:** Medium–High. **Estimate:** ~2 weeks.

| # | Task | Priority |
|---|---|---|
| 1 | Move typing passages into the database with an admin management UI | High |
| 2 | Add a Multiple-Select question type end to end (schema, DTO, UI) | High |
| 3 | Integrate a code execution sandbox for the coding round, or formally scope it out as AI+manual-only | High |
| 4 | Fix `GET /reports/:id` (currently calls `findByCandidateId`) | High |
| 5 | Add the missing FK constraint on `mcq_answers.question_id` and `coding_submissions.question_id`/`questions.created_by_id` | Medium |

## Future Phase — Sprint 3: Admin / HR / Manager Completeness

**Goal:** every role dashboard is fully functional, no dead buttons, no crashing stubs.
**Difficulty:** Medium. **Estimate:** ~2–3 weeks.

| # | Task | Priority |
|---|---|---|
| 1 | Build `UsersController` + admin staff-management UI | High |
| 2 | Wire Assessment Builder save/publish end to end (depends on Sprint 1 #2) | Medium |
| 3 | Wire HR export/invite buttons | Medium |
| 4 | Scope and build Admin Settings persistence | Medium |
| 5 | Build Manager Analytics page (backend already ready — lowest-effort item this sprint) | Medium |
| 6 | Scope and build HR interview scheduling | Low-Medium |

## Future Phase — Sprint 4: Hardening & Production Readiness

**Goal:** the platform is genuinely safe and observable for real hiring decisions.
**Difficulty:** Medium. **Estimate:** ~2 weeks.

| # | Task | Priority |
|---|---|---|
| 1 | Forgot-password flow, forced password change on first login, results-released/reminder email templates | High |
| 2 | Move refresh token to httpOnly cookie (or document the tradeoff); add stricter login throttling; register `JwtAuthGuard` globally | Medium |
| 3 | Add a working ESLint flat config to both projects; re-enable and fix the skipped Playwright specs (rewrite the assessment spec against the real route/URL scheme) | Medium |
| 4 | Build the in-app notification center | Low-Medium |
| 5 | Code-split Monaco Editor and route bundles | Low |
| 6 | Bump bcrypt cost factor 10 → 12 | Low |
| 7 | Reconcile root-level docs (`SECURITY_GUIDE.md`, `ENV_GUIDE.md`, etc.) with actual implementation, or replace them with this `/docs` set | Low |

## Future Enhancements (Beyond MVP — Not Yet Prioritized Into a Sprint)

| Enhancement | Notes |
|---|---|
| Resume/document upload | No file-upload endpoint exists anywhere; needs storage decision (S3-compatible, local disk, etc.) |
| Email verification | Currently absent — evaluate against the invite-only model before building |
| Standalone AI Evaluation page | Currently only embedded inside Reports/Reviews |
| CI/CD deploy stage | Current pipeline is CI-only (build/test/validate), no automated deployment |
| Read replicas / partitioning | Not needed at current scale per the DB review; revisit only if candidate volume grows an order of magnitude |
| Multi-tenant support | Not currently a requirement (single internal org) — flag if product direction changes |

## Priority Legend

| Priority | Meaning |
|---|---|
| 🔴 Critical | Blocks the core product from functioning at all |
| High | Blocks a whole feature area or represents real risk (security, data integrity) |
| Medium | Improves completeness/quality but doesn't block core usage |
| Low | Polish, tech debt, or nice-to-have |

## Related Documents

- [`11_CURRENT_STATUS.md`](./11_CURRENT_STATUS.md) — what's true today, module by module
- [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) — the exact bugs this roadmap resolves
- [`16_HANDOVER_GUIDE.md`](./16_HANDOVER_GUIDE.md) — Day 1 / Week 1 breakdown of Sprint 1
- [`FINAL_PROJECT_SUMMARY.md`](./FINAL_PROJECT_SUMMARY.md) — executive-level recommendation
