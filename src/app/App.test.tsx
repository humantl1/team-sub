/**
 * Smoke test validating that the router, layout, and Tailwind showcase render together without regressions.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, vi } from 'vitest'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  }),
}))

// App must be imported after the supabase helper is mocked so the provider picks up the stub.
import App from './App'

let activeSession: Session

function createSessionStub(): Session {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    provider_token: null,
    provider_refresh_token: null,
    user: {
      id: 'user-123',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'coach@example.com',
      email_confirmed_at: new Date(now * 1000).toISOString(),
      confirmed_at: new Date(now * 1000).toISOString(),
      invited_at: null,
      phone: null,
      phone_confirmed_at: null,
      last_sign_in_at: new Date(now * 1000).toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      factors: null,
      created_at: new Date(now * 1000).toISOString(),
      updated_at: new Date(now * 1000).toISOString(),
    },
  } as unknown as Session
}

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key')

  activeSession = createSessionStub()

  mockGetSession.mockResolvedValue({ data: { session: activeSession }, error: null })
  mockSignOut.mockResolvedValue({ error: null })
  mockOnAuthStateChange.mockImplementation((callback: (event: string, session: Session | null) => void) => {
    callback('SIGNED_IN', activeSession)
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('App', () => {
  it('renders the routed Tailwind showcase with navigation chrome', async () => {
    const { container } = render(<App />)

    expect(await screen.findByText(/team sub planner/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByText(activeSession.user.email ?? '')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main-content',
    )

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')

    await waitFor(() => {
      const gradientWrapper = main.querySelector('div.bg-gradient-to-br')
      if (!gradientWrapper) {
        throw new Error('Expected the Tailwind gradient wrapper to mount inside the main outlet')
      }
      expect(gradientWrapper).toHaveClass('flex')
      expect(gradientWrapper).toHaveClass('w-full')
    })

    expect(
      await screen.findByRole('heading', { level: 1, name: /team substitutions sandbox/i }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { level: 2, name: /starters on the field/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /bench ready to rotate/i })).toBeInTheDocument()

    const showcaseSection = container.querySelector('section')
    if (!showcaseSection) {
      throw new Error('Expected the Tailwind showcase section to be in the document')
    }

    const rosterLists = within(showcaseSection).getAllByRole('list')
    expect(rosterLists).toHaveLength(2)

    const playerItems = rosterLists.flatMap((list) => within(list).getAllByRole('listitem'))
    expect(playerItems).toHaveLength(8)

    const pulseButton = screen.getByRole('button', { name: /pulse gradient/i })
    expect(pulseButton).toHaveClass('bg-purple-500')

    expect(showcaseSection).toHaveClass(
      'rounded-3xl',
      'bg-slate-900/70',
      'border-slate-800/80',
      'backdrop-blur',
    )

    const gridWrapper = showcaseSection.querySelector('div.grid')
    if (!gridWrapper) {
      throw new Error('Expected the starter/bench grid to render')
    }
    expect(gridWrapper).toHaveClass('md:grid-cols-2')

    const accentCard = showcaseSection.querySelector('footer')
    if (!accentCard) {
      throw new Error('Expected the accent footer to render')
    }
    expect(accentCard).toHaveClass('bg-purple-500/10')
  })
})
