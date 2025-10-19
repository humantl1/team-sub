import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { toAppError } from './error'
import { teamDetailKey, teamsListKey } from './queryKeys'
import type { AppError, DeleteTeamPayload, TeamRecord } from './types'

/**
 * Delete a team and evict it from the local caches. Hard deletes are acceptable for the current
 * milestone; we can revisit soft-delete semantics once analytics/history features arrive.
 */
export function useDeleteTeamMutation(): UseMutationResult<void, AppError, DeleteTeamPayload> {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  return useMutation<void, AppError, DeleteTeamPayload>({
    mutationFn: async ({ teamId }) => {
      const { error } = await supabase.from('teams').delete().eq('id', teamId)

      if (error) {
        throw toAppError(error, 'Unable to delete team. Please try again.')
      }
    },
    onMutate: async ({ teamId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: teamsListKey }),
        queryClient.cancelQueries({ queryKey: teamDetailKey(teamId) }),
      ])

      const previousTeams = queryClient.getQueryData<TeamRecord[]>(teamsListKey)
      const previousDetail = queryClient.getQueryData<TeamRecord>(teamDetailKey(teamId))

      if (previousTeams) {
        queryClient.setQueryData<TeamRecord[]>(teamsListKey, (existing = []) =>
          existing.filter((team) => team.id !== teamId),
        )
      }

      queryClient.removeQueries({ queryKey: teamDetailKey(teamId) })

      return { previousTeams, previousDetail }
    },
    onError: (_error, payload, context) => {
      if (context?.previousTeams) {
        queryClient.setQueryData(teamsListKey, context.previousTeams)
      }

      if (context?.previousDetail) {
        queryClient.setQueryData(teamDetailKey(payload.teamId), context.previousDetail)
      }
    },
    onSettled: (_result, _error, payload) => {
      queryClient.invalidateQueries({ queryKey: teamsListKey })
      queryClient.invalidateQueries({ queryKey: teamDetailKey(payload.teamId) })
    },
  })
}
