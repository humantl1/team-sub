/**
 * Entry point for the Vite-powered React SPA.
 * Keeping this file tiny makes it easier to verify the tooling stack before we start layering providers.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Load Tailwind's generated layers first so our temporary legacy CSS can override specific widgets as needed.
import '@/styles/tailwind.css'
import '@/styles/index.css'
import App from '@/app/App'

// React 18 `createRoot` mounts once so we can add providers without remounting in tests.
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element missing in index.html; Vite scaffold assumptions broken.')
}

createRoot(rootElement).render(
  // StrictMode helps surface side-effect issues early during development. It does not run in production builds.
  <StrictMode>
    <App />
  </StrictMode>,
)
