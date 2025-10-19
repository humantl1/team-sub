import type { TeamRecord } from './types'

/**
 * Shape returned by Supabase when selecting from the `teams` table. The query hooks call this helper
 * so the rest of the app can consume camelCased properties without leaking database naming
 * conventions into UI components or tests.
 */
export type SupabaseTeamRow = {
  id: string
  owner_id: string
  sport_id: string
  name: string
  notes: string | null
  created_at: string
  updated_at: string
}

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
