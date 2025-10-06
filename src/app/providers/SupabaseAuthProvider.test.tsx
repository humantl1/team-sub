/**
 * Regression tests for the SupabaseAuthProvider to ensure lifecycle edge cases are handled safely.
 */
import { render, screen, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, vi } from 'vitest'
import { SupabaseAuthProvider, useSupabaseAuth } from './SupabaseAuthProvider'
import { getSupabaseClient } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}))

const mockGetSupabaseClient = vi.mocked(getSupabaseClient)

function createSupabaseClientMock(overrides: Partial<SupabaseClient['auth']> = {}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  } as unknown as SupabaseClient
}

function Consumer() {
  const { error } = useSupabaseAuth()
  return <div>{error ?? 'no-error'}</div>
}

beforeEach(() => {
  mockGetSupabaseClient.mockReturnValue(createSupabaseClientMock())
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SupabaseAuthProvider', () => {
  it('skips unsubscribe when the auth listener fails to initialize', async () => {
    const listenerError = new Error('listener failed')

    mockGetSupabaseClient.mockReturnValue(
      createSupabaseClientMock({
        onAuthStateChange: vi.fn().mockReturnValue({ data: null, error: listenerError }),
      }),
    )

    const result = render(
      <SupabaseAuthProvider>
        <Consumer />
      </SupabaseAuthProvider>,
    )

    await waitFor(() => expect(screen.getByText(listenerError.message)).toBeInTheDocument())

    expect(() => result.unmount()).not.toThrow()
  })
})
