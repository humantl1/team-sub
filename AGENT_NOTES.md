# Agent Notes

## Recent work
- Expanded Supabase auth regression coverage: confirmed LoginForm already handles happy/error flows, added session restoration and logout tests to `SupabaseAuthProvider`, and kept `CHECKLIST.md` aligned with the verified scenarios.
- Enabled Supabase magic-link login flow end-to-end (env vars, allowlist, smoke test)
- Wired the Supabase auth provider, route guard, and magic-link login form; navigation now reflects the active session and new tests cover the form plus access control flows.
- Wired Supabase client scaffolding: added env typings, singleton factory, README notes, and tests validating configuration guards.
- Introduced a minimal `src/App.test.tsx` smoke test to prove the harness works end-to-end and updated the tsconfigs plus package scripts (`test`, `check`) so TypeScript and CI now understand the testing context.
- Installed Tailwind (3.x) with PostCSS/Autoprefixer, scaffolded config files, and layered the Tailwind bundle ahead of legacy CSS inside `src/main.tsx`.
- Replaced the smoke test with a Tailwind-aware visual assertion suite that checks key utilities, the roster layout, and accent styling (no snapshots to dodge class churn).
- Built the base application shell: added React Router with a root layout, QueryClient-powered provider stack, placeholder login route, and updated tests; installed `react-router-dom` and `@tanstack/react-query` to support the new wiring.

## Suggested Next Steps
1. Define the initial database schema (teams, players, substitutions) inside Supabase, pairing every table with Row Level Security policies so the anon key cannot access other users' data.
2. Decide how to generate TypeScript types for row data (Supabase typegen vs hand-authored interfaces) once the schema exists.
3. Start wiring TanStack Query hooks for roster/team operations once tables are in place so the UI can hydrate from real data.
4. Map out roster-focused test scenarios (add player, reorder list, substitution flow) so coverage can grow alongside the data/API work.

## Onboarding Checklist Notes
- Confirm every new agent session reviews `AGENTS.md`, `AGENT_NOTES.md`, and `CHECKLIST.md` in that order to stay aligned with standards and in-flight work.
- After reviewing the docs, report back to the developer with any questions or confirm readiness before picking up tasks.
- Share the immediate plan for upcoming work once onboarding is acknowledged so prioritization stays transparent.
