/**
 * Temporary login screen placeholder.
 * We will replace this with the Supabase magic-link form once the auth flow is ready.
 */
export function LoginRoute() {
  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-md space-y-4 rounded-3xl border border-slate-800/70 bg-slate-900/80 p-8 shadow-2xl shadow-purple-900/25">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-300/90">
            Coming Soon
          </p>
          <h1 className="text-2xl font-semibold text-white">Login placeholder</h1>
        </header>
        <p className="text-sm text-slate-300">
          The Supabase-powered authentication flow will land in the next milestone.
          Once implemented, this route will render the magic link request form and session status messaging.
        </p>
      </section>
    </div>
  )
}
