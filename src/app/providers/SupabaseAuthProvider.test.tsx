/**
 * Regression tests for the SupabaseAuthProvider to ensure lifecycle edge cases are handled safely.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
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
  it('surfaces initialization errors when Supabase env vars are missing', async () => {
    const envError = new Error('VITE_SUPABASE_URL is not defined')
    mockGetSupabaseClient.mockImplementation(() => {
      throw envError
    })

    render(
      <SupabaseAuthProvider>
        <Consumer />
      </SupabaseAuthProvider>,
    )

    await waitFor(() => expect(screen.getByText(envError.message)).toBeInTheDocument())
  })

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

  it('hydrates the session state when Supabase reports an existing session', async () => {
    /**
     * We supply a minimal mock session so the provider can exercise its bootstrapping path the same
     * way it would during a real page refresh where Supabase already knows the user is signed in.
     */
    const mockSession = {
      access_token: 'fake-token',
      refresh_token: 'fake-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'user-123' } as unknown,
    } as unknown as Session

    const getSessionMock = vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null })

    const supabaseClientMock = createSupabaseClientMock({
      getSession: getSessionMock,
    })

    mockGetSupabaseClient.mockReturnValue(supabaseClientMock)

    function SessionConsumer() {
      const { session, isLoading } = useSupabaseAuth()
      return (
        <div>
          <span data-testid="loading-indicator">{isLoading ? 'loading' : 'idle'}</span>
          <span data-testid="session-user">{session?.user?.id ?? 'no-session'}</span>
        </div>
      )
    }

    render(
      <SupabaseAuthProvider>
        <SessionConsumer />
      </SupabaseAuthProvider>,
    )

    expect(screen.getByTestId('loading-indicator')).toHaveTextContent('loading')

    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toHaveTextContent('idle')
      expect(screen.getByTestId('session-user')).toHaveTextContent('user-123')
    })

    expect(getSessionMock).toHaveBeenCalledTimes(1)
  })

  it('clears the session when signOut succeeds', async () => {
    /**
     * The provider sets loading state while signOut is in flight, so the component below exposes a
     * button we can click to trigger the call and assertions against the derived context values.
     */
    const mockSession = {
      access_token: 'fake-token',
      refresh_token: 'fake-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'user-123' } as unknown,
    } as unknown as Session

    const signOutMock = vi.fn().mockResolvedValue({ error: null })

    mockGetSupabaseClient.mockReturnValue(
      createSupabaseClientMock({
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        signOut: signOutMock,
      }),
    )

    function SignOutConsumer() {
      const { session, isLoading, error, signOut } = useSupabaseAuth()
      return (
        <div>
          <button type="button" onClick={() => signOut()}>
            sign-out
          </button>
          <span data-testid="loading-indicator">{isLoading ? 'loading' : 'idle'}</span>
          <span data-testid="session-user">{session?.user?.id ?? 'no-session'}</span>
          <span data-testid="error-message">{error ?? 'no-error'}</span>
        </div>
      )
    }

    render(
      <SupabaseAuthProvider>
        <SignOutConsumer />
      </SupabaseAuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('session-user')).toHaveTextContent('user-123')
      expect(screen.getByTestId('loading-indicator')).toHaveTextContent('idle')
    })

    fireEvent.click(screen.getByRole('button', { name: /sign-out/i }))

    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toHaveTextContent('idle')
      expect(screen.getByTestId('session-user')).toHaveTextContent('no-session')
      expect(screen.getByTestId('error-message')).toHaveTextContent('no-error')
    })

    expect(signOutMock).toHaveBeenCalledTimes(1)
  })
})
