import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

// Derive a flat-config-friendly version of the jsx-a11y preset by wiring the plugin object explicitly
// and reusing its recommended rule map. The original preset still ships legacy keys (parserOptions, etc.),
// so attempting to spread it directly under ESLint 9 flat config throws parserOptions/plugins errors.
const jsxA11yFlatConfig = {
  plugins: {
    'jsx-a11y': jsxA11y,
  },
  rules: jsxA11y.configs.recommended.rules,
}

export default defineConfig([
  // Ignore generated output so lint runs stay focused on authored code.
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      // Target modern browser globals since this project ships as a Vite SPA.
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        // Explicitly enable JSX syntax so rule metadata (like jsx-a11y) understands the file shape.
        ecmaFeatures: { jsx: true },
      },
    },
    extends: [
      // Start from the core JavaScript rules so we catch language-level mistakes.
      js.configs.recommended,
      // Layer in TypeScript-specific static analysis without requiring type-aware linting yet.
      tseslint.configs.recommended,
      // React hooks rules guard against common misuse (missing deps, etc.).
      reactHooks.configs['recommended-latest'],
      // Keep hot-module-refresh friendly patterns aligned with Vite defaults.
      reactRefresh.configs.vite,
      // Enforce accessible markup primitives early using the reconstructed flat config above.
      jsxA11yFlatConfig,
      // Disable stylistic rules that conflict with Prettier so formatting stays deterministic.
      eslintConfigPrettier,
    ],
  },
])
