/**
 * Query key helper consolidating the cache namespaces used by the teams hooks. TanStack Query relies
 * on array-based keys, so centralizing them avoids typos while keeping cache invalidation consistent
 * across mutations.
 */
export const teamsListKey = ['teams'] as const

/**
 * Detail query keys accept a team id parameter and return a tuple scoped to that identifier. We use
 * a dedicated helper so the tests (and mutations) can assert referential stability easily.
 */
export const teamDetailKey = (teamId: string) => ['teams', teamId] as const
