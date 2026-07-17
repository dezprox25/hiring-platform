# 06 — Frontend

Root: `src/` (Vite project root is the repo root itself, `E:\produts\Hireing application\project1`).

## Project Structure

```
src/
├── routes/            # TanStack Router file-based pages (see Pages below)
├── components/         # app-specific components (4 files) + ui/ (46 shadcn primitives)
├── hooks/               # 1 hook (unused)
├── lib/                 # api client, socket client, auth helpers, utils
├── types/               # shared TS interfaces
├── styles.css            # Tailwind v4 CSS-first theme config
├── router.tsx             # router bootstrap (getRouter())
├── routeTree.gen.ts        # AUTO-GENERATED — do not hand-edit
└── main.tsx                 # app entry (QueryClientProvider, Sentry init, RouterProvider)
```

Dead/orphaned files present in the tree but **not part of the live app** (see [Dead Code](#dead-code)):
`src/App.tsx`, `src/server.ts`, `src/start.ts`, `src/lib/error-capture.ts`, `src/lib/error-page.ts`.

## Routing

TanStack Router 1.100, file-based. Every `.tsx` under `src/routes/` is auto-registered into `src/routeTree.gen.ts` by the `@tanstack/router-vite-plugin` at build/dev time — **you never edit route registration by hand**, you just add a file.

`src/routes/__root.tsx` is the layout root: sets `<head>` meta/OG tags, mounts the global 404 and error boundary, wraps everything in `QueryClientProvider`, and runs a `beforeLoad` auth guard:
- Unauthenticated users hitting `/admin/*`, `/hr/*`, `/manager/*`, `/candidate/*` → redirected to `/login`.
- Authenticated users hitting `/login` → redirected to `/{role}` (their dashboard root).

## Pages (Route Files)

| Route | Purpose | Backend calls | Status |
|---|---|---|---|
| `routes/index.tsx` | Public landing page | none (static) | ✅ Complete |
| `routes/login.tsx` | Login form + dev demo-account shortcuts | `authApi.login` | ✅ Complete |
| `routes/admin/index.tsx` | Admin dashboard: stats, charts, leaderboard | `analyticsApi.getDashboardData`, `candidatesApi.findAll`, `reportsApi.findAll` | ✅ Complete |
| `routes/admin/analytics.tsx` | Funnel, skill radar, heatmap | `analyticsApi.getDashboardData` (heatmap is simulated data) | ✅ Complete |
| `routes/admin/assessments.tsx` | Assessment list cards | none — hardcoded mock array | 🔴 Stub |
| `routes/admin/builder.tsx` | Assessment builder UI | none — local state only | 🔴 Stub (UI-only) |
| `routes/admin/candidates.tsx` | Candidate table, invite, CSV export | `candidatesApi.findAll`, `.create` | ✅ Complete |
| `routes/admin/questions.tsx` | Question Bank list (MCQ+Coding), delete | `questionBankApi.getMcqQuestions/.getCodingQuestions/.deleteMcq/.deleteCoding` | 🟡 Read/delete work; create dialog has no submit handler |
| `routes/admin/reports.tsx` | Reports list + detail with AI eval | `reportsApi.findAll`, `.findById` | ✅ Complete |
| `routes/admin/settings.tsx` | Branding/theme/notifications/security tabs | none — static, no save API | 🔴 Stub |
| `routes/admin/users.tsx` | Staff directory | none — explicit "not wired yet" placeholder | 🔴 Stub |
| `routes/hr/index.tsx` | HR dashboard: pipeline, funnel, pending evals | `analyticsApi.getDashboardData`, `candidatesApi.findAll`, `reportsApi.findAll` | ✅ Complete |
| `routes/hr/candidates.tsx` | Candidate table + detail sheet | `candidatesApi.findAll` | 🟡 Export & Invite buttons have no handler |
| `routes/hr/interviews.tsx` | — | none | 🔴 `<ComingSoon>` stub — **crashes on render** |
| `routes/hr/pipeline.tsx` | Kanban pipeline by status | `candidatesApi.findAll` | ✅ Complete |
| `routes/hr/settings.tsx` | — | none | 🔴 `<ComingSoon>` stub — **crashes on render** |
| `routes/manager/index.tsx` | Manager dashboard: review queue, funnel | `analyticsApi.getDashboardData`, `reportsApi.findAll` (×2) | ✅ Complete |
| `routes/manager/candidates.tsx` | Candidate read view + detail sheet | `candidatesApi.findAll` | ✅ Complete |
| `routes/manager/analytics.tsx` | — | none | 🔴 `<ComingSoon>` stub — **crashes on render** |
| `routes/manager/reviews.tsx` | Review queue + detail, Monaco viewer, scoring | `reportsApi.findAll/.findById`, `assessmentApi.getCodingSubmission/.submitManagerReview`, `reportsApi.addFeedback`, `aiEvaluationApi.retrigger` | ✅ **Best-built page in the app** |
| `routes/manager/settings.tsx` | — | none | 🔴 `<ComingSoon>` stub — **crashes on render** |
| `routes/candidate/index.tsx` | Candidate dashboard, status polling | `candidatesApi.findMe`, `reportsApi.findMyReport` | ✅ Complete |
| `routes/candidate/assessment.tsx` | 3-round live assessment (MCQ/Typing/Coding) + Socket.IO + anti-cheat | 9 `assessmentApi` methods, 2 of which don't exist (see below) | 🔴 **Broken** |
| `routes/candidate/profile.tsx` | — | none | 🔴 `<ComingSoon>` stub — **crashes on render** |
| `routes/candidate/results.tsx` | Results/score breakdown, AI eval | `reportsApi.findMyReport` | 🔴 Crashes on a released report (missing `Progress` import) |

**The core bug in `candidate/assessment.tsx`:** it calls `assessmentApi.getMcqQuestions(assessmentId)` and `assessmentApi.getTypingPassage(assessmentId)` — neither exists on the `assessmentApi` export in `src/lib/api.ts` (a differently-scoped `questionBankApi.getMcqQuestions()` exists, but it hits a different endpoint entirely). Both rounds throw `TypeError: ... is not a function` on load. There is also a payload-shape mismatch: the component posts `{ answers: [...] }` while `assessmentApi.saveMcqAnswer` is declared with signature `{ questionId, optionIndex }`. See [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md).

**`<ComingSoon>` crash:** `src/components/coming-soon.tsx` uses `react-router-dom`'s `<Link>`, but the app only mounts TanStack Router's `<RouterProvider>` — there is no `react-router-dom` `<Router>` anywhere in the tree, so any page rendering `<ComingSoon>` throws. This affects 5 routes: `hr/interviews`, `hr/settings`, `manager/analytics`, `manager/settings`, `candidate/profile`.

## Layouts

`src/components/dashboard-layout.tsx` — the shared shell for every role-scoped page: role-aware `AppSidebar` navigation, `ThemeToggle`, header with search and logout. Exports the `Role` type (`'admin' | 'hr' | 'manager' | 'candidate'`) consumed across the app.

## Components

### App-specific (`src/components/*.tsx`, 4 files)

| File | Purpose |
|---|---|
| `dashboard-layout.tsx` | Sidebar + header shell for all authenticated pages |
| `coming-soon.tsx` | Placeholder shown by unbuilt stub routes — **currently broken**, see above |
| `error-boundary.tsx` | `GlobalErrorBoundary` — Sentry reporting in prod, reload/retry UI |
| `stat-card.tsx` | Reusable animated (framer-motion) KPI tile used across dashboards |

### UI primitives (`src/components/ui/`, 46 files)

shadcn/ui, "new-york" style (`components.json`: `baseColor: slate`, `iconLibrary: lucide`). Includes: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip. These are not customized beyond shadcn defaults — treat them as vendored, regenerate via the shadcn CLI rather than hand-patching if an upgrade is needed.

## Hooks

`src/hooks/use-mobile.tsx` — `useIsMobile()`, a 768px `matchMedia` breakpoint detector. **This is the only custom hook in the entire frontend, and it is not imported anywhere** (confirmed via repo-wide grep, including inside `ui/sidebar.tsx`, the typical shadcn consumer of a mobile hook). Dead code.

There is **no shared data-fetching hook layer** — every page inlines its own `useQuery`/`useMutation` calls directly. This is a documented duplication problem (see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md)); a `useDashboardData(role)` hook and a shared `CandidateListView` component are the two highest-value extractions.

## Utilities & Services (`src/lib/`)

| File | Purpose |
|---|---|
| `api.ts` | Axios client + every typed API object (see below) |
| `api-base.ts` | `getHttpApiBaseUrl()` — `VITE_API_URL` in prod, empty string in dev (Vite proxy), hardcoded `http://localhost:4000` fallback |
| `auth-user.ts` | `getStoredAuthUser()`, `getAuthDisplayName()` — reads `localStorage["user"]`, has per-role fallback display names |
| `socket.ts` | `SocketService` singleton — connects to `${apiBase}/assessment` with JWT in `auth.token`; only consumed by `candidate/assessment.tsx` |
| `export-csv.ts` | `downloadCsv(filename, headers, rows)` — client-side CSV blob builder |
| `utils.ts` | `cn()` — clsx + tailwind-merge class helper |
| `error-capture.ts`, `error-page.ts` | Only consumed by the dead `server.ts`/`start.ts` — effectively dead code themselves |

### `src/lib/api.ts` — Full API Client Inventory

Axios instance with `baseURL` from `getHttpApiBaseUrl()`. Request interceptor injects the bearer token (skips `/auth/login`). Response interceptor: silent refresh-and-retry on `401`; global toast on `403`/`500`/network error. `unwrapData()` strips the `{data, status}` envelope.

```
authApi:          login, refresh, logout
candidatesApi:     findAll, findOne, findMe, create, update, updateStatus, resendInvite, delete
analyticsApi:      getDashboardData, getDashboardStats, getRadarData, getTopicBreakdown,
                   getPassFailRatio, getHiringTrends, getLeaderboard, getScoreDistribution
reportsApi:        findAll, findById, findMyReport, releaseResult, toggleShortlist,
                   addFeedback, getFeedback
questionBankApi:   getMcqQuestions, getCodingQuestions, getMcqById, getCodingById,
                   createMcq, createCoding, updateMcq, updateCoding, deleteMcq, deleteCoding
assessmentApi:     getAssessment, getAssessmentStatus, startAssessment, saveMcqAnswer,
                   saveTypingResult, saveCodingAutosave, submitCoding, submitAssessment,
                   getCodingQuestion, getCodingSubmission, submitManagerReview
                   -- MISSING but called from UI: getMcqQuestions, getTypingPassage
aiEvaluationApi:   retrigger, getByCandidate, getStatus
```

Full method→endpoint mapping is in [`05_API_REFERENCE.md`](./05_API_REFERENCE.md).

## `src/types/api.ts`

Defines: `AiEvaluation`, `ReportDetailResponse`, `DashboardStats`, `TrendPoint`, `PieSlice`, `ChartPoint`, `FunnelStage`, `LeaderboardEntry`, `TopicPerformancePoint`, `AnalyticsDashboardPayload`, `AIRecommendationLabel` (`"Strong Hire" | "Hire" | "Maybe" | "No Hire"`). Most pages use these for dashboards/reports; several other pages use inline/`any` types instead — not fully consistent.

## Styling

Tailwind CSS v4, **CSS-first config** — there is no `tailwind.config.js`. All theme tokens (OKLCH color scale for background/foreground/primary/success/warning/info/destructive/chart-1..5/sidebar-*) live in `src/styles.css` under an `@theme inline` block, imported via `@import "tailwindcss" source(none)` + `@source "../src"` + `tw-animate-css`. Custom utility classes: `.glass`, `.grid-bg`, `.shadow-elegant`, `.shadow-soft`, `.gradient-text`, plus fade/slide keyframe animations.

**Dark mode:** toggled by adding/removing a `.dark` class on `<html>` via `ThemeToggle` in `dashboard-layout.tsx`. **Not persisted** — resets to system/light on every reload since it only reads the current DOM class, not `localStorage` or `prefers-color-scheme`.

## State Management

**No global state library** (no Redux, no Zustand). Every `createContext`/`useContext` found in the codebase is internal to shadcn/Radix primitives (`carousel.tsx`, `chart.tsx`, `form.tsx`, `sidebar.tsx`, `toggle-group.tsx`, `input-otp.tsx`) — not app-level state.

- **Server state:** TanStack Query, per-page `useQuery`/`useMutation`.
- **Auth state:** `localStorage` (`accessToken`, `refreshToken`, `user`), read via `src/lib/auth-user.ts`.
- **UI state:** local `useState` per component.

## Tech Stack Versions

React 19.2.6, React DOM 19.2.6, TypeScript 5.9.3, Vite 7.3.3, `@tanstack/react-router` ^1.100.0, `@tanstack/react-query` ^5.100.10, Tailwind CSS ^4.3.0, `@monaco-editor/react` ^4.7.0, `socket.io-client` ^4.8.3, `react-hook-form` ^7.75.0 + `@hookform/resolvers` + `zod` ^3.25.76, `recharts` ^2.15.4, `framer-motion` ^12.38.0, `axios` ^1.16.0, `@sentry/react` + vite-plugin, Playwright for e2e.

## Dead Code

| File / Dependency | Why it's dead |
|---|---|
| `src/App.tsx` | Never imported by `main.tsx` or `index.html`; uses `react-router-dom`'s `BrowserRouter` — a different router than the app actually mounts |
| `src/server.ts`, `src/start.ts` | Import `@tanstack/react-start`, which is **not in `package.json` dependencies** at all (zero hits in `package-lock.json`) — orphaned SSR scaffolding from a template |
| `src/lib/error-capture.ts`, `src/lib/error-page.ts` | Only consumed by the dead `server.ts`/`start.ts` |
| `src/hooks/use-mobile.tsx` | Defined, never imported anywhere |
| `react-router-dom` (dependency) | Used only by the dead `App.tsx` and the broken `coming-soon.tsx` |
| `@cloudflare/vite-plugin` (dependency) | Present but not wired into `vite.config.ts` in any way that's exercised by the actual build path |

**Recommendation:** either delete these files/dependencies outright, or if `ComingSoon` should genuinely use `react-router-dom`'s `<Link>`, mount a compatible router — but the simpler, correct fix is to make `coming-soon.tsx` use TanStack Router's `<Link>` and delete the rest.

## Related Documents

- [`03_SYSTEM_ARCHITECTURE.md`](./03_SYSTEM_ARCHITECTURE.md) — how the frontend fits into the whole system
- [`05_API_REFERENCE.md`](./05_API_REFERENCE.md) — every endpoint the API client should call
- [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) — full bug list including all frontend crashes
- [`14_CODING_GUIDELINES.md`](./14_CODING_GUIDELINES.md) — conventions to follow when adding new pages/components
