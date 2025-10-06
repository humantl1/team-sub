/**
 * Aggregates global React providers that should wrap the entire application.
 * Starting with the TanStack Query client keeps data fetching consistent
 * and gives us a single place to append future providers (Supabase session, theming, etc.).
 */
import type { ReactNode } from 'react'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  /**
   * Lazily instantiate the QueryClient once so React Query caches persist across rerenders.
   * We'll configure retry/warm cache defaults here as the API surface evolves.
   */
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
