import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, Plus, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { deleteMeetingDraft, listMeetings, type Meeting, type MeetingFilters } from './meetingService'
import { useAuth } from '../auth/AuthProvider'

export function MeetingsPage() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const paramsKey = params.toString()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const filters: MeetingFilters = useMemo(() => {
    const values = new URLSearchParams(paramsKey)
    const status = values.get('status')
    return {
      search: values.get('search') ?? '',
      dateFrom: values.get('from') ?? '',
      dateTo: values.get('to') ?? '',
      status: status === 'DRAFT' || status === 'FINAL' ? status : '',
    }
  }, [paramsKey])
  const totalPages = Math.max(1, Math.ceil(total / 25))
  const hasFilters = Boolean(filters.search?.trim() || filters.dateFrom || filters.dateTo || filters.status)

  const setFilter = (key: string, value: string) => {
    setLoading(true)
    setError(null)
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const setPage = (nextPage: number) => {
    setLoading(true)
    setError(null)
    const next = new URLSearchParams(params)
    if (nextPage <= 1) next.delete('page'); else next.set('page', String(nextPage))
    setParams(next)
  }
  const resetFilters = () => {
    setLoading(true)
    setError(null)
    setParams(new URLSearchParams())
  }
  const load = () => {
    setLoading(true)
    setError(null)
    void listMeetings(filters, page).then((result) => { setMeetings(result.data); setTotal(result.total) }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Gagal memuat notula.')).finally(() => setLoading(false))
  }

  async function removeDraft(meeting: Meeting) {
    if (meeting.status !== 'DRAFT' || !profile || (profile.role !== 'ADMIN' && profile.id !== meeting.owner_id)) return
    if (!window.confirm(`Hapus draf notula “${meeting.title}”? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeletingId(meeting.id); setDeleteError(null)
    try {
      await deleteMeetingDraft(meeting.id, meeting.version)
      setTotal((count) => Math.max(0, count - 1))
      if (meetings.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        setMeetings((current) => current.filter((entry) => entry.id !== meeting.id))
      }
    } catch (reason) {
      setDeleteError(reason instanceof Error && reason.message === 'CONFLICT' ? 'Notula berubah sejak daftar dimuat. Muat ulang lalu coba lagi.' : reason instanceof Error ? reason.message : 'Draf notula gagal dihapus.')
    } finally { setDeletingId(null) }
  }

  useEffect(() => {
    let active = true
    void listMeetings(filters, page).then((result) => { if (active) { setMeetings(result.data); setTotal(result.total) } }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Gagal memuat notula.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return <section className="meetings-page" aria-labelledby="meetings-title">
    <div className="section-heading">
      <div><p className="eyebrow">Notula</p><h2 id="meetings-title">Rapat</h2><p className="section-description">Simpan draf, lengkapi hasil rapat, lalu finalkan tindak lanjut yang disepakati.</p></div>
      <Link className="button button--primary section-heading__action" to="/meetings/new"><Plus size={18} aria-hidden="true" /> Buat rapat</Link>
    </div>
    <div className="filter-bar meeting-filter-bar" aria-label="Filter notula">
      <label>Judul<input aria-label="Cari judul rapat" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Cari judul rapat" /></label>
      <label>Status<select aria-label="Filter status rapat" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value="">Semua status</option><option value="DRAFT">Draf</option><option value="FINAL">Final</option></select></label>
      <label>Tanggal dari<input aria-label="Tanggal rapat dari" type="date" value={filters.dateFrom} onChange={(event) => setFilter('from', event.target.value)} /></label>
      <label>Tanggal sampai<input aria-label="Tanggal rapat sampai" type="date" value={filters.dateTo} onChange={(event) => setFilter('to', event.target.value)} /></label>
      <button className="button button--quiet" type="button" onClick={resetFilters}>Reset filter</button>
    </div>
    {deleteError && <p className="form-error" role="alert">{deleteError} <button className="inline-button" type="button" onClick={load}>Muat ulang</button></p>}
    {loading ? <div className="meeting-list meeting-list--loading" aria-label="Memuat notula"><span /><span /><span /></div> : error ? <div className="empty-state" role="alert"><h3>Notula tidak dapat dimuat</h3><p>{error}</p><button className="button button--primary" type="button" onClick={load}>Coba lagi</button></div> : meetings.length === 0 ? <div className="empty-state"><ClipboardList size={28} aria-hidden="true" /><h3>{hasFilters ? 'Tidak ada notula sesuai filter' : 'Belum ada notula'}</h3><p>{hasFilters ? 'Ubah kata kunci atau rentang filter untuk melihat notula lain.' : 'Buat draf pertama untuk mencatat pembahasan dan tindak lanjut.'}</p>{hasFilters ? <button className="button button--primary" type="button" onClick={resetFilters}>Reset filter</button> : <Link className="button button--primary" to="/meetings/new">Buat draf</Link>}</div> : <>
      <div className="meeting-list">{meetings.map((meeting) => <div className="meeting-list__row" key={meeting.id}><Link className="meeting-list__item" to={`/meetings/${meeting.id}`}><span className="meeting-list__icon" aria-hidden="true"><CalendarDays size={19} /></span><span className="meeting-list__copy"><strong>{meeting.title}</strong><small>{meeting.starts_at ? `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' }).format(new Date(meeting.starts_at))} WITA` : 'Waktu rapat belum diisi'} · {meeting.chair_name || 'Pimpinan belum diisi'}</small></span><span className={`meeting-status meeting-status--${meeting.status.toLowerCase()}`}>{meeting.status === 'FINAL' ? 'Final' : 'Draf'}</span></Link>{meeting.status === 'DRAFT' && profile && (profile.role === 'ADMIN' || profile.id === meeting.owner_id) && <button className="icon-button delete-button" type="button" aria-label={`Hapus notula ${meeting.title}`} title="Hapus draf notula" disabled={deletingId === meeting.id} onClick={() => void removeDraft(meeting)}>{deletingId === meeting.id ? '…' : <Trash2 size={17} aria-hidden="true" />}</button>}</div>)}</div>
      <div className="pagination" aria-label="Navigasi halaman notula"><button className="button button--quiet" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Sebelumnya</button><span className="pagination__info">Halaman {page} dari {totalPages} · {total} notula</span><button className="button button--quiet" type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya →</button></div>
    </>}
  </section>
}
