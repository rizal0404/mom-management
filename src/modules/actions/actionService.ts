import { getSupabaseClient } from '../../lib/supabase'
import { addDays, getWitaDate } from '../../lib/witaDate'

export const actionStatuses = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED'] as const
export type ActionStatus = typeof actionStatuses[number]
export type ActionKind = 'TASK' | 'PENDING_MATTER'

export type ActionRecord = {
  id: string
  source_item_id: string
  kind: ActionKind
  title: string
  description: string | null
  pic_id: string
  start_date: string
  due_date: string
  status: ActionStatus
  closed_at: string | null
  version: number
  created_at: string
  updated_at: string
  pic_name: string
  meeting_id: string
  meeting_title: string
  source_agenda: string
  owner_id: string
}

export type ActionUpdate = {
  id: string
  actor_id: string
  actor_name: string
  created_at: string
  note: string | null
  before_values: Record<string, unknown>
  after_values: Record<string, unknown>
}

export type ActionFilters = {
  search?: string
  kind?: ActionKind | ''
  status?: ActionStatus | ''
  picId?: string
  meetingId?: string
  dueFrom?: string
  dueTo?: string
  overdue?: boolean
  active?: boolean
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export type PersonalActionSummary = {
  mine: number
  dueToday: number
  next7Days: number
  overdue: number
}

const PAGE_SIZE = 25

type ActionRow = Omit<ActionRecord, 'pic_name' | 'meeting_id' | 'meeting_title' | 'source_agenda' | 'owner_id'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: ActionFilters) {
  let q = query
  if (filters.search?.trim()) q = q.ilike('title', `%${filters.search.trim()}%`)
  if (filters.kind) q = q.eq('kind', filters.kind)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.picId) q = q.eq('pic_id', filters.picId)
  if (filters.dueFrom) q = q.gte('due_date', filters.dueFrom)
  if (filters.dueTo) q = q.lte('due_date', filters.dueTo)
  if (filters.active || filters.overdue) q = q.not('status', 'in', '(DONE,CANCELLED)')
  if (filters.overdue) q = q.lt('due_date', getWitaDate())
  return q
}

async function getMeetingItemIds(meetingId?: string) {
  if (!meetingId) return null
  const { data, error } = await getSupabaseClient().from('meeting_items').select('id').eq('meeting_id', meetingId)
  if (error) throw new Error('Filter notula asal tidak dapat dimuat.')
  return (data ?? []).map((item) => item.id)
}

async function getActionRows(filters: ActionFilters = {}, page = 1, pageSize = PAGE_SIZE) {
  const meetingItemIds = await getMeetingItemIds(filters.meetingId)
  if (meetingItemIds && meetingItemIds.length === 0) return { rows: [] as ActionRow[], total: 0 }
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = getSupabaseClient().from('actions').select('id,source_item_id,kind,title,description,pic_id,start_date,due_date,status,closed_at,version,created_at,updated_at', { count: 'exact' }).is('deleted_at', null).order('due_date', { ascending: true }).order('updated_at', { ascending: false }).range(from, to) as any
  if (meetingItemIds) query = query.in('source_item_id', meetingItemIds)
  query = applyFilters(query, filters)
  const { data, error, count } = await query
  if (error) throw new Error('Tindak lanjut tidak dapat dimuat.')
  return { rows: data as ActionRow[], total: (count ?? 0) as number }
}

async function hydrateActions(rows: ActionRow[]) {
  if (!rows.length) return [] as ActionRecord[]
  const client = getSupabaseClient()
  const sourceIds = rows.map((row) => row.source_item_id)
  const { data: items, error: itemError } = await client.from('meeting_items').select('id,meeting_id,agenda').in('id', sourceIds)
  if (itemError) throw new Error('Sumber tindak lanjut tidak dapat dimuat.')
  const meetingIds = [...new Set((items ?? []).map((item) => item.meeting_id))]
  const picIds = [...new Set(rows.map((row) => row.pic_id))]
  const [{ data: meetings, error: meetingError }, { data: profiles, error: profileError }] = await Promise.all([
    client.from('meetings').select('id,title,owner_id').in('id', meetingIds),
    client.from('profiles').select('id,display_name').in('id', picIds),
  ])
  if (meetingError || profileError) throw new Error('Referensi tindak lanjut tidak dapat dimuat.')
  const itemMap = new Map((items ?? []).map((item) => [item.id, item]))
  const meetingMap = new Map((meetings ?? []).map((meeting) => [meeting.id, meeting]))
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]))
  return rows.flatMap((row) => {
    const item = itemMap.get(row.source_item_id)
    const meeting = item ? meetingMap.get(item.meeting_id) : undefined
    if (!item || !meeting) return []
    return [{ ...row, pic_name: profileMap.get(row.pic_id) ?? 'PIC tidak tersedia', meeting_id: meeting.id, meeting_title: meeting.title, source_agenda: item.agenda, owner_id: meeting.owner_id }]
  }) as ActionRecord[]
}

export async function listActions(filters: ActionFilters = {}, page = 1, pageSize = PAGE_SIZE): Promise<PaginatedResult<ActionRecord>> {
  const { rows, total } = await getActionRows(filters, page, pageSize)
  const data = await hydrateActions(rows)
  return { data, total, page, pageSize }
}

