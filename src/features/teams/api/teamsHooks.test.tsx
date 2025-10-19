/**
 * Comprehensive tests covering the teams data hooks. Each case mocks out the Supabase client to
 * exercise TanStack Query behaviours (caching, optimistic updates, and error handling) without
 * performing network requests.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}))

import { getSupabaseClient } from '@/lib/supabase'
import { mapTeamRow } from './mappers'
import { teamDetailKey, teamsListKey } from './queryKeys'
import { TEAM_SELECT_COLUMNS } from './selects'
import { useCreateTeamMutation } from './useCreateTeamMutation'
import { useDeleteTeamMutation } from './useDeleteTeamMutation'
import { useTeamQuery } from './useTeamQuery'
import { useTeamsQuery } from './useTeamsQuery'
import { useUpdateTeamMutation } from './useUpdateTeamMutation'
import type {
  AppError,
  DeleteTeamPayload,
  InsertTeamPayload,
  TeamRecord,
  UpdateTeamPayload,
} from './types'

const mockedGetSupabaseClient = vi.mocked(getSupabaseClient)

/**
 * Representative Supabase row mirroring the current `teams` schema. The mapping test below ensures
 * our hand-written types stay aligned with the database until automated type generation is added.
 */
const supabaseTeamRow = {
  id: 'team-123',
  owner_id: 'user-456',
  sport_id: 'sport-789',
  name: 'Weekend Warriors',
  notes: 'Focus on defensive drills',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-02T00:00:00.000Z',
}

const mappedTeam: TeamRecord = {
  id: supabaseTeamRow.id,
  ownerId: supabaseTeamRow.owner_id,
  sportId: supabaseTeamRow.sport_id,
  name: supabaseTeamRow.name,
  notes: supabaseTeamRow.notes,
  createdAt: supabaseTeamRow.created_at,
  updatedAt: supabaseTeamRow.updated_at,
}

type TeamsTableStub = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

type SupabaseTeamsStub = {
  from: ReturnType<typeof vi.fn>
  table: TeamsTableStub
}

const activeClients: QueryClient[] = []

function createSupabaseStub(): SupabaseTeamsStub {
  const table: TeamsTableStub = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  return {
    table,
    from: vi.fn().mockImplementation((tableName: string) => {
      if (tableName !== 'teams') {
        throw new Error(`Unexpected table ${tableName}`)
      }

      return table
    }),
  }
}

function createQueryClientWrapper(config: QueryClientConfig = {}): {
  queryClient: QueryClient
  wrapper: ({ children }: { children: ReactNode }) => ReactNode
} {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    ...config,
  })

  activeClients.push(queryClient)

  return {
    queryClient,
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

beforeEach(() => {
  mockedGetSupabaseClient.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
  while (activeClients.length > 0) {
    const client = activeClients.pop()
    client?.clear()
  }
})

describe('mapTeamRow', () => {
  it('produces camelCased records that mirror the Supabase schema', () => {
    expect(mapTeamRow(supabaseTeamRow)).toEqual(mappedTeam)
  })
})

describe('useTeamsQuery', () => {
  it('fetches the current user teams and maps them into camelCase', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const order = vi.fn().mockResolvedValue({ data: [supabaseTeamRow], error: null })
    supabaseStub.table.select.mockReturnValue({ order })

    const { wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTeamsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([mappedTeam])
    expect(supabaseStub.from).toHaveBeenCalledWith('teams')
    expect(supabaseStub.table.select).toHaveBeenCalledWith(TEAM_SELECT_COLUMNS)
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('surface Supabase errors via the shared AppError wrapper', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: '500', message: 'Supabase exploded.' } })
    supabaseStub.table.select.mockReturnValue({ order })

    const { wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTeamsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect((result.current.error as AppError).message).toMatch(/supabase exploded/i)
  })
})

