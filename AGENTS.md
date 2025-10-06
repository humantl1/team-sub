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

# Working Flow
- Always create and maintaint tasks in the CHECKLIST.md file
- Ensure tasks are added as discovered, mark active tasks, stale tasks, and completed tasks
- Before executing a task, plan and document the task in CURRENT_TASK.md. Prompt the developer to approve the plan before executing. When new issues arise in a task, update the plan in CURRENT_TASK.md. This should always be used to work through problems.
- Since this is a learning project as well as a practical project, add comments throughout even boiler plate code explaining the reason for adding it as well as what it does. It's okay to be unusually verbose in comments for this project.

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

### Create project
```bash
# choose one package manager; examples use pnpm
pnpm create vite@latest my-app -- --template react-ts
cd my-app
pnpm i
```

### Strict TypeScript

`tsconfig.json` (ensure these):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## 2) Project Structure (keep tiny & focused)
```
src/
  app/               # app wiring: router, providers, layout shells
  components/        # presentational UI pieces
  features/          # vertical slices (budget/, games/, profile/)
  hooks/             # reusable React hooks
  lib/               # helpers (supabase client, query client, logger)
  pages/             # route-level pages (if you prefer pages over features)
  styles/            # tailwind.css and globals
  test/              # testing setup + utilities
```

> Rule of thumb: create a **feature/** folder when a domain gets 3+ files (types, api, ui).

---

## 3) Tooling (fast, minimal)

### ESLint + Prettier + a11y
```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier prettier eslint-plugin-react-refresh eslint-plugin-jsx-a11y
```

`.eslintrc.cjs`
```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react-refresh", "jsx-a11y"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
    "eslint-config-prettier",
  ],
  rules: { "react-refresh/only-export-components": "warn" },
};
```

`prettier.config.cjs`
```js
module.exports = { semi: true, singleQuote: false, trailingComma: "all" };
```

### Vitest + RTL
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

`vitest.config.ts`
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: "./src/test/setup.ts" },
});
```

`src/test/setup.ts`
```ts
import "@testing-library/jest-dom";
```

> ℹ️ For Supabase-dependent tests, mock the client with a test double or use MSW.

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

### Scripts

`package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "format": "prettier --write .",
    "test": "vitest",
    "check": "pnpm lint && pnpm test -- --run && tsc -b --noEmit"
  }
}
```

---

## 4) Styling (Tailwind + tiny UI kit)
```bash
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js`
```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

`src/styles/tailwind.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Add to `src/main.tsx`:
```ts
import "./styles/tailwind.css";
```

> Optional: **shadcn/ui** later for a few polished primitives (Button, Input, Dialog) without going full UI framework.

---

## 5) Routing & App Shell
```bash
pnpm add react-router-dom
```

`src/app/router.tsx`

- create app shell

---

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

### Client

`pnpm add @supabase/supabase-js`

`src/lib/supabase.ts`
```ts
import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string; // ⚠️ Treat anon key as limited but still sensitive
export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
```

### Auth (magic link + allowlist)

Create a table for allowlisting emails:
```sql
create table public.allowed_emails (
  email text primary key
);
```

Enable **Row Level Security** on any user tables. Example login flow UI:

`src/features/auth/LoginForm.tsx`
```tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Optional: check allowlist server-side via Supabase RPC or
    // client-side precheck (not security; just UX). Real gate = RLS.
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) setSent(true);
  }
  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-2 w-full"
        placeholder="you@example.com"
      />
      <button className="border px-3 py-2">Send magic link</button>
      {sent && <p>Check your email for a sign-in link.</p>}
    </form>
  );
}
```

Use an **AuthProvider** to expose `session`:

`src/app/providers.tsx`
```tsx
import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
const qc = new QueryClient();
export function Providers({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```

> Gate routes by checking `session` and redirecting to `/login`.

### Database: minimal schema

> **Security**: RLS ensures only the signed-in user can see/change their rows. Avoid trusting client prechecks.

### Type generation (optional, recommended)

Install Supabase CLI and run typegen to produce TS types from your DB (reduces `any`). For early stages you can hand-write `types.ts`.

> **Migrations**: prefer `supabase db push` during early dev; graduate to versioned migrations (`supabase migration new`) as the schema stabilizes.

---

## 7) Data Fetching Patterns (TanStack Query)
```bash
pnpm add @tanstack/react-query
```

> ⚠️ Error handling: wrap critical routes/pages with an error boundary and surface query errors via a toast/snackbar.

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

- For Supabase, inject the client or mock `@/lib/supabase` using Vitest.
- For router-aware components, wrap with `MemoryRouter` in tests.

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
