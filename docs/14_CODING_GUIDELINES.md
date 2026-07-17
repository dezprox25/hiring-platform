# 14 — Coding Guidelines

These reflect the conventions the existing codebase actually follows (so new code fits in without a rewrite), plus explicit corrections where the current pattern is a known risk. Follow the existing pattern unless this document tells you not to.

## Architecture Rules

- **Frontend:** pages own their own data-fetching (`useQuery`/`useMutation` inline). This is the current pattern but is a documented source of duplication — if you're touching 3+ near-identical pages (e.g. another "list of candidates" view), extract a shared hook/component instead of copy-pasting a 4th time.
- **Backend:** one NestJS module per domain concept (`candidates`, `assessments`, `reports`, etc.), each with its own `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`, `enums/`. Follow this shape for any new module.
- **Services talk to TypeORM repositories directly** — there is no repository-pattern abstraction layer beyond `@InjectRepository()`. Don't introduce one unless there's a concrete reason (e.g. swapping data stores), since it would be inconsistent with every existing module.
- **Guards are opt-in per controller**, not global. When adding a new controller, you **must** explicitly add `@UseGuards(JwtAuthGuard, RolesGuard)` at the class level and `@Roles(...)` per route (or class-level with per-route overrides) — copy the pattern from `CandidatesController` or `AssessmentsController`. Forgetting this makes the route open by default with no error or warning.

## Folder Rules

- Frontend: new pages go under `src/routes/{role}/` and are auto-registered by the file-based router — do not hand-edit `routeTree.gen.ts`.
- Frontend: app-specific components go in `src/components/` (flat, not nested); shadcn primitives stay in `src/components/ui/` and should be regenerated via the shadcn CLI, not hand-patched, if they need updating.
- Backend: DTOs go in `<module>/dto/`, entities in `<module>/entities/`, enums in `<module>/enums/`. Don't put entities directly in the module root.
- Shared/cross-cutting backend code (guards, decorators, enums used by 2+ modules, constants, helpers) goes in `src/common/`.

## Naming Conventions

- **Backend DB columns:** camelCase in TypeScript entities, auto-converted to snake_case in the database via `SnakeNamingStrategy`. Don't manually specify `name:` overrides unless you need a name that doesn't follow the automatic conversion — most entities don't.
- **Backend enums:** PascalCase type name, UPPER_SNAKE or lowercase string values matching what's stored in the DB CHECK constraint (e.g. `Role.ADMIN = 'admin'`). Check the migration's CHECK constraint values match the enum exactly when adding a new enum value — see the `csharp` drift in [`04_DATABASE.md`](./04_DATABASE.md) for what happens when they don't.
- **Frontend files:** route files are lowercase-kebab or lowercase (`candidates.tsx`, `builder.tsx`); components are PascalCase exports from lowercase-kebab files (matches shadcn convention).
- **API client methods** (`src/lib/api.ts`): verb + noun, matching REST semantics (`findAll`, `findOne`, `create`, `update`, `delete`, `updateStatus`). **Before adding a new method, verify the backend route actually exists** — the MCQ/Typing bugs in this codebase happened because a frontend method was assumed rather than checked against [`05_API_REFERENCE.md`](./05_API_REFERENCE.md).

## Coding Style

- TypeScript `strict: true` is enabled on both projects, but `noUnusedLocals`/`noUnusedParameters` are `false` — the compiler will **not** catch unused imports or dead variables (this is exactly how the missing-`Progress`-import bug and several dead files went unnoticed). Consider enabling both, or at minimum, don't rely on `tsc` alone to catch these — use ESLint once it's configured (see below).
- Prettier is configured (`format` script in both `package.json`s) — run it before committing.
- Both projects pin **ESLint 9**, which requires flat config (`eslint.config.js`/`.mjs`). **Neither project currently has one.** Until this is added, `npm run lint` cannot be trusted — do not treat a clean `lint` run as meaningful until this is fixed (see [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md)).

