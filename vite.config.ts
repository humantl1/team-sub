import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Resolve the project root so we can construct stable aliases even when the config executes from pnpm's virtual store.
const projectRootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the `@/*` TypeScript path mapping so bundler and editor agree on import semantics.
      '@': path.resolve(projectRootDir, 'src'),
    },
  },
})
