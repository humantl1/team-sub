/**
 * Central Prettier configuration so every formatter run (CLI, editor, lint-staged) produces the same output.
 * The settings lean on defaults while encoding a couple of opinionated choices we discussed in AGENTS.md.
 */
module.exports = {
  // Keep semicolons; they play nicely with rapid refactors and avoid ASI edge cases.
  semi: true,
  // Double quotes mirror the teaching materials we're referencing and align with JSX expectations.
  singleQuote: false,
  // Trailing commas make diffs smaller when adding new props or parameters.
  trailingComma: 'all',
}