## State Management Rules

- Server state → TanStack Query, always. Never hand-roll `fetch` + `useState` + `useEffect` for data that TanStack Query should own.
- No global client-state library exists (no Redux/Zustand) and none should be introduced without a clear justification — the current scale doesn't need one. If a genuine cross-page UI state need arises, prefer React Context scoped narrowly, not a new dependency.
- Auth state lives in `localStorage`, read via `src/lib/auth-user.ts` — don't duplicate this by reading `localStorage` directly elsewhere.

## API Rules

- Every mutating backend endpoint must have a `class-validator`-decorated DTO — the global `ValidationPipe` rejects unknown fields (`forbidNonWhitelisted: true`), so an undeclared field is a 400, not a silent drop. This is a deliberate safety property; don't work around it by using `@Body() body: any`.
- Every new backend response is automatically wrapped in `{ data, status: 'success' }` by the global `ResponseInterceptor` — don't wrap responses manually in controllers.
- Every new frontend API call should go through `src/lib/api.ts`'s typed objects, using `unwrapData()` — don't call `axios`/`fetch` directly from a component.
- When adding a backend route, add it to [`05_API_REFERENCE.md`](./05_API_REFERENCE.md) in the same change — this document is the only structured API reference in the repo (no Swagger exists).

## Error Handling

- Backend: let NestJS's built-in HTTP exceptions (`BadRequestException`, `NotFoundException`, etc.) propagate — the global `SentryGlobalFilter` captures unhandled exceptions automatically. Don't swallow errors silently except where the existing code already does so deliberately (e.g. `code:autosave` WebSocket handler logs and swallows by design, since a failed autosave shouldn't crash the session).
- Frontend: the Axios response interceptor already shows a global toast on `403`/`500`/network errors — don't add redundant per-call error toasts unless the message needs to be more specific than the generic one.
- Frontend: `GlobalErrorBoundary` (`src/components/error-boundary.tsx`) catches render-time crashes and reports to Sentry in production — but this is a last resort, not a substitute for fixing the actual bug (e.g. the missing `Progress` import should be fixed, not relied upon to be caught by the boundary).

## Validation

- Backend: `class-validator` decorators on every DTO field, `enableImplicitConversion: true` is set globally so query-string numbers/booleans are coerced automatically — you don't need manual `parseInt`/`=== 'true'` string comparisons in controllers for validated DTO fields (though a few existing controllers do this for raw `@Query()` params that bypass DTO validation — avoid that pattern in new code, use a DTO instead).
- Frontend: `react-hook-form` + `zod` resolvers are available (`@hookform/resolvers` is a dependency) but not consistently used across every form — prefer this combination for new forms over uncontrolled inputs with manual validation.

## Git Workflow

- This repository currently has a single "Initial commit" with the rest of the codebase uncommitted — there is no established branch/PR history to infer a workflow from. Recommended baseline until the team decides otherwise:
  - `main` is the deployable branch.
  - Feature branches per ticket/task, merged via PR (the GitHub Actions CI in `.github/workflows/ci.yml` runs on push/PR to `main`/`master` and should gate merges once lint is actually enforceable).
  - Write migrations as separate, reviewable commits — never bundle a schema change into an unrelated feature commit.
  - Given the `feedbacks` drift found in this audit, **treat any new migration as requiring a second pair of eyes on the generated SQL**, especially since the CLI `data-source.ts` doesn't set the same naming strategy as the runtime module (see [`04_DATABASE.md`](./04_DATABASE.md)).

## Related Documents

- [`06_FRONTEND.md`](./06_FRONTEND.md) / [`07_BACKEND.md`](./07_BACKEND.md) — what the current code actually does, to compare new code against
- [`13_KNOWN_ISSUES.md`](./13_KNOWN_ISSUES.md) — mistakes already made that these guidelines exist to prevent repeating
