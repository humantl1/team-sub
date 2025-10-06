import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Share the same `src` alias that Vite uses so tests resolve modules identically to the runtime bundle.
const projectRootDir = fileURLToPath(new URL('.', import.meta.url))

// The Vitest config mirrors our Vite setup so component tests compile JSX the same way as the app runtime.
export default defineConfig({
  plugins: [
    // Reuse the React plugin so Vitest can transform TSX with the exact same Babel pipeline as Vite.
    react(),
  ],
  resolve: {
    alias: {
      // Keep the Vitest module resolver in sync with the application so `@/` imports stay portable.
      '@': path.resolve(projectRootDir, 'src'),
    },
  },
  test: {
    // Vitest defaults to process isolation via child processes, which struggles in this sandboxed CLI.
    // Switching to the lighter thread pool keeps the execution model deterministic for this project.
    pool: 'threads',
    // jsdom gives us a headless DOM implementation that matches what React expects in the browser.
    environment: 'jsdom',
    // Loading the shared setup file keeps global matcher configuration in one location.
    setupFiles: './src/test/setup.ts',
    // Enabling globals means helpers like `describe` and `it` are auto-imported, matching common test ergonomics.
    globals: true,
    // Explicitly include src/**/*.test.{ts,tsx} so colocated tests run without extra globs later on.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
