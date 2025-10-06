import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/LoginForm'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

/**
 * Login route renders the Supabase magic-link form and provides quick access to the dashboard when
 * a session already exists. Keeping the logic centralized makes future onboarding flows easier to extend.
 */
export function LoginRoute() {
  const { session, isLoading, signOut } = useSupabaseAuth()

  const userEmail = session?.user.email ?? 'your account'

  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-2xl shadow-purple-900/25">
        {session ? (
          <div className="space-y-4 text-center">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">
                You are signed in
              </p>
              <h1 className="text-2xl font-semibold text-white">Welcome back, {userEmail}</h1>
            </header>
            <p className="text-sm text-slate-300">
              Head to the dashboard to manage your roster or sign out if you meant to switch accounts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-purple-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-400"
              >
                Go to dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  void signOut()
                }}
                disabled={isLoading}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-purple-400 hover:text-white disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        ) : (
          <LoginForm />
        )}
      </section>
    </div>
  )
}
