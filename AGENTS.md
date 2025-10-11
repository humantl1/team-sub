# Project: Simple mobile friendly web app for managing sports team substitutions.

# App Functionality:
- User can create a login and login
- User can create a "Team"
- User can add members to the "Team"
- Team and members are persistent through login sessions
- User can start a "Game" session
- For the game session, user can set how many players will be on the field at a time and which players are active.
Active players will appear in an interactive list
- The list order is editable by the user via drag and drop interactions
- The order of the list represents the order planned for players on the field and the next substitutions.

# Goals:
- This is a personal learning project.
- Ship quickly, learn fundamentals, adopt _lightweight_ best practices early, keep complexity low.
- **SPA with Vite**; **Supabase** for auth + Postgres; strict TypeScript; Tailwind + a tiny component set; TanStack Query for API calls/caching. No SSR for now.

# IMPORTANT!!
- Before proceeding with a step, explicitly point out of the developer will need to interact with the graphical UI of a tool or website.
- Proceed in small atomic chunks of implementation. Ensure each step is testable and test it.
- Always double-check long-form documentation edits with smaller patches to preserve project history and avoid unintentional deletions.

# Working Flow
- Always create and maintaint tasks in the CHECKLIST.md file
- Ensure tasks are added as discovered, mark active tasks, stale tasks, and completed tasks
- Before executing a task, plan and document the task in CURRENT_TASK.md. Prompt the developer to approve the plan before executing. When new issues arise in a task, update the plan in CURRENT_TASK.md. This should always be used to work through problems.
- Since this is a learning project as well as a practical project, add comments throughout even boiler plate code explaining the reason for adding it as well as what it does. It's okay to be unusually verbose in comments for this project.
- Maintain a running checklist entry when TODO comments or warnings appear in output so they do not get lost after the immediate change merges.
- After completing a full task, ask the developer if a post mortem should be written to POST_MORTEMS.md

# General Troubleshooting
- Flag the need for networked installs before running pnpm
- Pin third-party packages to stable major versions unless a beta is explicitly desired
- When interacting with `pnpm approve-builds`, expect interactive prompts and document the required local step for the user before proceeding.
- Run Vitest immediately after major UI refactors to surface snapshot/class mismatches before moving on.

## Sandbox & Tooling Footnotes
- `pnpm install` for Vitest pulls `esbuild`; grant `allow-scripts` and `allowedBuiltDependencies=esbuild` so the binary download succeeds without manual prompts.
- Vitest is configured with `pool: "threads"` to respect the CLI sandbox’s process limits; run suites in CI mode via `pnpm test -- --run` to avoid watch-mode restrictions.
- Shared DOM matchers live in `src/test/setup.ts`; keep new tests importing from `@testing-library/*` so this setup file activates automatically.

## CSS & Tailwind Footnotes
- Audit legacy CSS whenever layering Tailwind to avoid conflicting layout primitives; consider removing or porting them before styling tasks.
- Prefer deterministic, class-level assertions over DOM snapshots for Tailwind-heavy components to minimize brittleness.

## Supabase Footnontes
- When introducing cross-cutting providers, update foundational smoke tests immediately—they act as the canary for route guards and global wiring.
- Supabase client access should always be wrapped in easily mockable helpers; otherwise, tests will keep tripping over env requirements.


# Code Reviews
- Do not directly edit code
- Suggest code revisions as comments
- Ensure changes follow best language best practices
- Ensure changes follow tool best practices
- Ensure changes follow web development best practices
- Ensure changes respect a dynamic UI for mobile, tablet, or pc

---

## 0) TL;DR Stack

- **Frontend**: Vite + React + TypeScript (strict mode)
- **Styling**: Tailwind CSS + (optional) shadcn/ui primitives
- **Routing**: `react-router-dom`
- **State/Data**: Local React state + **TanStack Query** for server data
- **Auth/DB**: **Supabase** (email magic link, invite-only)
- **Env**: `.env.local` with `VITE_`-prefixed public vars (⚠️ Only `VITE_`-prefixed vars are exposed to the client; all others stay private)
- **Quality**: ESLint, Prettier, Vitest + RTL, basic a11y checks
- **Git hygiene**: Husky + lint-staged (fast checks on staged files)
- **Deploy**: Vercel (static export) or Netlify; Supabase lives separately
- **CI/CD** (optional early): GitHub Actions that run `pnpm check` (lint+test+tsc) on PRs

