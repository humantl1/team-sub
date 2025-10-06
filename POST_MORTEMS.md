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
