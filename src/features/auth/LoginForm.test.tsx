/**
 * Tests for the Supabase magic-link login form. We mock the auth context and Supabase client so the
 * component can be exercised without hitting the network.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { LoginForm } from './LoginForm'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

vi.mock('@/app/providers/SupabaseAuthProvider', () => ({
  useSupabaseAuth: vi.fn(),
}))

const mockedUseSupabaseAuth = vi.mocked(useSupabaseAuth)

function createSupabaseSignInMock() {
  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  }
}

function buildAuthContext(overrides: Partial<ReturnType<typeof useSupabaseAuth>> = {}) {
  const supabase = createSupabaseSignInMock() as unknown as SupabaseClient
  return {
    client: supabase,
    session: null,
    isLoading: false,
    error: null,
    signOut: vi.fn(),
    ...overrides,
  }
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockedUseSupabaseAuth.mockReturnValue(buildAuthContext())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the email input and idle guidance', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
    expect(screen.getByText(/pro tip/i)).toBeInTheDocument()
  })

  it('sends a magic link and shows confirmation when Supabase succeeds', async () => {
    const authContext = buildAuthContext()
    mockedUseSupabaseAuth.mockReturnValue(authContext)
    const supabase = authContext.client!

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'coach@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /send magic link/i }).closest('form')!)

    await waitFor(() => expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(1))

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'coach@example.com',
      options: { emailRedirectTo: window.location.origin },
    })

    expect(screen.getByText(/magic link sent/i)).toBeInTheDocument()
  })

  it('surfaces Supabase errors to the user', async () => {
    const authContext = buildAuthContext()
    authContext.client!.auth.signInWithOtp.mockResolvedValue({
      data: null,
      error: { message: 'Allowlist required.' },
    })
    mockedUseSupabaseAuth.mockReturnValue(authContext)

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'blocked@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /send magic link/i }).closest('form')!)

    await waitFor(() => expect(authContext.client!.auth.signInWithOtp).toHaveBeenCalledTimes(1))

    expect(screen.getByText(/allowlist required/i)).toBeInTheDocument()
  })

  it('disables submissions and surfaces the provider error when the Supabase client is unavailable', () => {
    mockedUseSupabaseAuth.mockReturnValue(
      buildAuthContext({ client: null, error: 'VITE_SUPABASE_URL is not defined.' }),
    )

    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/VITE_SUPABASE_URL is not defined/i)).toBeInTheDocument()
  })
})
