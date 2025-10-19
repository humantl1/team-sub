import type { SupabaseTeamRow } from './mappers'

/**
 * Centralized list of columns selected from Supabase. By keeping the projection in one place we
 * reduce the chances of forgetting to update multiple strings when the schema changes.
 */
export const TEAM_SELECT_COLUMNS =
  'id, owner_id, sport_id, name, notes, created_at, updated_at' as const

/**
 * Alias representing the array Supabase returns when querying the teams table with the projection
 * above. Exporting the type simplifies the generics passed to `.select` across the hooks.
 */
export type TeamSelectResult = SupabaseTeamRow[]

/**
 * Alias for a single row using the shared projection. Helpful for `.single()` or `.maybeSingle()`
 * calls that return one record instead of an array.
 */
export type TeamSelectRow = SupabaseTeamRow