---

## 1) Prereqs & Initial Setup

### Install

- **Node**: 20 LTS
- **Package manager**: `pnpm` (fast), or `npm` if you prefer
- **VS Code** update with extensions: ESLint, Prettier, Tailwind CSS IntelliSense, React TS snippets

## 3) Tooling (fast, minimal)

### Git hooks (fast-only)
```bash
pnpm add -D husky lint-staged
npx husky init
```

`.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"
pnpm exec lint-staged
```

`package.json`
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix"],
    "*.{ts,tsx,js,jsx,css,md}": ["prettier --write"]
  }
}
```

## 6) Supabase (Auth + DB)

### Why Supabase for a Vite SPA

- Email magic-link auth that works in SPAs
- Postgres (with **Row Level Security**) so your family data stays private
- JS client is typed; you can **generate DB types** for end-to-end type safety

### Setup

1. Create a project at supabase.com (free tier is fine)
2. In project Settings → API, copy **Project URL** and **anon public key**
3. Create `.env.local` in your project root:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Database: minimal schema

> **Security**: RLS ensures only the signed-in user can see/change their rows. Avoid trusting client prechecks.

### Type generation (optional, recommended)

Install Supabase CLI and run typegen to produce TS types from your DB (reduces `any`). For early stages you can hand-write `types.ts`.

> **Migrations**: prefer `supabase db push` during early dev; graduate to versioned migrations (`supabase migration new`) as the schema stabilizes.

---

## 9) Environment & Secrets

- `.env` for defaults, `.env.local` for your machine; never commit `.env.local`
- All public client vars must be prefixed **`VITE_`** (otherwise Vite won’t expose them)
- Keep private secrets (service keys) **out of the SPA**; use only the Supabase **anon** key client-side (limited, but still treat as sensitive)
- Sensitive server work (cron, admin tasks) can be added later via Supabase Edge Functions or a tiny Cloudflare Worker

---

## 10) Accessibility & UX (basics that matter)

- Every interactive element must be focusable (`button`, `a`, inputs)
- Use visible focus rings (Tailwind has good defaults)
- Provide text alternatives for icons/images
- Color contrast ≥ 4.5:1 for body text
- Prefer semantic HTML structure (header, main, nav, footer)
- **Lint** with `eslint-plugin-jsx-a11y` to catch common issues early

---

## 11) Testing Minimalism

- **Unit**: pure functions
- **Component**: key screens render; critical flows succeed
- **No E2E yet**; you can add Playwright later

Mocking pointers:

- For Supabase, inject the client or mock `@/lib/supabase` using Vitest; stub `supabase.auth` helpers when flows depend on auth callbacks.
- For router-aware components, wrap with `MemoryRouter` **and** the shared AuthProvider so navigation + session context match production.

Example test:
```tsx
import { render, screen } from "@testing-library/react";
import { Categories } from "./Categories";
test("renders categories header", () => {
  render(<Categories />);
  expect(screen.getByText(/Loading|Error|Add/)).toBeInTheDocument();
});
```

---

## 12) Deployment (Vite SPA + Supabase)

- **Vercel** or **Netlify**: connect repo → set build command `pnpm build` and output dir `dist`
- Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in host dashboard
- Use a password-protected landing page or rely on magic-link auth (RLS still protects data)
- Add a basic GitHub Actions workflow to run `pnpm check` on push/pull requests (cheap CI)

**Optional: GitHub Actions CI (drop-in)**

`.github/workflows/ci.yml`
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [ main ]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

---

## 13) Daily Workflow (tight loop)

1. Pick a tiny slice (e.g., Roster: Add players)
2. Create/adjust table + RLS in Supabase
3. Wire query/mutation with React Query
4. Build the UI slice (form + list)
5. Run `pnpm check` locally; commit
6. Push → host builds
