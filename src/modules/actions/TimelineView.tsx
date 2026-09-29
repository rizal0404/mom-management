import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarRange } from 'lucide-react'
import { listTimelineActions, type ActionFilters, type ActionRecord } from './actionService'
import { getCurrentWeekStart } from './timelineUtils'

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function dayLabel(dateOnly: string) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${dateOnly}T00:00:00+08:00`))
}

function diffDays(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

function actionColumn(action: ActionRecord, weekStart: string) {
  const start = Math.max(0, diffDays(weekStart, action.start_date))
  const end = Math.min(7, diffDays(weekStart, action.due_date) + 1)
  return { gridColumn: `${start + 1} / ${Math.max(start + 2, end + 1)}` }
}

/**
 * Combine page + query identity into one state to avoid needing
 * an effect that calls setState to reset page on filter change.
 */
type QueryState = { page: number; queryKey: string }

export function TimelineView({ filters, weekStart, onWeekChange }: { filters: ActionFilters; weekStart: string; onWeekChange: (weekStart: string) => void }) {
  const [actions, setActions] = useState<ActionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])

  const currentQueryKey = useMemo(() => JSON.stringify({ filters, weekStart }), [filters, weekStart])
  const [queryState, setQueryState] = useState<QueryState>({ page: 1, queryKey: currentQueryKey })
  const [loadedQueryKey, setLoadedQueryKey] = useState(currentQueryKey)

  // Derive effective page: reset to 1 when query identity changes
  const effectivePage = queryState.queryKey === currentQueryKey ? queryState.page : 1
  const totalPages = Math.max(1, Math.ceil(total / 25))

  // Fetch data — mirrors the pattern in ActionsPage that the linter accepts
  useEffect(() => {
    let active = true
    void listTimelineActions(filters, weekStart, effectivePage)
      .then((result) => { if (active) { setActions(result.data); setTotal(result.total); setLoadedQueryKey(currentQueryKey); setError(null) } })
      .catch((reason: Error) => { if (active) { setLoadedQueryKey(currentQueryKey); setError(reason.message) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  // effectivePage is derived from queryState + currentQueryKey; both are stable per render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueryKey, effectivePage, retryKey])

  function changePage(nextPage: number) {
    setLoading(true)
    setError(null)
    setQueryState({ page: nextPage, queryKey: currentQueryKey })
  }

  function retryTimeline() {
    setLoading(true)
    setError(null)
    setRetryKey((current) => current + 1)
  }

  const queryCurrent = loadedQueryKey === currentQueryKey
  const showLoading = loading || !queryCurrent
  const visibleError = queryCurrent ? error : null

  return <section className="timeline-view" aria-labelledby="timeline-title"><div className="timeline-heading"><span className="panel-heading-icon"><CalendarRange size={20} /></span><div className="timeline-heading-copy"><h3 id="timeline-title">Timeline pekan</h3><p className="muted-copy">{dayLabel(weekStart)} – {dayLabel(days[6])} · WITA</p></div><div className="week-controls"><button className="button button--quiet" type="button" onClick={() => onWeekChange(addDays(weekStart, -7))}>← Pekan sebelumnya</button><button className="button button--quiet" type="button" onClick={() => onWeekChange(getCurrentWeekStart())}>Pekan ini</button><button className="button button--quiet" type="button" onClick={() => onWeekChange(addDays(weekStart, 7))}>Pekan berikutnya →</button></div></div>{showLoading && <p className="muted-copy">Memuat timeline…</p>}{visibleError && <div className="timeline-error" role="alert"><p className="form-error">{visibleError}</p><button className="button button--quiet" type="button" onClick={retryTimeline}>Coba lagi</button></div>}{!showLoading && !visibleError && actions.length === 0 && <div className="empty-state"><h3>Tidak ada action pada pekan ini</h3><p>Gunakan navigasi pekan atau ubah filter untuk melihat action lain.</p></div>}{!showLoading && !visibleError && actions.length > 0 && <><div className="timeline-board" aria-label="Timeline mingguan"><div className="timeline-days">{days.map((day) => <div key={day} className={day === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }) ? 'timeline-day--today' : undefined}>{dayLabel(day)}</div>)}</div>{actions.map((action) => <div className="timeline-track" key={action.id}><Link className={`timeline-bar timeline-bar--${action.kind.toLowerCase()} timeline-bar--${action.status.toLowerCase()}`} title={`${action.title} · ${action.pic_name} · ${action.status} · ${action.start_date} – ${action.due_date}`} style={actionColumn(action, weekStart)} to={`/actions/${action.id}`}><strong>{action.title}</strong><span className="timeline-bar__status">{action.status}</span><span className="pic-avatar" aria-label={`PIC: ${action.pic_name}`}>{action.pic_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span></Link></div>)}</div><div className="agenda-mobile" aria-label="Agenda mingguan">{days.map((day) => { const dayActions = actions.filter((action) => action.start_date <= day && action.due_date >= day); return <section className="agenda-day" key={day}><h4>{dayLabel(day)}</h4>{dayActions.length === 0 ? <p className="muted-copy">Tidak ada action</p> : dayActions.map((action) => <Link className="agenda-item" key={`${day}-${action.id}`} to={`/actions/${action.id}`}><strong>{action.title}</strong><span>{action.kind === 'PENDING_MATTER' ? 'Pending matter' : 'Task'} · {action.pic_name}</span><span className={`status-badge status-badge--${action.status.toLowerCase()}`}>{action.status}</span></Link>)}</section>})}</div></>}
  {!showLoading && !visibleError && total > 0 && <div className="pagination" aria-label="Navigasi halaman timeline">
    <button className="button button--quiet" type="button" disabled={effectivePage <= 1} onClick={() => changePage(effectivePage - 1)}>← Sebelumnya</button>
    <span className="pagination__info">Halaman {effectivePage} dari {totalPages} · {total} item</span>
    <button className="button button--quiet" type="button" disabled={effectivePage >= totalPages} onClick={() => changePage(effectivePage + 1)}>Berikutnya →</button>
  </div>}
  </section>
}
