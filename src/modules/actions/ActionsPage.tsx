import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ListChecks, SlidersHorizontal, CalendarRange, Trash2 } from 'lucide-react'
import { deleteAction, listActionMeetings, listActionProfiles, listActions, actionStatuses, type ActionFilters, type ActionKind, type ActionRecord, type ActionStatus } from './actionService'
import { TimelineView } from './TimelineView'
import { getCurrentWeekStart } from './timelineUtils'
import { useAuth } from '../auth/AuthProvider'

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')

const todayWita = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })

export function ActionsPage() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [actions, setActions] = useState<ActionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([])
  const [meetings, setMeetings] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const paramsKey = params.toString()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const filters: ActionFilters = useMemo(() => {
    const values = new URLSearchParams(paramsKey)
    const statusParam = values.get('status')
    const active = statusParam === 'ACTIVE' || (!statusParam && values.get('active') !== 'false')
    return {
      search: values.get('search') ?? '',
      kind: (values.get('kind') as ActionKind | '') ?? '',
      status: statusParam && !['ACTIVE', 'ALL'].includes(statusParam) ? statusParam as ActionStatus : '',
      picId: values.get('pic') ?? '',
      meetingId: values.get('meeting') ?? '',
      dueFrom: values.get('from') ?? '',
      dueTo: values.get('to') ?? '',
      overdue: values.get('overdue') === 'true',
      active,
    }
  }, [paramsKey])
  const statusSelection = params.get('status') === 'ALL' || (!filters.active && !filters.status) ? 'ALL' : filters.status || 'ACTIVE'
  const view = params.get('view') === 'timeline' ? 'timeline' : 'table'
  const weekStart = params.get('week') ?? getCurrentWeekStart()
  const totalPages = Math.max(1, Math.ceil(total / 25))
  const showDeleteColumn = Boolean(profile && (profile.role === 'ADMIN' || actions.some((action) => action.owner_id === profile.id)))

  const setFilter = (key: string, value: string | boolean) => {
    setLoading(true); setError(null)
    const next = new URLSearchParams(params)
    if (!value) next.delete(key); else next.set(key, String(value))
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const setPage = (nextPage: number) => {
    setLoading(true); setError(null)
    const next = new URLSearchParams(params)
    if (nextPage <= 1) next.delete('page'); else next.set('page', String(nextPage))
    setParams(next)
  }
  const setStatusFilter = (value: string) => {
    setLoading(true); setError(null)
    const next = new URLSearchParams(params)
    next.set('status', value)
    next.delete('active'); next.delete('page')
    setParams(next)
  }
  const setActiveFilter = (checked: boolean) => setStatusFilter(checked ? 'ACTIVE' : 'ALL')
  const setOverdueFilter = (checked: boolean) => {
    setLoading(true); setError(null)
    const next = new URLSearchParams(params)
    if (checked) { next.set('overdue', 'true'); next.set('status', 'ACTIVE') } else next.delete('overdue')
    next.delete('active'); next.delete('page')
    setParams(next)
  }
  const resetFilters = () => { setLoading(true); setError(null); setParams(new URLSearchParams()) }

  const canDeleteAction = (action: ActionRecord) => Boolean(profile && (profile.role === 'ADMIN' || profile.id === action.owner_id))
  async function removeAction(action: ActionRecord) {
    if (!canDeleteAction(action)) return
    if (!window.confirm(`Hapus task “${action.title}” dari tracker? Task akan disembunyikan dari tracker dan dashboard. Riwayat perubahan tetap disimpan.`)) return
    setDeletingId(action.id); setDeleteError(null)
    try {
      await deleteAction(action.id, action.version)
      setLoading(true)
      setRetryKey((current) => current + 1)
    } catch (reason) {
      setDeleteError(reason instanceof Error && reason.message === 'CONFLICT' ? 'Task berubah sejak daftar dimuat. Muat ulang lalu coba lagi.' : reason instanceof Error ? reason.message : 'Task gagal dihapus.')
    } finally { setDeletingId(null) }
  }

  useEffect(() => {
    let active = true
    void Promise.all([listActions(filters, page), listActionProfiles(), listActionMeetings()]).then(([result, nextProfiles, nextMeetings]) => { if (active) { setActions(result.data); setTotal(result.total); setProfiles(nextProfiles); setMeetings(nextMeetings) } }).catch((reason: Error) => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, retryKey])

  return <section className="action-tracker" aria-labelledby="actions-title">
    <div className="section-heading"><div><p className="eyebrow">Tindak lanjut</p><h2 id="actions-title">Tracker tindak lanjut</h2><p className="section-description">Pantau PIC, deadline, status, dan riwayat dari setiap task atau pending matter.</p></div><span className="tracker-total">{loading ? 'Memuat…' : `${total} item`}</span></div>
    <div className="tracker-toolbar"><div className="view-tabs" role="tablist" aria-label="Tampilan tindak lanjut"><button className={`view-tab ${view === 'table' ? 'view-tab--active' : ''}`} role="tab" aria-selected={view === 'table'} type="button" onClick={() => setFilter('view', 'table')}><ListChecks size={16} /> Tabel</button><button className={`view-tab ${view === 'timeline' ? 'view-tab--active' : ''}`} role="tab" aria-selected={view === 'timeline'} type="button" onClick={() => setFilter('view', 'timeline')}><CalendarRange size={16} /> Timeline</button></div><details className="tracker-filters"><summary><SlidersHorizontal size={16} /> Filter</summary><div className="filter-bar" aria-label="Filter tindak lanjut">
      <label>Cari judul<input aria-label="Cari judul" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Cari tindak lanjut" /></label>
      <label>Jenis<select aria-label="Filter jenis" value={filters.kind} onChange={(event) => setFilter('kind', event.target.value)}><option value="">Semua jenis</option><option value="TASK">Task</option><option value="PENDING_MATTER">Pending matter</option></select></label>
      <label>Status<select aria-label="Filter status" value={statusSelection} onChange={(event) => setStatusFilter(event.target.value)}><option value="ACTIVE">Aktif (default)</option><option value="ALL">Semua status</option>{actionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label>Notula asal<select aria-label="Filter notula asal" value={filters.meetingId} onChange={(event) => setFilter('meeting', event.target.value)}><option value="">Semua notula</option>{meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}</select></label>
      <label>PIC<select aria-label="Filter PIC" value={filters.picId} onChange={(event) => setFilter('pic', event.target.value)}><option value="">Semua PIC</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label>
      <label>Deadline dari<input aria-label="Deadline dari" type="date" value={filters.dueFrom} onChange={(event) => setFilter('from', event.target.value)} /></label>
      <label>Deadline sampai<input aria-label="Deadline sampai" type="date" value={filters.dueTo} onChange={(event) => setFilter('to', event.target.value)} /></label>
      <label className="filter-check"><input aria-label="Hanya aktif" type="checkbox" checked={Boolean(filters.active)} onChange={(event) => setActiveFilter(event.target.checked)} /> Tindak lanjut aktif</label>
      <label className="filter-check"><input aria-label="Hanya terlambat" type="checkbox" checked={Boolean(filters.overdue)} onChange={(event) => setOverdueFilter(event.target.checked)} /> Hanya terlambat</label>
      <button className="button button--quiet" type="button" onClick={resetFilters}>Reset filter</button>
    </div></details></div>
    {deleteError && <p className="form-error" role="alert">{deleteError} <button className="inline-button" type="button" onClick={() => { setDeleteError(null); setLoading(true); setRetryKey((value) => value + 1) }}>Muat ulang</button></p>}
    {view === 'timeline' && <TimelineView filters={filters} weekStart={weekStart} onWeekChange={(nextWeek) => setFilter('week', nextWeek)} />}
    {view === 'table' && <section className="task-list-panel" aria-labelledby="task-list-title"><div className="task-list-heading"><span className="panel-heading-icon"><ListChecks size={20} /></span><div><h3 id="task-list-title">Daftar task</h3><p>Seluruh tindak lanjut sesuai filter, lintas pekan.</p></div><span className="result-count">{loading ? 'Memuat…' : `${total} item`}</span></div>
    {error && <p className="form-error" role="alert">{error} <button className="inline-button" type="button" onClick={() => { setLoading(true); setError(null); setRetryKey((value) => value + 1) }}>Coba lagi</button></p>}
    {!loading && !error && actions.length === 0 && <div className="empty-state"><h3>Belum ada tindak lanjut</h3><p>{filters.active ? 'Tidak ada tindak lanjut aktif sesuai filter.' : 'Coba ubah filter atau finalisasi notula dengan TASK/PENDING_MATTER.'}</p><button className="button button--primary" type="button" onClick={resetFilters}>Reset filter</button></div>}

    {loading && <p className="list-loading" role="status">Memuat daftar task…</p>}
    {!loading && !error && actions.length > 0 && <><div className="action-table-wrap"><table className="action-table"><thead><tr><th>Tindak lanjut</th><th>Jenis</th><th>Rapat asal</th><th>PIC</th><th>Deadline</th><th>Status</th>{showDeleteColumn && <th>Aksi</th>}</tr></thead><tbody>{actions.map((action) => <tr key={action.id}><td><Link className="table-link" to={`/actions/${action.id}`}>{action.title}</Link><small>{action.description ?? 'Tanpa catatan hasil'}</small></td><td><span className={`kind-badge kind-badge--${action.kind.toLowerCase()}`}>{action.kind === 'PENDING_MATTER' ? 'Pending matter' : 'Task'}</span></td><td><Link className="table-link" to={`/meetings/${action.meeting_id}`}>{action.meeting_title}</Link></td><td><span className="pic-cell"><span className="pic-avatar" aria-hidden="true">{initials(action.pic_name)}</span><span>{action.pic_name}</span></span></td><td><span className={action.due_date < todayWita() && !['DONE', 'CANCELLED'].includes(action.status) ? 'overdue-text' : ''}>{action.due_date}</span></td><td><span className={`status-badge status-badge--${action.status.toLowerCase()}`}>{action.status}</span></td>{showDeleteColumn && <td>{canDeleteAction(action) && <button className="icon-button delete-button" type="button" aria-label={`Hapus task ${action.title}`} title="Hapus task" disabled={deletingId === action.id} onClick={() => void removeAction(action)}><Trash2 size={16} aria-hidden="true" /></button>}</td>}</tr>)}</tbody></table></div><div className="action-card-list">{actions.map((action) => <div className="action-card-row" key={action.id}><Link className="action-card" to={`/actions/${action.id}`}><span className="action-card__top"><span className={`kind-badge kind-badge--${action.kind.toLowerCase()}`}>{action.kind === 'PENDING_MATTER' ? 'Pending matter' : 'Task'}</span><span className={`status-badge status-badge--${action.status.toLowerCase()}`}>{action.status}</span></span><strong>{action.title}</strong><small>{action.description ?? 'Tanpa catatan hasil'}</small><span className="action-card__meta"><span>PIC: {action.pic_name}</span><span className={action.due_date < todayWita() && !['DONE', 'CANCELLED'].includes(action.status) ? 'overdue-text' : ''}>Deadline: {action.due_date}</span></span><span className="action-card__meeting">Notula: {action.meeting_title}</span></Link>{canDeleteAction(action) && <button className="icon-button delete-button action-card-delete" type="button" aria-label={`Hapus task ${action.title}`} disabled={deletingId === action.id} onClick={() => void removeAction(action)}><Trash2 size={17} aria-hidden="true" /> Hapus task</button>}</div>)}</div></>}
    {!loading && !error && total > 0 && <div className="pagination" aria-label="Navigasi halaman"><button className="button button--quiet" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Sebelumnya</button><span className="pagination__info">Halaman {page} dari {totalPages} · {total} item</span><button className="button button--quiet" type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya →</button></div>}
    </section>}
  </section>
}
