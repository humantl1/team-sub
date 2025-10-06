# Post Mortem: Tailwind Visual Smoke Test

## Issues Encountered

### Tailwind CLI availability
- Initial install pulled Tailwind v4 beta, which no longer ships a local CLI binary, so `tailwindcss init -p` failed (`ENOENT`).
- Resolved by pinning Tailwind to the stable `3.4.17` release so the classic CLI lives under `node_modules/.bin/`.

### pnpm approve-builds friction
- Sandbox blocked esbuild’s postinstall hook and `pnpm approve-builds` required interactive confirmation.
- Documented the need for a manual approval and verified it once the user ran it locally.

### Legacy Vite CSS constraining layout
- The starter `body` flex/centering and `#root` width kept the Tailwind gradient from spanning the viewport, producing a left-aligned layout despite `w-full` utilities.
- Removed those legacy constraints in `src/styles/index.css`, allowing Tailwind to manage layout.

### Snapshot mismatch in visual test
- Inline snapshot failed because list numbering renders as nested DOM nodes.
- Replaced the heavy snapshot with targeted assertions against Tailwind utility class names and counts.
# Post Mortem: Supabase client + documentation gotchas

## Issues Encountered

### Incomplete gotcha coverage
- Initial Supabase scaffolding added env types and a singleton client, but documentation still contained sample code that re-created clients and lacked explicit testing guidance.
- Fix required auditing `AGENTS.md`, `README.md`, and `AGENT_NOTES.md` to align with the agreed gotchas (singleton usage, RLS emphasis, env separation, testing patterns).

### Documentation regression risk
- While updating `AGENTS.md`, an accidental overwrite nearly dropped large sections of existing guidance.
- Avoided by immediately reverting the file and applying targeted patches instead of wholesale rewrites.

### Supabase Vitest warning
- Vitest emits a "Multiple GoTrueClient instances" warning when tests intentionally create fresh clients.
- Added a follow-up checklist item to revisit the test setup (e.g., shared test client or stubbed auth module) to silence the warning without losing coverage.

## Lessons Learned / Action Items
- Always double-check long-form documentation edits with smaller patches to preserve project history and avoid unintentional deletions.
- Maintain a running checklist entry when TODO comments or warnings appear in output so they do not get lost after the immediate change merges.
- Next step: update Supabase-related tests to reuse a shared client or mock layer, eliminating the GoTrue warning.
