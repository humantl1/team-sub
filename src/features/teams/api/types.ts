import type { PostgrestError } from '@supabase/supabase-js'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase.types'

/**
 * Supabase's generated typings give us the authoritative schema for the `teams` table. Creating a
 * local alias makes the rest of this module easier to read while guaranteeing we stay aligned with
 * the database whenever `supabase gen types` runs.
 */
type TeamTableRow = Tables<'teams'>

/**
 * Payload accepted by the create-team mutation. The backend sets `owner_id` automatically via RLS
 * policies, so callers only pass the user-provided metadata.
 */
export type InsertTeamPayload = {
  name: TeamTableRow['name']
  sportId: TeamTableRow['sport_id']
  notes?: TeamTableRow['notes']
}

/**
 * Payload accepted by the update-team mutation. This leans on partial/optional properties so calling
 * screens can submit only the fields that changed during an edit session.
 */
export type UpdateTeamPayload = {
  teamId: TeamTableRow['id']
  name?: TeamTableRow['name']
  sportId?: TeamTableRow['sport_id']
  notes?: TeamTableRow['notes']
}

/**
 * Payload accepted by the delete-team mutation. Using an object instead of a bare string keeps the
 * mutation signature flexible should we introduce soft-delete flags or audit metadata later.
 */
export type DeleteTeamPayload = {
  teamId: TeamTableRow['id']
}

/**
 * Normalized application error used across the teams hooks. Wrapping Supabase's `PostgrestError`
 * keeps the UI (and tests) focused on actionable strings while still preserving the raw cause for
 * debugging when needed.
 */
export type AppError = {
  message: string
  cause?: PostgrestError | Error
}

/**
 * Domain-friendly representation of the `teams` row. Keeping camelCase properties in the React
 * layer avoids leaking database naming conventions into UI components while still relying on the
 * generated Supabase types for the underlying field definitions.
 */
export type TeamRecord = {
  id: TeamTableRow['id']
  ownerId: TeamTableRow['owner_id']
  sportId: TeamTableRow['sport_id']
  name: TeamTableRow['name']
  notes: TeamTableRow['notes']
  createdAt: TeamTableRow['created_at']
  updatedAt: TeamTableRow['updated_at']
}

/**
 * Type helpers for working with Supabase mutations. Rather than recreating insert/update shapes by
 * hand we can lean on Supabase's generated utilities and omit server-managed columns.
 */
export type TeamInsertRow = Omit<TablesInsert<'teams'>, 'owner_id' | 'created_at' | 'updated_at'>
export type TeamUpdateRow = TablesUpdate<'teams'>
