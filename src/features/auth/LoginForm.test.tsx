/**
 * Tests for the Supabase magic-link login form. We mock the auth context and Supabase client so the
 * component can be exercised without hitting the network.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { LoginForm } from './LoginForm'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'
import { getSupabaseClient } from '@/lib/supabase'

vi.mock('@/app/providers/SupabaseAuthProvider', () => ({
  useSupabaseAuth: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}))

const mockedUseSupabaseAuth = vi.mocked(useSupabaseAuth)
const mockedGetSupabaseClient = vi.mocked(getSupabaseClient)

function createSupabaseSignInMock() {
  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  }
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockedUseSupabaseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
    })

    mockedGetSupabaseClient.mockReturnValue(
      createSupabaseSignInMock() as unknown as SupabaseClient,
    )
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
    const supabase = createSupabaseSignInMock()
    mockedGetSupabaseClient.mockReturnValue(supabase as unknown as SupabaseClient)

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
    const supabase = createSupabaseSignInMock()
    supabase.auth.signInWithOtp.mockResolvedValue({
      data: null,
      error: { message: 'Allowlist required.' },
    })
    mockedGetSupabaseClient.mockReturnValue(supabase as unknown as SupabaseClient)

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'blocked@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /send magic link/i }).closest('form')!)

    await waitFor(() => expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(1))

    expect(screen.getByText(/allowlist required/i)).toBeInTheDocument()
  })
})
