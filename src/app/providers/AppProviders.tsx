/**
 * Aggregates global React providers that should wrap the entire application.
 * TanStack Query gives us request caching while the Supabase auth provider exposes
 * the current session to each route and component.
 */
import type { ReactNode } from 'react'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SupabaseAuthProvider } from '@/app/providers/SupabaseAuthProvider'

export interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  /**
   * Lazily instantiate the QueryClient once so React Query caches persist across rerenders.
   * We'll configure retry/warm cache defaults here as the API surface evolves.
   */
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
    </QueryClientProvider>
  )
}
