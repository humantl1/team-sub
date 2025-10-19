import { useMemo } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { toAppError } from './error'
import { mapTeamRow } from './mappers'
import { teamDetailKey } from './queryKeys'
import { TEAM_SELECT_COLUMNS, type TeamSelectRow } from './selects'
import type { AppError, TeamRecord } from './types'

/**
 * Fetch a single team by its identifier. The hook accepts `null` to accommodate router params that
 * resolve asynchronously; the TanStack `enabled` flag prevents accidental Supabase calls until a
 * concrete id is available.
 */
export function useTeamQuery(teamId: string | null): UseQueryResult<TeamRecord | null, AppError> {
  const supabase = getSupabaseClient()

  /**
   * Deriving the query key inside `useMemo` guarantees stable references between renders, which keeps
   * TanStack Query cache hits predictable and avoids unnecessary network calls.
   */
  const queryKey = useMemo(
    () => (teamId ? teamDetailKey(teamId) : ['teams', 'detail', 'missing'] as const),
    [teamId],
  )

  return useQuery<TeamRecord | null, AppError>({
    queryKey,
    enabled: Boolean(teamId),
    /**
     * When the hook runs (only once a truthy id exists), we fetch the matching team and map the row
     * into our camelCased client shape. Using `.maybeSingle()` cleanly represents "not found" without
     * throwing, letting callers distinguish missing data from hard errors.
     */
    queryFn: async () => {
      if (!teamId) {
        // Defensive guard; with `enabled: false` this should never run, but the check keeps TypeScript happy.
        return null
      }

      const { data, error } = await supabase
        .from('teams')
        .select<TeamSelectRow>(TEAM_SELECT_COLUMNS)
        .eq('id', teamId)
        .maybeSingle()

      if (error) {
        throw toAppError(error, 'Unable to load team details. Please try again.')
      }

      return data ? mapTeamRow(data) : null
    },
  })
}
