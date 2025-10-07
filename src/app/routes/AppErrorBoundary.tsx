/**
 * Shared error boundary used by React Router when something inside a route throws.
 * Providing a custom boundary gives us room to keep UX consistent with the rest of the app while
 * still surfacing actionable diagnostics for developers working in local environments.
 */
import {
  isRouteErrorResponse,
  Link,
  useLocation,
  useRouteError,
} from 'react-router-dom'
import { useMemo } from 'react'
import { SupabaseConfigurationError } from '@/app/errors/SupabaseConfigurationError'

/**
 * Helper describing the bits of information we want to extract from whatever React Router hands us.
 * Doing the heavy lifting inside `useMemo` keeps the render tree tidy and isolates the branching logic
 * around different error shapes (HTTP-style responses vs generic exceptions).
 */
interface ErrorDetails {
  code: number
  title: string
  description: string
  developerMessage: string | null
  stackTrace: string | null
}

export function AppErrorBoundary() {
  const routeError = useRouteError()
  const location = useLocation()

  const { code, title, description, developerMessage, stackTrace } = useMemo<ErrorDetails>(() => {
    if (isRouteErrorResponse(routeError)) {
      /**
       * Route errors produced by loaders/actions often come through as HTTP-like responses. We surface
       * the status so the user gets a concrete error code while still mapping unknown statuses to
       * readable fallbacks.
       */
      const statusText = routeError.statusText || 'Unexpected routing error'
      const shortMessage = (() => {
        /**
         * React Router exposes the thrown `Response`'s body via `routeError.data`. Loaders frequently throw
         * plain strings (e.g., `throw new Response('Not found', { status: 404 })`) or JSON objects. We
         * normalize those possibilities so developers see the exact diagnostic that originated the error
         * instead of always falling back to the HTTP status text.
         */
        if (!routeError.data) {
          return statusText
        }

        if (typeof routeError.data === 'string') {
          return routeError.data
        }

        if (typeof routeError.data === 'object' && 'message' in routeError.data) {
          const message = (routeError.data as { message: unknown }).message

          if (typeof message === 'string' && message.trim().length > 0) {
            return message
          }
        }

        return statusText
      })()

      return {
        code: routeError.status,
        title: `${routeError.status} — ${statusText}`,
        description:
          'Sorry about that! The page had trouble loading. Try again or head back to the dashboard.',
        developerMessage: shortMessage,
        stackTrace: null,
      }
    }

    if (routeError instanceof SupabaseConfigurationError) {
      return {
        code: routeError.status,
        title: `${routeError.status} — ${routeError.statusText}`,
        description:
          'Supabase could not initialize because configuration values are missing. Update the environment variables and reload the app.',
        developerMessage: routeError.message,
        stackTrace: routeError.stack ?? null,
      }
    }

    if (routeError instanceof Error) {
      return {
        code: 500,
        title: '500 — Something went sideways',
        description:
          'We hit an unexpected issue while loading this screen. Reload the page or return to the dashboard.',
        developerMessage: routeError.message,
        stackTrace: routeError.stack ?? null,
      }
    }

    return {
      code: 500,
      title: '500 — Unknown error',
      description:
        'An unexpected condition prevented this page from rendering. Please try again in a moment.',
      developerMessage: typeof routeError === 'string' ? routeError : null,
      stackTrace: null,
    }
  }, [routeError])

  /**
   * Only expose the diagnostic content in development so production users never see stack traces or
   * sensitive error messages. Vite injects `import.meta.env.DEV` which aligns with our testing setup.
   */
  const showDiagnostics = import.meta.env.DEV

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-3xl space-y-8 rounded-3xl border border-red-500/40 bg-slate-900/80 p-10 shadow-2xl shadow-red-900/30">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-300/80">
            Error {code}
          </p>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-sm text-red-100/80">{description}</p>
        </header>

        <div className="space-y-2 text-left text-sm text-slate-200">
          <p>
            <span className="font-semibold text-red-200">Current route:</span> {location.pathname}
          </p>
          {showDiagnostics && developerMessage && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/15 p-4 text-xs text-red-100">
              <span className="block text-[0.7rem] font-semibold uppercase tracking-widest text-red-200/70">
                Developer details
              </span>
              {developerMessage}
            </p>
          )}
          {showDiagnostics && stackTrace && (
            <pre className="max-h-64 overflow-auto rounded-xl border border-red-500/30 bg-slate-950/70 p-4 text-xs leading-relaxed text-red-100">
              {stackTrace}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-red-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-red-500/40 transition hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload page
          </button>
          <Link
            to="/"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-red-400/60 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-red-100 transition hover:border-red-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
          >
            Return to dashboard
          </Link>
        </div>
      </section>
    </div>
  )
}
