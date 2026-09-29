import { getSupabaseClient } from '../../lib/supabase'
import { listActions, type ActionRecord } from '../actions/actionService'

export type DashboardMetrics = {
  active: number
  overdue: number
  dueSoon: number
  completionPercentage: number | null
}

export type RecentMeeting = {
  id: string
  title: string
  starts_at: string | null
  status: 'DRAFT' | 'FINAL'
}

export type DashboardData = {
  metrics: DashboardMetrics
  urgentActions: ActionRecord[]
  recentMeetings: RecentMeeting[]
  today: string
  dueSoonEnd: string
}

export function getWitaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function calculateDashboardMetrics(actions: Pick<ActionRecord, 'status' | 'due_date'>[], today: string): DashboardMetrics {
  const dueSoonEnd = addDays(today, 7)
  const active = actions.filter((action) => !['DONE', 'CANCELLED'].includes(action.status))
  const eligibleForCompletion = actions.filter((action) => action.status !== 'CANCELLED')
  const done = eligibleForCompletion.filter((action) => action.status === 'DONE')
  return {
    active: active.length,
    overdue: active.filter((action) => action.due_date < today).length,
    dueSoon: active.filter((action) => action.due_date >= today && action.due_date <= dueSoonEnd).length,
    completionPercentage: eligibleForCompletion.length ? Math.round((done.length / eligibleForCompletion.length) * 100) : null,
  }
}

type DashboardCount = 'active' | 'overdue' | 'dueSoon' | 'done' | 'eligible'

async function countDashboardActions(kind: DashboardCount, today: string, dueSoonEnd: string) {
  let query = getSupabaseClient().from('actions').select('id', { count: 'exact', head: true }).is('deleted_at', null)
  if (kind === 'active') query = query.not('status', 'in', '(DONE,CANCELLED)')
  if (kind === 'overdue') query = query.not('status', 'in', '(DONE,CANCELLED)').lt('due_date', today)
  if (kind === 'dueSoon') query = query.not('status', 'in', '(DONE,CANCELLED)').gte('due_date', today).lte('due_date', dueSoonEnd)
  if (kind === 'done') query = query.eq('status', 'DONE')
  if (kind === 'eligible') query = query.neq('status', 'CANCELLED')
  const { count, error } = await query
  if (error) throw new Error('Ringkasan tindak lanjut tidak dapat dimuat.')
  return count ?? 0
}

export async function getDashboardMetrics(today: string): Promise<DashboardMetrics> {
  const dueSoonEnd = addDays(today, 7)
  const [active, overdue, dueSoon, done, eligible] = await Promise.all([
    countDashboardActions('active', today, dueSoonEnd),
    countDashboardActions('overdue', today, dueSoonEnd),
    countDashboardActions('dueSoon', today, dueSoonEnd),
    countDashboardActions('done', today, dueSoonEnd),
    countDashboardActions('eligible', today, dueSoonEnd),
  ])
  return {
    active,
    overdue,
    dueSoon,
    completionPercentage: eligible ? Math.round((done / eligible) * 100) : null,
  }
}

async function listRecentMeetings() {
  const { data, error } = await getSupabaseClient()
    .from('meetings')
    .select('id,title,starts_at,status')
    .order('starts_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(5)
  if (error) throw new Error('Notula terbaru tidak dapat dimuat.')
  return (data ?? []) as RecentMeeting[]
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
  const today = getWitaDate(now)
  const [metrics, recentMeetings, activeActions] = await Promise.all([
    getDashboardMetrics(today),
    listRecentMeetings(),
    listActions({ active: true }, 1, 5),
  ])
  return {
    metrics,
    urgentActions: activeActions.data.slice(0, 5),
    recentMeetings,
    today,
    dueSoonEnd: addDays(today, 7),
  }
}
