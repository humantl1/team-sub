/**
 * Regression tests for `RootLayout`. These focus on the behaviour around Supabase bootstrap failures so we
 * can guarantee the router error boundary renders instead of the partially-disabled login form.
 */
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RootLayout } from './RootLayout'
import { AppErrorBoundary } from '@/app/routes/AppErrorBoundary'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

vi.mock('@/app/providers/SupabaseAuthProvider', () => ({
  useSupabaseAuth: vi.fn(),
}))

const mockedUseSupabaseAuth = vi.mocked(useSupabaseAuth)

function renderRootLayout() {
  /**
   * We mirror the production router shape: RootLayout owns the `errorElement`, so throwing a response from
   * inside the layout should land in `AppErrorBoundary`. Using `createMemoryRouter` keeps the test isolated
   * from global history state.
   */
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <RootLayout />,
        errorElement: <AppErrorBoundary />,
      },
    ],
    { initialEntries: ['/'] },
  )

  return render(<RouterProvider router={router} />)
}

describe('RootLayout', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('escalates Supabase bootstrap failures to the router error boundary', async () => {
    const envError = 'VITE_SUPABASE_URL is not defined. Add it to your .env.local before running the app.'

    mockedUseSupabaseAuth.mockReturnValue({
      client: null,
      error: envError,
      session: null,
      isLoading: false,
      signOut: vi.fn(),
    })

    renderRootLayout()

    expect(await screen.findByText(/Supabase configuration error/i)).toBeInTheDocument()
    expect(screen.getByText(envError)).toBeInTheDocument()
  })

  it('falls back to a generic error message when the provider surfaces no diagnostics', async () => {
    mockedUseSupabaseAuth.mockReturnValue({
      client: null,
      error: null,
      session: null,
      isLoading: false,
      signOut: vi.fn(),
    })

    renderRootLayout()

    expect(await screen.findByText(/Supabase configuration error/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Supabase client unavailable/i).length).toBeGreaterThan(0)
  })
})
