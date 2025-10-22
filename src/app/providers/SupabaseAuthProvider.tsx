/**
 * React context providing the authenticated Supabase session to the rest of the app.
 * Centralizing the session wiring keeps auth logic out of page components and
 * ensures every consumer reads from the same source of truth.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import {
  deriveDisplayName,
  ensureAppUserProfile,
  isProfileSyncError,
} from './ensureAppUserProfile'

/**
 * Description of the values exposed by the auth context. We surface the raw
 * session alongside loading/error metadata so consuming components can render
 * appropriate fallbacks while the initial session check resolves.
 */
export interface SupabaseAuthContextValue {
  /**
   * The memoized Supabase client instance. This is `null` when environment variables are missing or
   * the client failed to bootstrap, allowing consumers (like the login form) to short-circuit their
   * interactions instead of crashing.
   */
  client: SupabaseClient | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null)

export interface SupabaseAuthProviderProps {
  children: ReactNode
}

interface SupabaseClientState {
  client: SupabaseClient | null
  clientError: string | null
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  /**
   * Attempt to initialize the Supabase client a single time. When required environment variables
   * are missing we capture the failure instead of throwing so the UI can render a helpful message
   * instead of a blank screen.
   */
  const { client: supabase, clientError } = useMemo<SupabaseClientState>(() => {
    try {
      return { client: getSupabaseClient(), clientError: null }
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Failed to initialize Supabase. Check your environment variables.'

      return { client: null, clientError: message }
    }
  }, [])

  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(() => supabase !== null ? true : false)
  const [error, setError] = useState<string | null>(clientError)
  const lastProfileSyncSignatureRef = useRef<string | null>(null)
  const isMountedRef = useRef(false)

  const syncProfileIfNeeded = useCallback(
    async (nextSession: Session | null) => {
      if (!supabase) {
        return
      }

      if (!nextSession) {
        lastProfileSyncSignatureRef.current = null
        setError((current) => (isProfileSyncError(current) ? null : current))
        return
      }

      const displayName = deriveDisplayName(nextSession)
      const signature = `${nextSession.user.id}:${displayName ?? ''}`

      if (lastProfileSyncSignatureRef.current === signature) {
        return
      }

      const result = await ensureAppUserProfile({
        supabase,
        authUserId: nextSession.user.id,
        displayName,
      })

      if (!isMountedRef.current) {
        return
      }

      if (!result.ok) {
        setError(result.errorMessage)
        return
      }

      lastProfileSyncSignatureRef.current = signature
      setError((current) => (isProfileSyncError(current) ? null : current))
    },
    [supabase],
  )

  useEffect(() => {
    if (!supabase) {
      /**
       * Without a Supabase client there is nothing to bootstrap. We still flip `isLoading` off so the
       * rest of the app can show the explanatory error captured above.
       */
      setIsLoading(false)
      return
    }

    isMountedRef.current = true

    async function bootstrapSession() {
      setIsLoading(true)

      let data: { session: Session | null } | null = null
      let sessionError: Error | null = null

      try {
        const response = await supabase.auth.getSession()
        data = response.data
        sessionError = response.error
      } catch (caught) {
        sessionError = caught instanceof Error ? caught : new Error('Failed to fetch session')
      }

      if (!isMountedRef.current) {
        return
      }

      if (sessionError) {
        setError(sessionError.message)
        setSession(null)
        void syncProfileIfNeeded(null)
        setIsLoading(false)
        return
      }

      const nextSession = data?.session ?? null

      setError(null)
      setSession(nextSession)
      void syncProfileIfNeeded(nextSession)
      setIsLoading(false)
    }

    void bootstrapSession()

    /**
     * Supabase emits auth events whenever magic links resolve, tokens refresh, or users sign out.
     * Subscribing here keeps the React state synchronized without polling.
     */
    const { data: listener, error: listenerError } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession) => {
        if (!isMountedRef.current) {
          return
        }

        setSession(nextSession)

        if (event === 'SIGNED_OUT' || !nextSession) {
          void syncProfileIfNeeded(null)
          return
        }

        void syncProfileIfNeeded(nextSession)
      },
    )

    if (listenerError && isMountedRef.current) {
      // Surface the subscription error so the login flow can signal configuration/network issues.
      setError(listenerError.message)
    }

    return () => {
      listener?.subscription.unsubscribe()
      isMountedRef.current = false
    }
  }, [supabase, syncProfileIfNeeded])

  /**
   * Tiny helper that wraps `supabase.auth.signOut` so consumers do not have to import the client.
   * We update local state pessimistically because `onAuthStateChange` will fire a second time to
   * confirm the sign-out succeeded.
   */
  const signOut = useCallback(async () => {
    if (!supabase) {
      setError('Supabase client is unavailable, so there is no active session to sign out from.')
      return
    }

    setIsLoading(true)
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)
    } else {
      setError(null)
      setSession(null)
      lastProfileSyncSignatureRef.current = null
    }

    setIsLoading(false)
  }, [supabase])

  const value: SupabaseAuthContextValue = {
    client: supabase,
    session,
    isLoading,
    error,
    signOut,
  }

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>
}

/**
 * Convenience hook so components can read the session without dealing with `useContext` boilerplate.
 * We throw eagerly if the provider is missing to make setup errors obvious during development.
 */
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)

  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }

  return context
}
