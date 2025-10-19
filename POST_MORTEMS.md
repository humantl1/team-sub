# Post Mortem: Tailwind Visual Smoke Test

## Issues Encountered

### Tailwind CLI availability
- Initial install pulled Tailwind v4 beta, which no longer ships a local CLI binary, so `tailwindcss init -p` failed (`ENOENT`).
- Resolved by pinning Tailwind to the stable `3.4.17` release so the classic CLI lives under `node_modules/.bin/`.

### pnpm approve-builds friction
- Sandbox blocked esbuild’s postinstall hook and `pnpm approve-builds` required interactive confirmation.
- Documented the need for a manual approval and verified it once the user ran it locally.

### Legacy Vite CSS constraining layout
- The starter `body` flex/centering and `#root` width kept the Tailwind gradient from spanning the viewport, producing a left-aligned layout despite `w-full` utilities.
- Removed those legacy constraints in `src/styles/index.css`, allowing Tailwind to manage layout.

### Snapshot mismatch in visual test
- Inline snapshot failed because list numbering renders as nested DOM nodes.
- Replaced the heavy snapshot with targeted assertions against Tailwind utility class names and counts.

# Post Mortem: Supabase client + documentation gotchas

## Issues Encountered

### Incomplete gotcha coverage
- Initial Supabase scaffolding added env types and a singleton client, but documentation still contained sample code that re-created clients and lacked explicit testing guidance.
- Fix required auditing `AGENTS.md`, `README.md`, and `AGENT_NOTES.md` to align with the agreed gotchas (singleton usage, RLS emphasis, env separation, testing patterns).

### Documentation regression risk
- While updating `AGENTS.md`, an accidental overwrite nearly dropped large sections of existing guidance.
- Avoided by immediately reverting the file and applying targeted patches instead of wholesale rewrites.

### Supabase Vitest warning
- Vitest emits a "Multiple GoTrueClient instances" warning when tests intentionally create fresh clients.
- Added a follow-up checklist item to revisit the test setup (e.g., shared test client or stubbed auth module) to silence the warning without losing coverage.

## Lessons Learned / Action Items
- Always double-check long-form documentation edits with smaller patches to preserve project history and avoid unintentional deletions.
- Maintain a running checklist entry when TODO comments or warnings appear in output so they do not get lost after the immediate change merges.

# Post Mortem: Supabase magic-link authentication implementation

## Issues Encountered

### App smoke test broke once routes became auth-gated
- Wrapping the home route in `RequireAuth` meant the existing `App.test.tsx` no longer rendered the Tailwind showcase because the test didn’t provide a session.
- Fixed by fully mocking the Supabase client within the test, stubbing `getSession`, `onAuthStateChange`, and `signOut` to mimic an authenticated user before importing `<App />`.

