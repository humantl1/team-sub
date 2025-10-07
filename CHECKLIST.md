# Build Checklist

## Active
- [ ] Define initial database schema for teams, players, and substitutions

## Planned
- [ ] Add TanStack Query hooks for core data operations
- [ ] Build roster management MVP (list, add, substitute players)
- [ ] Configure deployment target (Vercel or Netlify) with env vars
- [ ] Set up CI workflow running `pnpm check`
- [ ] Extract shared Supabase test utilities (mock factories, env stubbing) to `src/test/` so upcoming feature tests reuse the patterns without duplicating setup.

## Completed
- [x] Add logout flow test ensuring `supabase.auth.signOut` clears session
- [x] Add SupabaseAuthProvider session-restoration test covering `getSession`
- [x] Add LoginForm unauthorized-email test capturing allowlist enforcement messaging
- [x] Add LoginForm happy-path test to assert success UI after `signInWithOtp`
- [x] Enable Supabase magic-link login flow end-to-end (env vars, allowlist, smoke test)
- [x] Review error logging for the login screen. Ensure that in dev mode error reporting is verbose
- [x] Ensure unmatched routes render the branded error boundary
- [x] Guard Supabase test storage key generation when crypto is unavailable
- [x] Restore Supabase login guard and Vitest GoTrue warning fixes
- [x] Prevent `LoginForm` from instantiating the Supabase client when the provider reported an initialization error so env misconfigurations show the intended UI guidance instead of triggering the global error boundary.
- [x] Review recent Supabase and error boundary changes
- [x] Investigate blank screen when running `pnpm dev`
- [x] Introduce a custom router error boundary so runtime failures render a project-branded fallback instead of React Router's default developer message.
- [x] Implement authentication flow with magic links and session context
- [x] Initialize Supabase project configuration and env management
- [x] Create base app shell with routing, providers, and layout
- [x] Align Vite `resolve.alias` with `@/*` path mapping
- [x] Move legacy CSS into `src/styles/` and update imports
- [x] Move existing app shell files into `src/app/` and verify tests pass
- [x] Scaffold src directories (`app/`, `components/`, `features/`, `hooks/`, `lib/`, `styles/`)
- [x] Evaluate directory structure for configs, tests, and feature slices; propose adjustments if needed
- [x] Capture pnpm/esbuild/threading notes in AGENTS.md or README for future reference
- [x] Validate Vitest suite health (`pnpm test -- --run`) and document any harness quirks
- [x] Add ESLint, Prettier, and jsx-a11y tooling
- [x] Configure strict TypeScript compiler options (`tsconfig.json`)
- [x] Reviewed AGENTS.md and captured project constraints
- [x] Created project `.gitignore` covering Node/Vite/Supabase artifacts
- [x] Set up Vitest + Testing Library environment
- [x] Initialized Vite + React TypeScript project with pnpm
- [x] Install Tailwind CSS and wire global styles
- [x] Create Tailwind-driven visual regression test for starter app
