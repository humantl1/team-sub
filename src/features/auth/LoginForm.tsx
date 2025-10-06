/**
 * Magic link login form powered by Supabase.
 * This component intentionally lives in `features/auth` so it can grow alongside future
 * passwordless UX improvements (resend flows, allowlisted messaging, etc.).
 */
import { FormEvent, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSupabaseAuth } from '@/app/providers/SupabaseAuthProvider'

type SubmissionState = 'idle' | 'loading' | 'sent' | 'error'

export function LoginForm() {
  /**
   * Reading the shared auth context lets the form surface any bootstrap errors (e.g. bad env vars)
   * while reusing the session loading indicator so UI states stay consistent across the app.
   */
  const { isLoading: isSessionLoading, error: sessionError } = useSupabaseAuth()
  const supabase = useMemo(() => getSupabaseClient(), [])

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmissionState>('idle')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Empty email gets caught by the required attribute, but we guard here to keep TS happy during tests.
    if (!email) {
      return
    }

    setStatus('loading')
    setFeedbackMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      /**
       * Supabase needs to know where to redirect once the user clicks the magic link.
       * Using `window.location.origin` respects whatever host the app is running on (local dev,
       * preview deploys, or production) without hard-coding environment-specific URLs.
       */
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setStatus('error')
      setFeedbackMessage(error.message)
      return
    }

    setStatus('sent')
    setFeedbackMessage('Magic link sent! Check your inbox to finish signing in.')
  }

  const isSubmitting = status === 'loading'
  const disableForm = isSubmitting || isSessionLoading

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-describedby={sessionError ? 'login-session-error' : undefined}
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">Sign in via magic link</h1>
        <p className="text-sm text-slate-300">
          Enter the email address you used for the team roster. We send a single-use link that logs you in instantly.
        </p>
      </div>

      <label className="block space-y-2 text-left">
        <span className="text-sm font-medium text-slate-200">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={disableForm}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-base text-white shadow-inner shadow-black/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="coach@example.com"
        />
      </label>

      <button
        type="submit"
        disabled={disableForm}
        className="inline-flex w-full items-center justify-center rounded-full bg-purple-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {isSubmitting ? 'Sending magic link…' : 'Send magic link'}
      </button>

      <div className="space-y-2 text-sm text-slate-300">
        {sessionError && (
          <p id="login-session-error" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-200">
            {sessionError}
          </p>
        )}
        {status === 'sent' && feedbackMessage && (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200">
            {feedbackMessage}
          </p>
        )}
        {status === 'error' && feedbackMessage && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-200">
            {feedbackMessage}
          </p>
        )}
        {status === 'idle' && (
          <p className="text-xs text-slate-400">
            Pro tip: add `no-reply@mail.supabase.io` to your inbox safe senders so the link arrives instantly.
          </p>
        )}
      </div>
    </form>
  )
}
