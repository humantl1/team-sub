# Agent Notes

## Recent work
- Replaced temporary teams API typings with aliases built from `Tables<'teams'>`/`TablesInsert<'teams'>` so the hooks, mappers, and mutations all compile against the generated Supabase schema while still returning camelCased app records.
- Generated typed Supabase schema helpers: linked the CLI, ran `supabase start` and `supabase db diff --schema public`, then captured `supabase gen types typescript --schema public --linked > src/lib/supabase.types.ts` so the client helper now receives strongly typed generics and future refreshes stay scriptable.
- Added an `app_users` profile sync that runs after Supabase authentication, sanitizes the display name, and skips redundant upserts during token refresh events.
- Expanded Supabase auth regression coverage: confirmed LoginForm already handles happy/error flows, added session restoration and logout tests to `SupabaseAuthProvider`, and kept `CHECKLIST.md` aligned with the verified scenarios.
- Enabled Supabase magic-link login flow end-to-end (env vars, allowlist, smoke test)
- Wired the Supabase auth provider, route guard, and magic-link login form; navigation now reflects the active session and new tests cover the form plus access control flows.
- Wired Supabase client scaffolding: added env typings, singleton factory, README notes, and tests validating configuration guards.
- Implemented teams-focused TanStack Query hooks (list/detail/create/update/delete), plus Supabase-mocked tests that verify cache behaviour and guard the interim type definitions against schema drift.
- Installed Tailwind (3.x) with PostCSS/Autoprefixer, scaffolded config files, and layered the Tailwind bundle ahead of legacy CSS inside `src/main.tsx`.
- Built the base application shell: added React Router with a root layout, QueryClient-powered provider stack, placeholder login route, and updated tests; installed `react-router-dom` and `@tanstack/react-query` to support the new wiring.
- Documented the Supabase schema: added ER diagram (`docs/schema-diagram.md`) and execution/playbook updates (`docs/supabase-schema.md`) covering the new view and permissions tweaks.
- Captured the Supabase CLI + Docker workflow: documented login/link prerequisites, added the dump/diff cadence to `AGENTS.md`, and updated the checklist so schema sync stays in lockstep with Supabase.
- Tightened roster/substitution RLS policies to enforce same-team player alignment and annotated the SQL so future edits keep the guard intact.

## Suggested Next Steps
1. Extract shared Supabase test utilities (mock factories, env stubbing) into `src/test/` to unblock new integration-style tests.
2. Stand up a minimal CI workflow that runs `pnpm check` to keep lint/test/tsc coverage consistent before shipping roster work.
3. Implement TanStack Query hooks for players, games, roster slots, positions, and substitutions (building atop the updated typings).
4. Seed baseline sports and default positions in Supabase so new teams inherit sensible defaults.
5. Outline roster-focused test scenarios (add player, reorder list, substitution flow) to guide the roster MVP.
6. Add the auth-provider integration test, mocked Supabase roster guard tests, and broader Supabase data-flow coverage once shared utilities exist.
