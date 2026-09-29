import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({ getSupabaseClient: vi.fn() }))

import { getSupabaseClient } from '../../lib/supabase'
import { calculateDashboardMetrics, getDashboardMetrics, getWitaDate } from './dashboardService'

afterEach(() => vi.clearAllMocks())

describe('calculateDashboardMetrics', () => {
  it('memisahkan aktif, overdue, due dekat, done, dan cancelled tanpa membuat nol menjadi selesai', () => {
    const actions = [
      { status: 'OPEN', due_date: '2026-09-21' },
      { status: 'IN_PROGRESS', due_date: '2026-09-22' },
      { status: 'BLOCKED', due_date: '2026-09-29' },
      { status: 'DONE', due_date: '2026-09-20' },
      { status: 'CANCELLED', due_date: '2026-09-19' },
    ] as never[]
    expect(calculateDashboardMetrics(actions, '2026-09-22')).toEqual({ active: 3, overdue: 1, dueSoon: 2, completionPercentage: 25 })
  })

  it('menampilkan persen null saat penyebut tidak ada', () => {
    expect(calculateDashboardMetrics([{ status: 'CANCELLED', due_date: '2026-09-20' }] as never[], '2026-09-22').completionPercentage).toBeNull()
  })

  it('membedakan sebelum dan sesudah tengah malam WITA, termasuk due kemarin, hari ini, besok', () => {
    expect(getWitaDate(new Date('2026-09-21T15:59:59Z'))).toBe('2026-09-21')
    expect(getWitaDate(new Date('2026-09-21T16:00:00Z'))).toBe('2026-09-22')
    expect(calculateDashboardMetrics([
      { status: 'OPEN', due_date: '2026-09-21' },
      { status: 'BLOCKED', due_date: '2026-09-22' },
      { status: 'IN_PROGRESS', due_date: '2026-09-23' },
      { status: 'DONE', due_date: '2026-09-20' },
      { status: 'CANCELLED', due_date: '2026-09-20' },
    ] as never[], '2026-09-22')).toEqual({ active: 3, overdue: 1, dueSoon: 2, completionPercentage: 25 })
  })

  it('mengambil count berotorisasi tanpa batas 1000 row dan mengecualikan CANCELLED dari penyebut', async () => {
    const countValues = [1000, 1, 2, 501, 1001]
    const queries: ReturnType<typeof Object.assign>[] = []
    const select = vi.fn(() => {
      const query = Object.assign(Promise.resolve({ count: countValues[queries.length], error: null }), {
        is: vi.fn(), not: vi.fn(), lt: vi.fn(), gte: vi.fn(), lte: vi.fn(), eq: vi.fn(), neq: vi.fn(),
      })
      query.is.mockReturnValue(query)
      query.not.mockReturnValue(query)
      query.lt.mockReturnValue(query)
      query.gte.mockReturnValue(query)
      query.lte.mockReturnValue(query)
      query.eq.mockReturnValue(query)
      query.neq.mockReturnValue(query)
      queries.push(query)
      return query
    })
    const client = { from: vi.fn(() => ({ select })) }
    vi.mocked(getSupabaseClient).mockReturnValue(client as never)

    await expect(getDashboardMetrics('2026-09-22')).resolves.toEqual({ active: 1000, overdue: 1, dueSoon: 2, completionPercentage: 50 })
    expect(select).toHaveBeenCalledTimes(5)
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    for (const query of queries) expect(query.is).toHaveBeenCalledWith('deleted_at', null)
    expect(queries[0].not).toHaveBeenCalledWith('status', 'in', '(DONE,CANCELLED)')
    expect(queries[1].lt).toHaveBeenCalledWith('due_date', '2026-09-22')
    expect(queries[2].gte).toHaveBeenCalledWith('due_date', '2026-09-22')
    expect(queries[2].lte).toHaveBeenCalledWith('due_date', '2026-09-29')
    expect(queries[4].neq).toHaveBeenCalledWith('status', 'CANCELLED')
  })
})
