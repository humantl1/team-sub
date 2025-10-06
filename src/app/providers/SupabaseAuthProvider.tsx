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
  useState,
  type ReactNode,
} from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * Description of the values exposed by the auth context. We surface the raw
 * session alongside loading/error metadata so consuming components can render
 * appropriate fallbacks while the initial session check resolves.
 */
export interface SupabaseAuthContextValue {
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
  const [isLoading, setIsLoading] = useState(() => supabase !== null)
  const [error, setError] = useState<string | null>(clientError)

  useEffect(() => {
    if (!supabase) {
      /**
       * Without a Supabase client there is nothing to bootstrap. We still flip `isLoading` off so the
       * rest of the app can show the explanatory error captured above.
       */
      setIsLoading(false)
      return
    }

    let isMounted = true

    async function bootstrapSession() {
      setIsLoading(true)
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (sessionError) {
        // Persist a friendly error message so the login screen can surface it to the user.
        setError(sessionError.message)
        setSession(null)
      } else {
        setError(null)
        setSession(data.session ?? null)
      }

      setIsLoading(false)
    }

    void bootstrapSession()

    /**
     * Supabase emits auth events whenever magic links resolve, tokens refresh, or users sign out.
     * Subscribing here keeps the React state synchronized without polling.
     */
    const { data: listener, error: listenerError } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      },
    )

    if (listenerError && isMounted) {
      // Surface the subscription error so the login flow can signal configuration/network issues.
      setError(listenerError.message)
    }

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

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
    }

    setIsLoading(false)
  }, [supabase])

  const value: SupabaseAuthContextValue = {
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