describe('useTeamQuery', () => {
  it('skips fetching when no team id is present', () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const { wrapper } = createQueryClientWrapper()
    renderHook(() => useTeamQuery(null), { wrapper })

    expect(supabaseStub.from).not.toHaveBeenCalled()
  })

  it('fetches a specific team and returns null for not found', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    supabaseStub.table.select.mockReturnValue({ eq })

    const { wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTeamQuery('team-unknown'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()

    expect(supabaseStub.table.select).toHaveBeenCalledWith(TEAM_SELECT_COLUMNS)
    expect(eq).toHaveBeenCalledWith('id', 'team-unknown')
  })

  it('returns the mapped team when Supabase finds a row', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const maybeSingle = vi.fn().mockResolvedValue({ data: supabaseTeamRow, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    supabaseStub.table.select.mockReturnValue({ eq })

    const { wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTeamQuery('team-123'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mappedTeam)
  })

  it('propagates Supabase errors as AppError', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: '401', message: 'Not allowed.' } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    supabaseStub.table.select.mockReturnValue({ eq })

    const { wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTeamQuery('team-123'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as AppError).message).toMatch(/not allowed/i)
  })
})

describe('useCreateTeamMutation', () => {
  it('persists the new team and updates caches with the returned record', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const single = vi.fn().mockResolvedValue({ data: supabaseTeamRow, error: null })
    const select = vi.fn().mockReturnValue({ single })
    supabaseStub.table.insert.mockReturnValue({ select })

    const { queryClient, wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useCreateTeamMutation(), { wrapper })

    const payload: InsertTeamPayload = { name: 'Weekend Warriors', sportId: 'sport-789' }

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(supabaseStub.table.insert).toHaveBeenCalledWith({
      name: 'Weekend Warriors',
      sport_id: 'sport-789',
      notes: null,
    })
    expect(single).toHaveBeenCalledTimes(1)

    expect(queryClient.getQueryData<TeamRecord[]>(teamsListKey)).toEqual([mappedTeam])
    expect(queryClient.getQueryData<TeamRecord>(teamDetailKey(mappedTeam.id))).toEqual(mappedTeam)
  })

  it('restores the previous cache when Supabase rejects the insert', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const select = vi
      .fn()
      .mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { code: '500', message: 'Boom' } }),
      })
    supabaseStub.table.insert.mockReturnValue({ select })

    const { queryClient, wrapper } = createQueryClientWrapper()
    queryClient.setQueryData<TeamRecord[]>(teamsListKey, [mappedTeam])

    const { result } = renderHook(() => useCreateTeamMutation(), { wrapper })
    const payload: InsertTeamPayload = { name: 'New Team', sportId: 'sport-999' }

    await expect(
      act(async () => {
        await result.current.mutateAsync(payload)
      }),
    ).rejects.toThrow()

    expect(queryClient.getQueryData<TeamRecord[]>(teamsListKey)).toEqual([mappedTeam])
  })
})

