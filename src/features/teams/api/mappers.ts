import type { Tables } from '@/lib/supabase.types'
import type { TeamRecord } from './types'

/**
 * Alias for the raw `teams` row returned by Supabase. Referencing the generated schema keeps this
 * helper aligned with the database without maintaining a parallel type definition manually.
 */
export type SupabaseTeamRow = Tables<'teams'>

/**
 * Convert a raw Supabase row into the strongly typed `TeamRecord` consumed by the rest of the app.
 * Having a dedicated function keeps the hooks tidy and makes it easier for tests to assert that the
 * mapping handles nullables correctly.
 */
export function mapTeamRow(row: SupabaseTeamRow): TeamRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    sportId: row.sport_id,
    name: row.name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
