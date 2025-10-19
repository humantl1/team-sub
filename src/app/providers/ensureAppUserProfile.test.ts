import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import {
  __internal,
  deriveDisplayName,
  ensureAppUserProfile,
  isProfileSyncError,
  sanitizeDisplayName,
} from './ensureAppUserProfile'

function createSupabaseStub() {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ upsert })

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    upsert,
  }
}

function buildSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    access_token: 'token',
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    provider_token: null,
    provider_refresh_token: null,
    user: {
      id: 'user-123',
      aud: 'authenticated',
      created_at: new Date(0).toISOString(),
      app_metadata: {},
      user_metadata: {},
      ...overrides,
    },
  }
}

describe('sanitizeDisplayName', () => {
  it('returns null when candidate is nullish or only whitespace', () => {
    expect(sanitizeDisplayName(null)).toBeNull()
    expect(sanitizeDisplayName(undefined)).toBeNull()
    expect(sanitizeDisplayName('   ')).toBeNull()
  })

  it('strips control characters, trims whitespace, and coerces to string', () => {
    expect(sanitizeDisplayName('\u0007  Taylor\n')).toBe('Taylor')
    expect(sanitizeDisplayName(12345)).toBe('12345')
  })

  it('clamps display names to the configured maximum length', () => {
    const longName = 'a'.repeat(__internal.DISPLAY_NAME_MAX_LENGTH + 50)
    const sanitized = sanitizeDisplayName(longName)
    expect(sanitized).toHaveLength(__internal.DISPLAY_NAME_MAX_LENGTH)
  })
})

describe('deriveDisplayName', () => {
  it('prefers metadata full_name, then name, then email', () => {
    const session = buildSession({
      user_metadata: { full_name: 'Coach Taylor', name: 'Backup Name' },
      email: 'coach@example.com',
    })

    expect(deriveDisplayName(session)).toBe('Coach Taylor')

    const sessionWithoutFullName = buildSession({
      user_metadata: { name: 'Fallback Coach' },
      email: 'coach@example.com',
    })
    expect(deriveDisplayName(sessionWithoutFullName)).toBe('Fallback Coach')

    const sessionWithEmailOnly = buildSession({
      user_metadata: {},
      email: 'coach@example.com',
    })
    expect(deriveDisplayName(sessionWithEmailOnly)).toBe('coach@example.com')
  })

  it('returns null when no candidate survives sanitization', () => {
    const session = buildSession({
      user_metadata: { full_name: '   ' },
      email: undefined,
    })

    expect(deriveDisplayName(session)).toBeNull()
  })
})

describe('ensureAppUserProfile', () => {
  it('upserts only auth_user_id when no display name is provided', async () => {
    const { client, from, upsert } = createSupabaseStub()

    const result = await ensureAppUserProfile({
      supabase: client,
      authUserId: 'user-123',
      displayName: null,
    })

    expect(result).toEqual({ ok: true })
    expect(from).toHaveBeenCalledWith('app_users')
    expect(upsert).toHaveBeenCalledWith(
      { auth_user_id: 'user-123' },
      { onConflict: 'auth_user_id' },
    )
  })

  it('includes display_name when provided', async () => {
    const { client, upsert } = createSupabaseStub()

    await ensureAppUserProfile({
      supabase: client,
      authUserId: 'user-123',
      displayName: 'Coach Taylor',
    })

    expect(upsert).toHaveBeenCalledWith(
      { auth_user_id: 'user-123', display_name: 'Coach Taylor' },
      { onConflict: 'auth_user_id' },
    )
  })

  it('returns an error result when Supabase reports a failure', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'duplicate key' } })
    const from = vi.fn().mockReturnValue({ upsert })
    const client = { from } as unknown as SupabaseClient

    const result = await ensureAppUserProfile({
      supabase: client,
      authUserId: 'user-123',
      displayName: null,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorMessage).toMatch(/duplicate key/)
    }
  })

  it('returns a friendly error message when an unexpected exception is thrown', async () => {
    const upsert = vi.fn().mockRejectedValue(new Error('network down'))
    const from = vi.fn().mockReturnValue({ upsert })
    const client = { from } as unknown as SupabaseClient

    const result = await ensureAppUserProfile({
      supabase: client,
      authUserId: 'user-123',
      displayName: null,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorMessage).toMatch(/network down/)
    }
  })
})

describe('isProfileSyncError', () => {
  it('matches errors emitted by ensureAppUserProfile', () => {
    expect(isProfileSyncError('Profile sync failed: duplicate key')).toBe(true)
    expect(isProfileSyncError('something else')).toBe(false)
    expect(isProfileSyncError(null)).toBe(false)
  })
})
