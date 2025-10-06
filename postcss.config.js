/**
 * PostCSS processes our global styles before Vite serves them.
 * Tailwind expands utility classes while Autoprefixer ensures browser compatibility without us hand-writing vendor prefixes.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
