# Agent Notes

## Recent work
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
1. Generate Supabase TypeScript types and adopt them inside the client helper once the schema stabilizes.
2. Extend Vitest suites to cover Supabase data flows (queries/mutations, default-position cloning) using mocked clients—players/games/roster slots remain outstanding.
3. Wire TanStack Query hooks for players, games, roster slots, positions, and substitutions using the new teams hooks as a template.
    - Extract the Supabase stub helper into src/test/ before implementing player/game hooks.
4. Outline roster-focused test scenarios (add player, reorder list, substitution flow) to guide upcoming feature work.
5. Seed baseline sports and default position records so new teams can inherit sensible defaults without manual setup.
6. Add mocked Supabase client tests that prove roster slot/substitution mutations reject cross-team players and succeed for valid teams.
