import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { toAppError } from './error'
import { mapTeamRow } from './mappers'
import { teamDetailKey, teamsListKey } from './queryKeys'
import { TEAM_SELECT_COLUMNS, type TeamSelectRow } from './selects'
import type { AppError, TeamRecord, TeamUpdateRow, UpdateTeamPayload } from './types'

/**
 * Update an existing team while keeping local caches in sync. The mutation performs lightweight
 * optimistic updates so the UI feels responsive, then reconciles with the authoritative row returned
 * by Supabase.
 */
export function useUpdateTeamMutation(): UseMutationResult<
  TeamRecord,
  AppError,
  UpdateTeamPayload
> {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  return useMutation<TeamRecord, AppError, UpdateTeamPayload>({
    mutationFn: async ({ teamId, name, sportId, notes }) => {
      const updates: TeamUpdateRow = {}

      if (name !== undefined) {
        updates.name = name
      }
      if (sportId !== undefined) {
        updates.sport_id = sportId
      }
      if (notes !== undefined) {
        updates.notes = notes ?? null
      }

      // When no fields changed we still fetch the latest row so the UI stays consistent.
      if (Object.keys(updates).length === 0) {
        const { data, error } = await supabase
          .from('teams')
          .select<TeamSelectRow>(TEAM_SELECT_COLUMNS)
          .eq('id', teamId)
          .maybeSingle()

        if (error) {
          throw toAppError(error, 'Unable to refresh team. Please try again.')
        }

        if (!data) {
          throw toAppError(new Error('Team not found'), 'Team not found.')
        }

        return mapTeamRow(data)
      }

      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select<TeamSelectRow>(TEAM_SELECT_COLUMNS)
        .single()

      if (error) {
        throw toAppError(error, 'Unable to update team. Please try again.')
      }

      return mapTeamRow(data)
    },
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: teamsListKey }),
        queryClient.cancelQueries({ queryKey: teamDetailKey(payload.teamId) }),
      ])

      const previousTeams = queryClient.getQueryData<TeamRecord[]>(teamsListKey)
      const previousDetail = queryClient.getQueryData<TeamRecord>(teamDetailKey(payload.teamId))

      const optimisticPatch = buildOptimisticPatch(payload)

      if (optimisticPatch) {
        if (previousTeams) {
          queryClient.setQueryData<TeamRecord[]>(teamsListKey, (existing = []) =>
            existing.map((team) =>
              team.id === payload.teamId ? { ...team, ...optimisticPatch } : team,
            ),
          )
        }

        if (previousDetail) {
          queryClient.setQueryData(teamDetailKey(payload.teamId), {
            ...previousDetail,
            ...optimisticPatch,
          })
        }
      }

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
    onSuccess: (updatedTeam) => {
      queryClient.setQueryData<TeamRecord[]>(teamsListKey, (existing = []) =>
        existing.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)),
      )
      queryClient.setQueryData(teamDetailKey(updatedTeam.id), updatedTeam)
    },
    onSettled: (_result, _error, payload) => {
      queryClient.invalidateQueries({ queryKey: teamsListKey })
      queryClient.invalidateQueries({ queryKey: teamDetailKey(payload.teamId) })
    },
  })
}

/**
 * Build a partial `TeamRecord` representing the optimistic changes derived from the mutation payload.
 * Returning `null` when no fields are present keeps the cache updates simple.
 */
function buildOptimisticPatch(payload: UpdateTeamPayload): Partial<TeamRecord> | null {
  const patch: Partial<TeamRecord> = {}

  if (payload.name !== undefined) {
    patch.name = payload.name
  }
  if (payload.sportId !== undefined) {
    patch.sportId = payload.sportId
  }
  if (payload.notes !== undefined) {
    patch.notes = payload.notes ?? null
  }

  return Object.keys(patch).length > 0 ? patch : null
}
