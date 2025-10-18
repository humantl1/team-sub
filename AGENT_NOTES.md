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
- Documented the Supabase schema: added ER diagram (`docs/schema-diagram.md`) and execution/playbook updates (`docs/supabase-schema.md`) covering the new view and permissions tweaks.
- Captured the Supabase CLI + Docker workflow: documented login/link prerequisites, added the dump/diff cadence to `AGENTS.md`, and updated the checklist so schema sync stays in lockstep with Supabase.
- Tightened roster/substitution RLS policies to enforce same-team player alignment and annotated the SQL so future edits keep the guard intact.

## Suggested Next Steps
1. Upsert `app_users` profile rows immediately after Supabase authentication so RLS policies resolve the owner id.
2. Generate Supabase TypeScript types and adopt them inside the client helper once the schema stabilizes.
3. Extend Vitest suites to cover Supabase data flows (queries/mutations, default-position cloning) using mocked clients.
4. Wire TanStack Query hooks for teams/players/games so the UI starts consuming live data.
5. Outline roster-focused test scenarios (add player, reorder list, substitution flow) to guide upcoming feature work.
6. Seed baseline sports and default position records so new teams can inherit sensible defaults without manual setup.