### Vitest run failed on missing Supabase env vars
- Adding the real auth provider triggered `getSupabaseClient()` inside tests, which threw when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` were absent.
- Resolved by stubbing those env variables at the top of the test suites that exercise the provider so configuration guards stay intact without leaking global state.

### Reused Supabase singleton mocked per-test
- The login form and guard suites each mocked Supabase differently; forgetting to reset mocks caused cross-test leakage during early iterations.
- Standardized the mocks by casting to `SupabaseClient`, clearing them in `afterEach`, and relying on helper creators so new tests can stay consistent.

## Lessons Learned / Action Items
- When introducing cross-cutting providers, update foundational smoke tests immediately—they act as the canary for route guards and global wiring.
- Supabase client access should always be wrapped in easily mockable helpers; otherwise, tests will keep tripping over env requirements.

# Post Mortem: Blank dev screen & custom router error boundary

## Issues Encountered

### Missing Supabase env vars crashed the auth provider
- `SupabaseAuthProvider` called `getSupabaseClient()` during render. When `.env.local` was absent it threw, React crashed, and developers saw a blank page.
- Fixed by catching initialization failures, storing the error in context, and rendering a friendly message so the UI stays responsive.

### React Router default error overlay leaked back in
- Without a custom `errorElement`, runtime route errors fell back to React Router’s developer overlay, which breaks the project’s visual polish.
- Implemented `AppErrorBoundary` with Tailwind styling, user-facing messaging, and dev diagnostics gated behind `import.meta.env.DEV`.

### Loader diagnostics were too generic
- Initial boundary always showed the HTTP status text even when loaders threw rich data (strings/objects).
- Normalized `routeError.data` so developers see the original message, preventing debugging dead ends.

### Vitest failure from duplicate text nodes
- Error boundary test queried a single node, but the boundary renders both the message and stack trace, triggering a “Found multiple elements” failure.
- Updated the assertion to use `getAllByText` with explicit length checks.

## Lessons Learned / Action Items
- Defensive guards in providers keep the SPA debuggable even when setup is incomplete; prefer resilient fallbacks over throwing errors in render.
- Pair UI polish tasks with targeted regression tests so future routing changes don’t resurrect framework defaults.
- When asserting error copy in tests, remember that developer diagnostics may render in multiple locations—account for that in queries to avoid brittle expectations.

# Post Mortem: Login form misconfiguration guard duplication

## Issues Encountered

### Duplicate error messaging when Supabase initialization fails
- The first guard implementation set the login form’s local status to `error` even when the shared provider already surfaced the configuration problem.
- Because the form also renders the provider banner, the screen showed the same message twice, confusing the visual feedback we intended for misconfigured environments.

## Resolution
- Adjusted the early-return branch so the component keeps its local status at `idle` and clears any feedback message. The UI now relies solely on the provider banner when the client is unavailable while still blocking submission attempts.
- Re-ran the test suite to confirm the UX stays intact and the regression tests cover the scenario.

## Lessons Learned / Action Items
- When reusing provider-sourced errors in local components, avoid layering duplicate states unless the UX explicitly calls for redundancy.
- Favor testing the rendered UI after changes to shared context contracts; small state tweaks can ripple into surprising visual regressions even when logic seems straightforward.

# Post Mortem: Supabase configuration error boundary

## Issues Encountered

### Disabled login form still rendered during configuration failures
- Missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` left the login form on screen with controls disabled, which would confuse production users and suggested the app was usable when it was not.

### Route boundary lacked Supabase-specific messaging
- Our branded error boundary treated Supabase bootstrap failures as generic 500 errors, so developers had to inspect the console to learn that env vars were missing.

## Resolution
- Root layout now throws a dedicated `SupabaseConfigurationError` when the client is unavailable, ensuring React Router immediately renders the full-screen boundary instead of the login form.
- `AppErrorBoundary` recognizes that error type and shows a clear headline plus the captured env guidance while still hiding diagnostics outside development builds.
- Added focused tests to verify both the exception path and boundary rendering so future refactors keep the behaviour intact.

## Lessons Learned / Action Items
- Escalating unrecoverable configuration gaps into the router boundary provides a consistent UX and keeps “look broken but interactive” states from shipping.
- When introducing new error classes, wire them into the shared boundary immediately and bake in regression tests so they remain discoverable for developers.
# Magic-link auth enablement (2025-02-14)

**What happened**
- Verified Supabase project config (Data API, public schema, email templates) and populated an `allowed_emails` table with RLS policies so only matching users can read/insert their row.
- Created `.env.local` with the project URL + anon key, restarted `pnpm dev`, and walked through the full magic-link login/logout flow to confirm the SPA wiring works outside mocks.
- Ran `pnpm test -- --run`; suite passed, but no new tests were added for the happy/error paths we exercised manually.

**Why it worked**
- Supabase dashboard steps ensured every dependency (magic-link template, allowlist table, RLS policies) was in place before testing locally.
- The existing React provider already handled session bootstrap and state changes, so once env vars were valid everything clicked without code edits.

**Opportunities**
- Add focused tests for the login success/error states, session restoration, and logout to prevent regressions without relying on manual walkthroughs.
- Consider documenting the Supabase policy SQL in the repo (migration or README snippet) so others can reproduce the setup without digging through history.

# Post Mortem: Supabase auth provider test coverage sweep (2025-02-14)

## Issues Encountered

### Hidden dependency on `@testing-library/user-event`
- While adding the logout-flow test, the first implementation relied on `userEvent`, but the project has intentionally avoided that dependency to keep the test bundle lean.
- Vitest failed during module resolution, forcing a rewrite of the interaction to use the already-installed `fireEvent` helper instead of introducing a new package.

### Existing coverage disguised remaining work
- The checklist called out both the LoginForm happy path and allowlist error scenarios, yet those tests already existed. Time was spent confirming behaviour rather than writing new assertions, which could have been avoided with inline notes pointing to the coverage.

