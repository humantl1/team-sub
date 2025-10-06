/**
 * Tailwind configuration drives utility generation for the entire SPA.
 * We keep the file lightweight while documenting why each knob exists so future agents can tweak confidently.
 * Reference: https://tailwindcss.com/docs/configuration
 */
/** @type {import('tailwindcss').Config} */
export default {
  // Scan Vite's HTML entry point plus all TS/TSX modules so unused utilities get purged in production builds.
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Leaving this empty for now keeps Tailwind defaults intact; feature work can extend tokens when needed.
    extend: {},
  },
  // No plugins yet, but the array stays defined for quick expansion (forms/typography, etc.).
  plugins: [],
}
