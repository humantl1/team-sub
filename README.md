# team-sub
Simple web app to manage recreational sports team player substitutions quickly and intuitively.

## Environment Setup
- Duplicate `.env.example` as `.env.local` in the project root; Vite ignores `.env.local` so secrets stay local.
- Log in to the Supabase dashboard, open your project settings, then copy **Project URL** and the **anon public key** from the API section.
- Only the Supabase anon key is safe to ship to the browser. Never add service role keys or other secrets to files prefixed with `VITE_`.
- Maintain separate environment files for each stage (e.g., `.env.local` for dev, `.env.production` for builds) and avoid reusing production keys in local development.
- Paste the Supabase URL and anon key into `.env.local` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` respectively, then restart `pnpm dev` so Vite reloads the variables.
- The repository never commits real keys. Each contributor repeats these steps with their own Supabase project or shared credentials.

## Tooling Notes
- The app depends on `@supabase/supabase-js` for authentication and database access. Install dependencies with `pnpm install` if you pull fresh changes.
- All runtime environment variables exposed to the frontend must start with `VITE_`; add new ones to `src/env.d.ts` so TypeScript can help catch typos early.