## Resolutions
- Swapped the button interaction to `fireEvent.click`, eliminating the missing dependency and keeping the test consistent with the rest of the suite.
- Documented in `CURRENT_TASK.md` when an item was already satisfied so future agents can skip redundant implementation steps.

## Lessons Learned / Action Items
- When reaching for additional Testing Library helpers, double-check whether the dependency is part of the current toolchain before adopting it; prefer the existing primitives when they meet the need.
- Annotate checklist items once covered to prevent future rediscovery work—especially when the checklist mixes real gaps with verification tasks.

# Post Mortem: Supabase schema rollout & allowlist cleanup (2025-02-15)

## Issues Encountered

### View creation run mixed with parameterized SQL
- While applying the `positions_with_sport` view, the Supabase SQL editor still held example statements containing `:owner_id` placeholders, leading to a syntax error that initially looked like a view problem.
- Resolved by re-running only the view DDL; documented the clean snippet in `docs/supabase-schema.md` to prevent future copy/paste mistakes.

### Supabase marked the new view as “Unrestricted”
- Supabase flagged the view because views default to creator privileges, tripping the dashboard warning even though base tables have RLS.
- Added explicit `revoke`/`grant` guidance and enabled `security_invoker` so the view executes with caller permissions while keeping authenticated access intact.

### Ghost allowlist table created confusion
- The hosted project still had an `allowed_emails` table from earlier experiments, but the repo never created or referenced it beyond a mocked error message.
- Decided to drop the concept for now, scrubbed the code/tests/docs, and noted that true invite-only flows will need a deliberate schema/task later.

## Resolutions
- Captured the full schema (tables, RLS, view permissions) in both `supabase/schema.sql` and `docs/supabase-schema.md`, plus a Mermaid ERD for quick review before execution.
- Updated the Supabase playbook with the privilege fix and highlighted where a GUI step is required so future runs stay reproducible.
- Removed allowlist expectations from tests/comments/checklists to keep the codebase aligned with the simplified auth approach.

## Lessons Learned / Action Items
- Keep SQL examples that use bind-style placeholders separate from production DDL to avoid accidental copy/paste errors in the Supabase editor.
- When adding views, always pair them with explicit privilege statements (and `security_invoker`) so Supabase’s telemetry matches our RLS posture.
- Revisit the auth invite story intentionally—either reintroduce a first-class allowlist or document the open registration stance—before exposing roster management more broadly.
- Next focus areas: wire TanStack Query hooks, generate Supabase types, and add flow-level tests so the new schema starts powering the app.

# Post Mortem: TanStack Query teams hooks rollout (2025-02-18)

## Issues Encountered

### Supabase client mocking ergonomics
- Each hook test needs a predictable Supabase interface (`from().select().order()`, etc.). Building the stub inline for every test quickly became noisy and error-prone.
- Resolved by centralising a `createSupabaseStub` helper inside the test suite so we can reset call stacks consistently while still asserting on chained method usage.

### Manual type drift risk
- Without generated types, `TeamRecord` and the camelCase mapper could silently diverge from `supabase/schema.sql`.
- Mitigated by introducing a fixture-based assertion that maps a representative Supabase row and fails if new columns appear, keeping the hand-written shape honest until typegen lands.

### Optimistic cache rollbacks
- Early mutation implementations re-threw errors from `onError`, which caused the optimistic rollback logic to be skipped when callers awaited `mutateAsync`.
- Fixed by letting `onError` handle cache restoration and relying on the rejection emitted by TanStack Query automatically, so state is restored even when consumers handle the promise manually.

## Resolutions
- Added shared helpers (`types`, `queryKeys`, `mappers`, `error`) to consolidate conventions and keep future feature slices consistent.
- Recorded comprehensive hook tests (success, error, cache-sync) to validate the behaviour end-to-end and document the stub pattern for upcoming player/game hooks.
- Updated the checklist and agent notes so the remaining Supabase feature work (players/games/etc.) explicitly references the new foundation.

## Lessons Learned / Action Items
- Prior to expanding into other tables, extract the Supabase test stub into `src/test/` so future suites do not reimplement the same helper logic.
- Adopt Supabase type generation soon to eliminate the remaining manual type maintenance and reduce fixture overhead.
- Keep mutation `onError` handlers focused on cache reconciliation; allow the rejection to propagate naturally so UI callers can own their experience without duplicating rollback concerns.
