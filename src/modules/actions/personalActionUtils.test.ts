import { describe, expect, it } from 'vitest'
import { getWitaDate, millisecondsUntilNextWitaDay } from '../../lib/witaDate'
import { getPersonalActionPresetFilters, materializePersonalActionPreset, parsePersonalActionPreset, setPersonalActionPreset } from './personalActionUtils'

describe('preset tindak lanjut pribadi', () => {
  it('mengunci semua preset ke PIC sesi dan mengecualikan status terminal', () => {
    for (const preset of ['mine', 'today', 'next7', 'overdue'] as const) {
      expect(getPersonalActionPresetFilters(preset, 'pic-a', '2026-09-30')).toMatchObject({ picId: 'pic-a', active: true, status: '' })
    }
  })

  it('memakai tanggal WITA, termasuk +7 hari secara inklusif', () => {
    expect(getWitaDate(new Date('2026-09-30T15:59:59Z'))).toBe('2026-09-30')
    expect(getWitaDate(new Date('2026-09-30T16:00:00Z'))).toBe('2026-10-01')
    expect(millisecondsUntilNextWitaDay(new Date('2026-09-30T15:59:30Z'))).toBe(30_000)
    expect(getPersonalActionPresetFilters('today', 'pic-a', '2026-10-01')).toMatchObject({ dueFrom: '2026-10-01', dueTo: '2026-10-01' })
    expect(getPersonalActionPresetFilters('next7', 'pic-a', '2026-10-01')).toMatchObject({ dueFrom: '2026-10-01', dueTo: '2026-10-08' })
    expect(getPersonalActionPresetFilters('overdue', 'pic-a', '2026-10-01')).toMatchObject({ overdue: true })
  })

  it('menyimpan preset pada URL dan materialisasi filter tetap pada pemilik sesi', () => {
    const params = setPersonalActionPreset('today', new URLSearchParams('search=lama&status=DONE&page=3'))
    expect(params.toString()).toBe('preset=today')
    expect(parsePersonalActionPreset(params.get('preset'))).toBe('today')
    expect(parsePersonalActionPreset('other')).toBeNull()

    const materialized = materializePersonalActionPreset('today', 'pic-b', '2026-10-01', new URLSearchParams('preset=today'))
    expect(Object.fromEntries(materialized.entries())).toEqual({ pic: 'pic-b', from: '2026-10-01', to: '2026-10-01', status: 'ACTIVE' })
  })
})
