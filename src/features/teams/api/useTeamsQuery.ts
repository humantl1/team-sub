import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { toAppError } from './error'
import { mapTeamRow } from './mappers'
import { teamsListKey } from './queryKeys'
import { TEAM_SELECT_COLUMNS, type TeamSelectResult } from './selects'
import type { AppError, TeamRecord } from './types'

/**
 * Fetch the authenticated user's teams from Supabase. The hook wraps TanStack Query so calling
 * components gain caching, background refetching, and consistent error handling out of the box.
 */
export function useTeamsQuery(): UseQueryResult<TeamRecord[], AppError> {
  const supabase = getSupabaseClient()

  return useQuery<TeamRecord[], AppError>({
    queryKey: teamsListKey,
    /**
     * Selecting explicit columns keeps the payload lean and ensures our manual type stays aligned
     * with Supabase schema expectations. Ordering by `created_at` gives a predictable card/list order.
     */
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select<TeamSelectResult>(TEAM_SELECT_COLUMNS)
        .order('created_at', { ascending: true })

      if (error) {
        throw toAppError(error, 'Unable to load teams. Please try again.')
      }

      return (data ?? []).map(mapTeamRow)
    },
  })
}

/**
 * Supabase infers column types from the database, but generics are not preserved once we pass through
 * the query builder. Using an alias keeps the select string readable while letting TypeScript
 * understand the shape coming back from `.select`.
 */
