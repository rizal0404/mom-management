import { getSupabaseClient } from '../../lib/supabase'

export type MeetingDraft = { id?: string; title: string; starts_at: string | null; location_or_link: string | null; chair_name: string | null; participants: { id?: string; display_name_snapshot: string; profile_id?: string | null }[]; items: { id?: string; position?: number; agenda: string; discussion?: string | null; result?: string | null; kind: 'NOTE' | 'DECISION' | 'TASK' | 'PENDING_MATTER'; draft_pic_id?: string | null; draft_start_date?: string | null; draft_due_date?: string | null }[] }
export type Meeting = MeetingDraft & { id: string; owner_id: string; version: number; status: 'DRAFT' | 'FINAL' }
export type MeetingDetail = Meeting & { meeting_participants: { id: string; profile_id: string | null; display_name_snapshot: string }[]; meeting_items: { id: string; position: number; agenda: string; discussion: string | null; result: string | null; kind: MeetingDraft['items'][number]['kind']; draft_pic_id: string | null; draft_start_date: string | null; draft_due_date: string | null }[] }
export type ActiveProfile = { id: string; display_name: string }
export type MeetingTemplateKind = MeetingDraft['items'][number]['kind']
export type MeetingTemplateItem = { id: string; position: number; agenda: string; kind: MeetingTemplateKind }
export type MeetingTemplate = {
  id: string
  owner_id: string
  name: string
  initial_title: string | null
  version: number
  meeting_template_items: MeetingTemplateItem[]
}
export type MeetingTemplateDraft = {
  id?: string
  name: string
  initial_title: string | null
  items: { position: number; agenda: string; kind: MeetingTemplateKind }[]
}
export type MeetingFilters = { search?: string; dateFrom?: string; dateTo?: string; status?: 'DRAFT' | 'FINAL' | '' }
export type MeetingPage = { data: Meeting[]; total: number; page: number; pageSize: number }

const PAGE_SIZE = 25

function addCalendarDay(dateOnly: string) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export async function listMeetings(filters: MeetingFilters = {}, page = 1, pageSize = PAGE_SIZE): Promise<MeetingPage> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = getSupabaseClient().from('meetings').select('id,title,starts_at,chair_name,owner_id,status,version', { count: 'exact' }).order('starts_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).range(from, to) as any
  if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim()}%`)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.dateFrom) query = query.gte('starts_at', `${filters.dateFrom}T00:00:00+08:00`)
  if (filters.dateTo) query = query.lt('starts_at', `${addCalendarDay(filters.dateTo)}T00:00:00+08:00`)
  const { data, error, count } = await query
  if (error) throw new Error('Notula tidak dapat dimuat.')
  return { data: (data ?? []) as Meeting[], total: count ?? 0, page, pageSize }
}
export async function getMeetingDraft(id: string) {
  const { data, error } = await getSupabaseClient().from('meetings').select('id,title,owner_id,starts_at,location_or_link,chair_name,status,version,meeting_participants(id,profile_id,display_name_snapshot),meeting_items(id,position,agenda,discussion,result,kind,draft_pic_id,draft_start_date,draft_due_date)').eq('id', id).maybeSingle()
  if (error || !data) throw new Error('Notula tidak ditemukan atau tidak dapat diakses.')
  return data as MeetingDetail
}
export async function listActiveProfiles() {
  const { data, error } = await getSupabaseClient().from('profiles').select('id,display_name').eq('is_active', true).order('display_name')
  if (error) throw new Error('Daftar PIC tidak dapat dimuat.')
  return data as ActiveProfile[]
}
export async function saveMeetingDraft(draft: MeetingDraft, expectedVersion?: number) {
  const { data, error } = await getSupabaseClient().rpc('save_meeting_draft', { p_payload: draft, p_expected_version: expectedVersion ?? null })
  if (error) throw new Error(error.message.includes('CONFLICT') ? 'CONFLICT' : 'Notula gagal disimpan.')
  return data as Meeting
}
export async function deleteMeetingDraft(id: string, expectedVersion: number) {
  const { error } = await getSupabaseClient().rpc('delete_meeting_draft', { p_id: id, p_expected_version: expectedVersion })
  if (error) throw new Error(error.message.includes('CONFLICT') ? 'CONFLICT' : 'Notula gagal dihapus.')
}
export async function finalizeMeeting(id: string, expectedVersion: number) {
  const { data, error } = await getSupabaseClient().rpc('finalize_meeting', { p_id: id, p_expected_version: expectedVersion })
  if (error) throw new Error(error.message.includes('CONFLICT') ? 'CONFLICT' : error.message.includes('VALIDATION') ? error.message.replace('VALIDATION: ', '') : 'Finalisasi gagal.')
  return data as { meeting_id: string; action_count: number }
}

function templateError(error: { message: string }, fallback: string) {
  if (error.message.includes('CONFLICT')) return new Error('CONFLICT')
  if (error.message.includes('VALIDATION: ')) return new Error(error.message.split('VALIDATION: ').at(-1) ?? fallback)
  if (error.message.includes('FORBIDDEN')) return new Error('Template tidak ditemukan atau tidak dapat diakses.')
  return new Error(fallback)
}

export async function listMeetingTemplates(): Promise<MeetingTemplate[]> {
  const { data, error } = await getSupabaseClient().from('meeting_templates')
    .select('id,owner_id,name,initial_title,version,meeting_template_items(id,position,agenda,kind)')
    .order('updated_at', { ascending: false })
  if (error) throw new Error('Template agenda tidak dapat dimuat.')
  return (data ?? []) as MeetingTemplate[]
}

export async function saveMeetingTemplate(template: MeetingTemplateDraft, expectedVersion?: number) {
  const { data, error } = await getSupabaseClient().rpc('save_meeting_template', {
    p_payload: template,
    p_expected_version: expectedVersion ?? null,
  })
  if (error) throw templateError(error, 'Template agenda gagal disimpan.')
  return data as Omit<MeetingTemplate, 'meeting_template_items'>
}

export async function deleteMeetingTemplate(id: string, expectedVersion: number) {
  const { error } = await getSupabaseClient().rpc('delete_meeting_template', {
    p_id: id,
    p_expected_version: expectedVersion,
  })
  if (error) throw templateError(error, 'Template agenda gagal dihapus.')
}

export async function createMeetingDraftFromTemplate(templateId: string) {
  const { data, error } = await getSupabaseClient().rpc('create_meeting_draft_from_template', {
    p_template_id: templateId,
  })
  if (error) throw templateError(error, 'Draf rapat dari template gagal dibuat.')
  return data as Meeting
}