export async function listTimelineActions(filters: ActionFilters = {}, weekStart: string, page = 1, pageSize = PAGE_SIZE): Promise<PaginatedResult<ActionRecord>> {
  const meetingItemIds = await getMeetingItemIds(filters.meetingId)
  if (meetingItemIds && meetingItemIds.length === 0) return { data: [], total: 0, page, pageSize }
  const weekEnd = addDays(weekStart, 6)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = getSupabaseClient().from('actions').select('id,source_item_id,kind,title,description,pic_id,start_date,due_date,status,closed_at,version,created_at,updated_at', { count: 'exact' }).is('deleted_at', null).lte('start_date', weekEnd).gte('due_date', weekStart).order('start_date', { ascending: true }).order('due_date', { ascending: true }).range(from, to) as any
  if (meetingItemIds) query = query.in('source_item_id', meetingItemIds)
  query = applyFilters(query, filters)
  const { data, error, count } = await query
  if (error) throw new Error('Timeline tidak dapat dimuat.')
  const rows = data as ActionRow[]
  const hydrated = await hydrateActions(rows)
  return { data: hydrated, total: (count ?? 0) as number, page, pageSize }
}

async function countPersonalActions(picId: string, range: { from?: string; to?: string; before?: string } = {}) {
  let query = getSupabaseClient().from('actions')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('pic_id', picId)
    .not('status', 'in', '(DONE,CANCELLED)')
  if (range.from) query = query.gte('due_date', range.from)
  if (range.to) query = query.lte('due_date', range.to)
  if (range.before) query = query.lt('due_date', range.before)
  const { count, error } = await query
  if (error) throw new Error('Ringkasan tugas pribadi tidak dapat dimuat.')
  return count ?? 0
}

export async function getPersonalActionSummary(picId: string, today = getWitaDate()): Promise<PersonalActionSummary> {
  const [mine, dueToday, next7Days, overdue] = await Promise.all([
    countPersonalActions(picId),
    countPersonalActions(picId, { from: today, to: today }),
    countPersonalActions(picId, { from: today, to: addDays(today, 7) }),
    countPersonalActions(picId, { before: today }),
  ])
  return { mine, dueToday, next7Days, overdue }
}

export async function getAction(id: string) {
  const { data, error } = await getSupabaseClient().from('actions').select('id,source_item_id,kind,title,description,pic_id,start_date,due_date,status,closed_at,version,created_at,updated_at').eq('id', id).is('deleted_at', null).maybeSingle()
  if (error) throw new Error('Tindak lanjut tidak dapat dimuat.')
  const action = (await hydrateActions(data ? [data as ActionRow] : []))[0]
  if (!action) throw new Error('Tindak lanjut tidak ditemukan atau tidak dapat diakses.')
  return action
}

export async function listActionUpdates(actionId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from('action_updates').select('id,actor_id,created_at,note,before_values,after_values').eq('action_id', actionId).order('created_at', { ascending: false })
  if (error) throw new Error('Riwayat tindak lanjut tidak dapat dimuat.')
  const actorIds = [...new Set((data ?? []).map((update) => update.actor_id))]
  const { data: actors, error: actorError } = await client.from('profiles').select('id,display_name').in('id', actorIds)
  if (actorError) throw new Error('Aktor riwayat tidak dapat dimuat.')
  const names = new Map((actors ?? []).map((actor) => [actor.id, actor.display_name]))
  return (data ?? []).map((update) => ({ ...update, actor_name: names.get(update.actor_id) ?? 'Pengguna tidak tersedia' })) as ActionUpdate[]
}

export async function listActionProfiles() {
  const { data, error } = await getSupabaseClient().from('profiles').select('id,display_name').eq('is_active', true).order('display_name')
  if (error) throw new Error('Daftar PIC tidak dapat dimuat.')
  return data as { id: string; display_name: string }[]
}

export async function listActionMeetings() {
  const { data, error } = await getSupabaseClient().from('meetings').select('id,title').order('title', { ascending: true })
  if (error) throw new Error('Daftar notula asal tidak dapat dimuat.')
  return (data ?? []) as { id: string; title: string }[]
}

export async function updateAction(id: string, expectedVersion: number, patch: Record<string, unknown>, note: string) {
  const { data, error } = await getSupabaseClient().rpc('update_action', { p_id: id, p_expected_version: expectedVersion, p_patch: patch, p_note: note || null })
  if (error) {
    if (error.message.includes('CONFLICT')) throw new Error('CONFLICT')
    if (error.message.includes('FORBIDDEN')) throw new Error('Anda tidak memiliki hak untuk perubahan ini.')
    if (error.message.includes('VALIDATION')) throw new Error(error.message.replace('VALIDATION: ', ''))
    throw new Error('Tindak lanjut gagal diperbarui.')
  }
  return data as { id: string; version: number; status: ActionStatus; closed_at: string | null }
}

export async function deleteAction(id: string, expectedVersion: number) {
  const { error } = await getSupabaseClient().rpc('delete_action', { p_id: id, p_expected_version: expectedVersion })
  if (error) {
    if (error.message.includes('CONFLICT')) throw new Error('CONFLICT')
    if (error.message.includes('FORBIDDEN')) throw new Error('Anda tidak memiliki hak untuk menghapus task ini.')
    throw new Error('Task gagal dihapus dari tracker.')
  }
}
