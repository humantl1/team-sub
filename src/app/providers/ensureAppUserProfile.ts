import type { Session, SupabaseClient } from '@supabase/supabase-js'

const DISPLAY_NAME_MAX_LENGTH = 120
const PROFILE_SYNC_ERROR_PREFIX = 'Profile sync failed'

export type EnsureAppUserProfileResult =
  | { ok: true }
  | { ok: false; errorMessage: string }

export function sanitizeDisplayName(candidate: unknown): string | null {
  if (candidate === null || candidate === undefined) {
    return null
  }

  const coerced = String(candidate)
  /**
   * Strip ASCII control characters so malicious input cannot inject markup or break UI layout.
   * We trim after cleaning to avoid treating pure whitespace as a meaningful value.
   */
  const cleaned = coerced.replace(/[\u0000-\u001F\u007F]/g, '').trim()

  if (!cleaned) {
    return null
  }

  if (cleaned.length <= DISPLAY_NAME_MAX_LENGTH) {
    return cleaned
  }

  return cleaned.slice(0, DISPLAY_NAME_MAX_LENGTH)
}

export function deriveDisplayName(session: Session): string | null {
  const { user } = session
  const metadata = user.user_metadata ?? {}

  const candidates: unknown[] = [metadata.full_name, metadata.name, user.email]

  for (const candidate of candidates) {
    const sanitized = sanitizeDisplayName(candidate)
    if (sanitized) {
      return sanitized
    }
  }

  return null
}

export async function ensureAppUserProfile({
  supabase,
  authUserId,
  displayName,
}: {
  supabase: SupabaseClient
  authUserId: string
  displayName: string | null
}): Promise<EnsureAppUserProfileResult> {
  const payload: {
    auth_user_id: string
    display_name?: string
  } = {
    auth_user_id: authUserId,
  }

  if (displayName) {
    payload.display_name = displayName
  }

  try {
    const { error } = await supabase
      .from('app_users')
      .upsert(payload, { onConflict: 'auth_user_id' })

    if (error) {
      return {
        ok: false,
        errorMessage: `${PROFILE_SYNC_ERROR_PREFIX}: ${error.message}`,
      }
    }

    return { ok: true }
  } catch (caught) {
    const message =
      caught instanceof Error
        ? `${PROFILE_SYNC_ERROR_PREFIX}: ${caught.message}`
        : `${PROFILE_SYNC_ERROR_PREFIX}: Unknown error`

    return { ok: false, errorMessage: message }
  }
}

export function isProfileSyncError(message: string | null): boolean {
  return typeof message === 'string' && message.startsWith(PROFILE_SYNC_ERROR_PREFIX)
}

export const __internal = {
  DISPLAY_NAME_MAX_LENGTH,
  PROFILE_SYNC_ERROR_PREFIX,
}
