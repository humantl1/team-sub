/**
 * Top-level layout for the application.
 * The goal is to centralize shared chrome (navigation, skip links, theming wrappers)
 * so feature routes can focus on domain-specific UI without recreating scaffolding.
 */
import { NavLink, Outlet } from 'react-router-dom'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

export function RootLayout() {
  /**
   * Reading auth state here lets the top navigation reflect the current user (email + sign-out button)
   * while still rendering immediately during the initial loading phase.
   */
  const { session, isLoading, signOut } = useSupabaseAuth()
  const userEmail = session?.user.email ?? null

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Skip link ensures keyboard users can bypass navigation chrome quickly. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-purple-600 focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-300/90">
            Team Sub Planner
          </span>
          <ul className="flex items-center gap-3 text-sm font-medium">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                      : 'text-slate-200 hover:text-white'
                  }`
                }
                end
              >
                Dashboard
              </NavLink>
            </li>
            {session ? (
              <li className="flex items-center gap-2">
                <span className="hidden text-xs uppercase tracking-widest text-slate-400 sm:inline">
                  {userEmail}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void signOut()
                  }}
                  disabled={isLoading}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-purple-400 hover:text-white disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing out…' : 'Sign out'}
                </button>
              </li>
            ) : (
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                        : 'text-slate-200 hover:text-white'
                    }`
                  }
                >
                  Login
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="flex flex-1">
        {/* Outlet renders the matched route. Individual routes handle their own layout details. */}
        <Outlet />
      </main>
    </div>
  )
}
