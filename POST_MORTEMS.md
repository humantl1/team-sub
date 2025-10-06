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