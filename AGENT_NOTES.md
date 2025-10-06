# Agent Notes

## Recent work
- Wired Supabase client scaffolding: added env typings, singleton factory, README notes, and tests validating configuration guards.
- Introduced a minimal `src/App.test.tsx` smoke test to prove the harness works end-to-end and updated the tsconfigs plus package scripts (`test`, `check`) so TypeScript and CI now understand the testing context.
- Installed Tailwind (3.x) with PostCSS/Autoprefixer, scaffolded config files, and layered the Tailwind bundle ahead of legacy CSS inside `src/main.tsx`.
- Replaced the smoke test with a Tailwind-aware visual assertion suite that checks key utilities, the roster layout, and accent styling (no snapshots to dodge class churn).
- Built the base application shell: added React Router with a root layout, QueryClient-powered provider stack, placeholder login route, and updated tests; installed `react-router-dom` and `@tanstack/react-query` to support the new wiring.

## Suggested Next Steps
1. Implement the Supabase magic-link authentication UI plus session-aware routing using the new client helper.
2. Define the initial database schema (teams, players, substitutions) inside Supabase, pairing every table with Row Level Security policies so the anon key cannot access other users' data.
3. Decide how to generate TypeScript types for row data (Supabase typegen vs hand-authored interfaces) once the schema exists.
