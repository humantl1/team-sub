import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { toAppError } from './error'
import { mapTeamRow } from './mappers'
import { teamDetailKey, teamsListKey } from './queryKeys'
import { TEAM_SELECT_COLUMNS, type TeamSelectRow } from './selects'
import type { AppError, InsertTeamPayload, TeamInsertRow, TeamRecord } from './types'

/**
 * Create a new team for the current user. Wrapping the Supabase insert inside a TanStack mutation
 * gives callers loading/error flags while letting us keep the teams list cached in sync.
 */
type CreateTeamMutationContext = {
  previousTeams: TeamRecord[] | undefined
}

export function useCreateTeamMutation(): UseMutationResult<
  TeamRecord,
  AppError,
  InsertTeamPayload,
  CreateTeamMutationContext
> {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  return useMutation<TeamRecord, AppError, InsertTeamPayload>({
    /**
     * Persist the new team to Supabase and return the mapped record. Supabase policies inject the
     * authenticated user id into `owner_id`, so the payload intentionally omits it.
     */
    mutationFn: async ({ name, sportId, notes = null }) => {
      const insertPayload: TeamInsertRow = {
        name,
        sport_id: sportId,
        // Supabase distinguishes between `null` and `undefined`, so we coerce here to avoid surprises.
        notes: notes ?? null,
      }

      const { data, error } = await supabase
        .from('teams')
        .insert(insertPayload)
        .select<TeamSelectRow>(TEAM_SELECT_COLUMNS)
        .single()

      if (error) {
        throw toAppError(error, 'Unable to create team. Please try again.')
      }

      return mapTeamRow(data)
    },
    /**
     * Stash the previous teams list so we can roll back if the network request fails. We intentionally
     * avoid optimistic insertion because we do not know the team id until Supabase responds.
     */
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: teamsListKey })

      const previousTeams = queryClient.getQueryData<TeamRecord[] | undefined>(teamsListKey)

      return { previousTeams }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTeams !== undefined) {
        queryClient.setQueryData(teamsListKey, context.previousTeams)
      } else {
        queryClient.removeQueries({ queryKey: teamsListKey })
      }
    },
    onSuccess: (newTeam) => {
      queryClient.setQueryData<TeamRecord[]>(teamsListKey, (existing = []) => [...existing, newTeam])
      queryClient.setQueryData(teamDetailKey(newTeam.id), newTeam)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamsListKey })
    },
  })
}
