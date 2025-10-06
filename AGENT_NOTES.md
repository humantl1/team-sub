# Agent Notes

- Introduced a minimal `src/App.test.tsx` smoke test to prove the harness works end-to-end and updated the tsconfigs plus package scripts (`test`, `check`) so TypeScript and CI now understand the testing context.
- Installed Tailwind (3.x) with PostCSS/Autoprefixer, scaffolded config files, and layered the Tailwind bundle ahead of legacy CSS inside `src/main.tsx`.
- Replaced the smoke test with a Tailwind-aware visual assertion suite that checks key utilities, the roster layout, and accent styling (no snapshots to dodge class churn).
- Built the base application shell: added React Router with a root layout, QueryClient-powered provider stack, placeholder login route, and updated tests; installed `react-router-dom` and `@tanstack/react-query` to support the new wiring.

## Suggested Next Steps
1. Wire Supabase environment variables and client factory so we can start persisting auth/session state inside the new providers layer.
2. Replace the login placeholder with the magic-link flow backed by Supabase, including route guards leveraging the session context.
