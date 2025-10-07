/**
 * Focused tests for the route guard that enforces Supabase authentication.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { RequireAuth } from './RequireAuth'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

vi.mock('@/app/providers/SupabaseAuthProvider', () => ({
  useSupabaseAuth: vi.fn(),
}))

const mockedUseSupabaseAuth = vi.mocked(useSupabaseAuth)

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

    render(
      <MemoryRouter>
        <RequireAuth />
      </MemoryRouter>,
    )

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

    const router = createMemoryRouter(
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

    render(<RouterProvider router={router} />)

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

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <RequireAuth />,
          children: [{ index: true, element: <div>Private area</div> }],
        },
      ],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText(/private area/i)).toBeInTheDocument()
    })
  })
})
