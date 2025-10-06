# Agent Notes

- Wired Vite and Vitest to honor the shared `@/*` alias, swapped the remaining relative imports over, and verified the smoke test still passes.
- Consolidated the legacy `App.css` and `index.css` into `src/styles/`, updated imports, and documented that Tailwind will eventually replace these stopgap globals.
- Moved the starter `App` component and its smoke test into `src/app/`, updating imports to keep the current scaffold working until styles move later.
- Added the planned feature folders (`app`, `components`, `features`, `hooks`, `lib`, `styles`) under `src/` so future moves can happen incrementally without mixing concerns in the root.
- Installed Vitest, Testing Library, and jsdom via pnpm, documenting the required sandbox approvals (`allow-scripts`, `allowedBuiltDependencies`) so esbuild can fetch its binary without interactive prompts.
- Added `vitest.config.ts` with detailed comments, switched the pool to `threads` to sidestep the CLI’s process-isolation limits, and created `src/test/setup.ts` for shared matcher registration.
- Introduced a minimal `src/App.test.tsx` smoke test to prove the harness works end-to-end and updated the tsconfigs plus package scripts (`test`, `check`) so TypeScript and CI now understand the testing context.
- Installed Tailwind (3.x) with PostCSS/Autoprefixer, scaffolded config files, and layered the Tailwind bundle ahead of legacy CSS inside `src/main.tsx`.
- Converted the starter app to a Tailwind-styled visual showcase with seeded roster data, gradient pulses, and verbose comments so QA can validate the integration.
- Replaced the smoke test with a Tailwind-aware visual assertion suite that checks key utilities, the roster layout, and accent styling (no snapshots to dodge class churn).
- Removed the legacy Vite body/root CSS constraints so the gradient spans the full viewport while keeping tests green.

## Suggested Next Steps
1. Build the base app shell (router, providers, layout) inside `src/app/` so subsequent features have a stable frame.
2. Start wiring Supabase env handling and auth flow once the shell exists.
