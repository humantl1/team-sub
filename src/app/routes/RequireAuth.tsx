/**
 * Route guard that ensures the user is authenticated before rendering the requested child route.
 * Centralizing the logic here keeps individual pages focused on their own concerns.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

export function RequireAuth() {
  const { session, isLoading } = useSupabaseAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex w-full flex-1 items-center justify-center bg-slate-950 text-slate-100">
        <p className="rounded-full border border-slate-800/60 bg-slate-900/80 px-6 py-3 text-sm font-medium text-slate-300 shadow-inner shadow-black/30">
          Checking your session…
        </p>
      </div>
    )
  }

  if (!session) {
    /**
     * Redirect unauthenticated visitors to the login page. We stash the attempted location in the
     * router state so the login form could bounce them back after a successful sign-in later on.
     */
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