describe('useUpdateTeamMutation', () => {
  it('applies optimistic updates and reconciles with the Supabase response', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const updatedRow = {
      ...supabaseTeamRow,
      name: 'Updated Warriors',
    }
    const single = vi.fn().mockResolvedValue({ data: updatedRow, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    supabaseStub.table.update.mockReturnValue({ eq })

    const { queryClient, wrapper } = createQueryClientWrapper()
    queryClient.setQueryData<TeamRecord[]>(teamsListKey, [mappedTeam])
    queryClient.setQueryData<TeamRecord>(teamDetailKey(mappedTeam.id), mappedTeam)

    const { result } = renderHook(() => useUpdateTeamMutation(), { wrapper })

    const payload: UpdateTeamPayload = { teamId: mappedTeam.id, name: 'Updated Warriors' }

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(supabaseStub.table.update).toHaveBeenCalledWith({ name: 'Updated Warriors' })
    expect(eq).toHaveBeenCalledWith('id', mappedTeam.id)
    expect(single).toHaveBeenCalledTimes(1)

    expect(queryClient.getQueryData<TeamRecord[]>(teamsListKey)).toEqual([
      { ...mappedTeam, name: 'Updated Warriors' },
    ])
    expect(queryClient.getQueryData<TeamRecord>(teamDetailKey(mappedTeam.id))).toEqual({
      ...mappedTeam,
      name: 'Updated Warriors',
    })
  })

  it('rolls caches back when Supabase returns an error', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const select = vi
      .fn()
      .mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { code: '403', message: 'Forbidden' } }),
      })
    const eq = vi.fn().mockReturnValue({ select })
    supabaseStub.table.update.mockReturnValue({ eq })

    const { queryClient, wrapper } = createQueryClientWrapper()
    queryClient.setQueryData<TeamRecord[]>(teamsListKey, [mappedTeam])
    queryClient.setQueryData<TeamRecord>(teamDetailKey(mappedTeam.id), mappedTeam)

    const { result } = renderHook(() => useUpdateTeamMutation(), { wrapper })
    const payload: UpdateTeamPayload = { teamId: mappedTeam.id, name: 'Forbidden Update' }

    await expect(
      act(async () => {
        await result.current.mutateAsync(payload)
      }),
    ).rejects.toThrow()

    expect(queryClient.getQueryData<TeamRecord[]>(teamsListKey)).toEqual([mappedTeam])
    expect(queryClient.getQueryData<TeamRecord>(teamDetailKey(mappedTeam.id))).toEqual(mappedTeam)
  })

  it('refreshes the team when no fields changed in the payload', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as SupabaseClient)

    const maybeSingle = vi.fn().mockResolvedValue({ data: supabaseTeamRow, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    supabaseStub.table.select.mockReturnValue({ eq })

    const { queryClient, wrapper } = createQueryClientWrapper()
    queryClient.setQueryData<TeamRecord[]>(teamsListKey, [mappedTeam])
    queryClient.setQueryData<TeamRecord>(teamDetailKey(mappedTeam.id), mappedTeam)

    const { result } = renderHook(() => useUpdateTeamMutation(), { wrapper })
    const payload: UpdateTeamPayload = { teamId: mappedTeam.id }

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(supabaseStub.table.update).not.toHaveBeenCalled()
    expect(queryClient.getQueryData<TeamRecord>(teamDetailKey(mappedTeam.id))).toEqual(mappedTeam)
  })
})

describe('useDeleteTeamMutation', () => {
  it('removes the team from caches after a successful delete', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as never)

    const eq = vi.fn().mockResolvedValue({ error: null })
    supabaseStub.table.delete.mockReturnValue({ eq })

    const { queryClient, wrapper } = createQueryClientWrapper()
    queryClient.setQueryData<TeamRecord[]>(teamsListKey, [mappedTeam])
    queryClient.setQueryData<TeamRecord>(teamDetailKey(mappedTeam.id), mappedTeam)

    const { result } = renderHook(() => useDeleteTeamMutation(), { wrapper })
    const payload: DeleteTeamPayload = { teamId: mappedTeam.id }

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(supabaseStub.table.delete).toHaveBeenCalledTimes(1)
    expect(eq).toHaveBeenCalledWith('id', mappedTeam.id)
    expect(queryClient.getQueryData<TeamRecord[]>(teamsListKey)).toEqual([])
    expect(queryClient.getQueryData<TeamRecord>(teamDetailKey(mappedTeam.id))).toBeUndefined()
  })

  it('restores caches when Supabase refuses the delete', async () => {
    const supabaseStub = createSupabaseStub()
    mockedGetSupabaseClient.mockReturnValue(supabaseStub as unknown as never)

    const eq = vi
      .fn()
      .mockResolvedValue({ error: { code: '409', message: 'Cannot delete' } })
    supabaseStub.table.delete.mockReturnValue({ eq })

    const { queryClient, wrapper } = createQueryClientWrapper()
    queryClient.setQueryData<TeamRecord[]>(teamsListKey, [mappedTeam])
    queryClient.setQueryData<TeamRecord>(teamDetailKey(mappedTeam.id), mappedTeam)

    const { result } = renderHook(() => useDeleteTeamMutation(), { wrapper })
    const payload: DeleteTeamPayload = { teamId: mappedTeam.id }

    await expect(
      act(async () => {
        await result.current.mutateAsync(payload)
      }),
    ).rejects.toThrow()

    expect(queryClient.getQueryData<TeamRecord[]>(teamsListKey)).toEqual([mappedTeam])
    expect(queryClient.getQueryData<TeamRecord>(teamDetailKey(mappedTeam.id))).toEqual(mappedTeam)
  })
})
