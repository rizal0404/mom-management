import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({ getSupabaseClient: vi.fn() }))

import { getSupabaseClient } from '../../lib/supabase'
import { getPersonalActionSummary, listActions } from './actionService'

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

describe('listActions', () => {
  it('menggabungkan filter terlambat dan aktif tanpa menambahkan kondisi terminal ganda', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T16:00:00Z'))
    const query = Object.assign(Promise.resolve({ data: [], count: 0, error: null }), {
      select: vi.fn(), is: vi.fn(), order: vi.fn(), range: vi.fn(), not: vi.fn(), lt: vi.fn(),
    })
    for (const method of ['select', 'is', 'order', 'range', 'not', 'lt'] as const) query[method].mockReturnValue(query)
    vi.mocked(getSupabaseClient).mockReturnValue({ from: vi.fn(() => query) } as never)

    await expect(listActions({ active: true, overdue: true })).resolves.toMatchObject({ data: [], total: 0 })

    expect(query.not).toHaveBeenCalledTimes(1)
    expect(query.not).toHaveBeenCalledWith('status', 'in', '(DONE,CANCELLED)')
    expect(query.lt).toHaveBeenCalledWith('due_date', '2026-10-01')
  })
})

describe('getPersonalActionSummary', () => {
  it('menghitung semua halaman dengan filter PIC, aktif, belum dihapus, dan rentang WITA', async () => {
    const counts = [31, 2, 9, 4]
    type QueryMock = {
      is: ReturnType<typeof vi.fn>
      eq: ReturnType<typeof vi.fn>
      not: ReturnType<typeof vi.fn>
      gte: ReturnType<typeof vi.fn>
      lte: ReturnType<typeof vi.fn>
      lt: ReturnType<typeof vi.fn>
    }
    const queries: QueryMock[] = []
    const select = vi.fn(() => {
      const query = Object.assign(Promise.resolve({ count: counts[queries.length], error: null }), {
        is: vi.fn(), eq: vi.fn(), not: vi.fn(), gte: vi.fn(), lte: vi.fn(), lt: vi.fn(),
      })
      for (const method of ['is', 'eq', 'not', 'gte', 'lte', 'lt'] as const) query[method].mockReturnValue(query)
      queries.push(query as unknown as QueryMock)
      return query
    })
    const client = { from: vi.fn(() => ({ select })) }
    vi.mocked(getSupabaseClient).mockReturnValue(client as never)

    await expect(getPersonalActionSummary('pic-a', '2026-09-30')).resolves.toEqual({ mine: 31, dueToday: 2, next7Days: 9, overdue: 4 })

    expect(client.from).toHaveBeenCalledTimes(4)
    expect(select).toHaveBeenCalledTimes(4)
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    for (const query of queries) {
      expect(query.is).toHaveBeenCalledWith('deleted_at', null)
      expect(query.eq).toHaveBeenCalledWith('pic_id', 'pic-a')
      expect(query.not).toHaveBeenCalledWith('status', 'in', '(DONE,CANCELLED)')
    }
    expect(queries[1].gte).toHaveBeenCalledWith('due_date', '2026-09-30')
    expect(queries[1].lte).toHaveBeenCalledWith('due_date', '2026-09-30')
    expect(queries[2].gte).toHaveBeenCalledWith('due_date', '2026-09-30')
    expect(queries[2].lte).toHaveBeenCalledWith('due_date', '2026-10-07')
    expect(queries[3].lt).toHaveBeenCalledWith('due_date', '2026-09-30')
  })
})
