import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Manual TypeScript projections mirroring the `teams` table. Until Supabase type generation is
 * wired up, these definitions act as a contract between our hooks and the database. The accompanying
 * tests cover a representative Supabase payload so schema changes fail loudly instead of silently
 * drifting out of sync.
 */
export type TeamRecord = {
  id: string
  ownerId: string
  sportId: string
  name: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Payload accepted by the create-team mutation. The backend sets `owner_id` automatically via RLS
 * policies, so callers only pass the user-provided metadata.
 */
export type InsertTeamPayload = {
  name: string
  sportId: string
  notes?: string | null
}

/**
 * Payload accepted by the update-team mutation. This leans on partial/optional properties so calling
 * screens can submit only the fields that changed during an edit session.
 */
export type UpdateTeamPayload = {
  teamId: string
  name?: string
  sportId?: string
  notes?: string | null
}

/**
 * Payload accepted by the delete-team mutation. Using an object instead of a bare string keeps the
 * mutation signature flexible should we introduce soft-delete flags or audit metadata later.
 */
export type DeleteTeamPayload = {
  teamId: string
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
