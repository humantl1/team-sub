/**
 * Barrel exports for the teams data layer. Keeping the surface area centralised simplifies future
 * imports from UI components while still letting tests reach into specific helpers when necessary.
 */
export * from './types'
export * from './queryKeys'
export * from './useTeamsQuery'
export * from './useTeamQuery'
export * from './useCreateTeamMutation'
export * from './useUpdateTeamMutation'
export * from './useDeleteTeamMutation'
