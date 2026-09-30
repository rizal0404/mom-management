import type { ActionFilters } from './actionService'
import { addDays } from '../../lib/witaDate'

export const personalActionPresetNames = {
  mine: 'Tugas Saya',
  today: 'Jatuh tempo hari ini',
  next7: '7 hari ke depan',
  overdue: 'Terlambat',
} as const

export type PersonalActionPreset = keyof typeof personalActionPresetNames

export function parsePersonalActionPreset(value: string | null): PersonalActionPreset | null {
  return value && Object.hasOwn(personalActionPresetNames, value) ? value as PersonalActionPreset : null
}

export function getPersonalActionPresetFilters(preset: PersonalActionPreset, userId: string, today: string): ActionFilters {
  const base: ActionFilters = {
    search: '', kind: '', status: '', picId: userId, meetingId: '',
    dueFrom: '', dueTo: '', overdue: false, active: true,
  }
  if (preset === 'today') return { ...base, dueFrom: today, dueTo: today }
  if (preset === 'next7') return { ...base, dueFrom: today, dueTo: addDays(today, 7) }
  if (preset === 'overdue') return { ...base, overdue: true }
  return base
}

export function materializePersonalActionPreset(preset: PersonalActionPreset, userId: string, today: string, params: URLSearchParams) {
  const filters = getPersonalActionPresetFilters(preset, userId, today)
  params.delete('preset')
  if (filters.picId) params.set('pic', filters.picId)
  if (filters.dueFrom) params.set('from', filters.dueFrom)
  if (filters.dueTo) params.set('to', filters.dueTo)
  if (filters.overdue) params.set('overdue', 'true')
  if (filters.active) params.set('status', 'ACTIVE')
  return params
}

export function setPersonalActionPreset(preset: PersonalActionPreset, params: URLSearchParams) {
  for (const key of ['search', 'kind', 'status', 'pic', 'meeting', 'from', 'to', 'overdue', 'active', 'page', 'week', 'view']) params.delete(key)
  params.set('preset', preset)
  return params
}
