/**
 * Focused tests for the route guard that enforces Supabase authentication.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { RequireAuth } from './RequireAuth'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

vi.mock('@/app/providers/SupabaseAuthProvider', () => ({
  useSupabaseAuth: vi.fn(),
}))

const mockedUseSupabaseAuth = vi.mocked(useSupabaseAuth)

const ROUTER_FUTURE_FLAGS = {
  /**
   * Enabling the v7 behaviors keeps test routers aligned with the production instance so warnings stay hidden and we rehearse the next major release early.
   */
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

function renderWithRouter(
  routerConfig: Parameters<typeof createMemoryRouter>[0],
  options: Parameters<typeof createMemoryRouter>[1] = {},
) {
  const { future, ...rest } = options
  const mergedFuture = {
    ...ROUTER_FUTURE_FLAGS,
    ...(future ?? {}),
  }
  const router = createMemoryRouter(routerConfig, {
    ...rest,
    future: mergedFuture,
  })

  return render(<RouterProvider router={router} future={mergedFuture} />)
}

describe('RequireAuth', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading indicator while the session lookup is in flight', () => {
    mockedUseSupabaseAuth.mockReturnValue({
      client: null,
      session: null,
      isLoading: true,
      error: null,
      signOut: vi.fn(),
    })

    renderWithRouter([
      {
        path: '/',
        element: <RequireAuth />,
      },
    ])

    expect(screen.getByText(/checking your session/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated visitors to the login route', async () => {
    mockedUseSupabaseAuth.mockReturnValue({
      client: null,
      session: null,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
    })

    renderWithRouter(
      [
        {
          path: '/',
          element: <RequireAuth />,
          children: [{ index: true, element: <div>Private area</div> }],
        },
        { path: '/login', element: <div>Login screen</div> },
      ],
      { initialEntries: ['/'] },
    )

    await waitFor(() => {
      expect(screen.getByText(/login screen/i)).toBeInTheDocument()
    })
  })

  it('renders protected content when a session exists', async () => {
    mockedUseSupabaseAuth.mockReturnValue({
      client: null,
      session: { user: { email: 'coach@example.com' } } as Session,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
    })

    renderWithRouter(
      [
        {
          path: '/',
          element: <RequireAuth />,
          children: [{ index: true, element: <div>Private area</div> }],
        },
      ],
      { initialEntries: ['/'] },
    )

    await waitFor(() => {
      expect(screen.getByText(/private area/i)).toBeInTheDocument()
    })
  })
})
