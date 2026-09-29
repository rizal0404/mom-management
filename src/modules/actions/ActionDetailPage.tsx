import { EvidencePanel } from '../evidence/EvidencePanel'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useNavigate } from 'react-router'
import { Trash2 } from 'lucide-react'
import { actionStatuses, deleteAction, getAction, listActionProfiles, listActionUpdates, updateAction, type ActionRecord, type ActionStatus, type ActionUpdate } from './actionService'
import { useAuth } from '../auth/AuthProvider'
import { formatWitaTimestamp } from '../../lib/witaDateTime'

const auditFieldLabels: Record<string, string> = {
  title: 'Judul',
  description: 'Deskripsi',
  pic_id: 'PIC',
  start_date: 'Tanggal mulai',
  due_date: 'Deadline',
  status: 'Status',
  deleted_at: 'Dihapus pada',
}

const auditStatusLabels: Record<string, string> = {
  OPEN: 'Belum mulai',
  IN_PROGRESS: 'Dikerjakan',
  BLOCKED: 'Terhambat',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

function auditChanges(update: ActionUpdate) {
  const keys = new Set([...Object.keys(update.before_values), ...Object.keys(update.after_values)])
  return [...keys]
    .filter((key) => JSON.stringify(update.before_values[key]) !== JSON.stringify(update.after_values[key]))
    .map((key) => ({ key, label: auditFieldLabels[key] ?? key, before: update.before_values[key], after: update.after_values[key] }))
}

function formatAuditValue(key: string, value: unknown, profiles: { id: string; display_name: string }[]) {
  if (value === null || value === undefined || value === '') return 'Kosong'
  if (key === 'pic_id') return profiles.find((person) => person.id === value)?.display_name ?? 'PIC tidak tersedia'
  if (key === 'status' && typeof value === 'string') return auditStatusLabels[value] ?? value
  if ((key === 'start_date' || key === 'due_date') && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
  }
  if (key === 'deleted_at' && typeof value === 'string') return formatWitaTimestamp(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function ActionDetailPage() {
  const { id } = useParams(); const { profile } = useAuth(); const navigate = useNavigate()
  const [action, setAction] = useState<ActionRecord | null>(null); const [updates, setUpdates] = useState<ActionUpdate[]>([]); const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([])
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [picId, setPicId] = useState(''); const [startDate, setStartDate] = useState(''); const [dueDate, setDueDate] = useState(''); const [status, setStatus] = useState<ActionStatus>('OPEN'); const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null)
  const fetchData = async (actionId: string) => {
    const [nextAction, nextUpdates, nextProfiles] = await Promise.all([getAction(actionId), listActionUpdates(actionId), listActionProfiles()])
    return { nextAction, nextUpdates, nextProfiles }
  }
  const applyData = (nextAction: ActionRecord, nextUpdates: ActionUpdate[], nextProfiles: { id: string; display_name: string }[]) => { setAction(nextAction); setUpdates(nextUpdates); setProfiles(nextProfiles); setTitle(nextAction.title); setDescription(nextAction.description ?? ''); setPicId(nextAction.pic_id); setStartDate(nextAction.start_date); setDueDate(nextAction.due_date); setStatus(nextAction.status) }
  useEffect(() => {
    let active = true
    if (!id) return () => { active = false }
    void fetchData(id).then(({ nextAction, nextUpdates, nextProfiles }) => { if (active) { applyData(nextAction, nextUpdates, nextProfiles); setLoading(false) } }).catch((reason: Error) => { if (active) { setError(reason.message); setLoading(false) } })
    return () => { active = false }
  }, [id])
  const canManage = Boolean(profile && action && (profile.role === 'ADMIN' || profile.id === action.owner_id)); const canUpdateStatus = Boolean(profile && action && (canManage || profile.id === action.pic_id))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!action || !canUpdateStatus) return
    const agreementChanged = canManage && (
      title !== action.title ||
      description !== (action.description ?? '') ||
      picId !== action.pic_id ||
      startDate !== action.start_date ||
      dueDate !== action.due_date
    )
    if (agreementChanged && !note.trim()) {
      setError('Alasan wajib diisi untuk perubahan judul, deskripsi, PIC, atau jadwal.')
      return
    }
    setSaving(true); setError(null)
    try {
      const patch: Record<string, unknown> = { status }
      if (canManage) Object.assign(patch, { title, description, pic_id: picId, start_date: startDate, due_date: dueDate })
      await updateAction(action.id, action.version, patch, note)
      setNote('')
      const refreshed = await fetchData(action.id)
      applyData(refreshed.nextAction, refreshed.nextUpdates, refreshed.nextProfiles)
    } catch (reason) {
      setError(reason instanceof Error && reason.message === 'CONFLICT' ? 'Data berubah; muat ulang sebelum menyimpan.' : reason instanceof Error ? reason.message : 'Tindak lanjut gagal diperbarui.')
    } finally { setSaving(false) }
  }
  async function remove() {
    if (!action || !canManage) return
    if (!window.confirm(`Hapus task “${action.title}” dari tracker? Task akan disembunyikan dari tracker dan dashboard. Riwayat perubahan tetap disimpan.`)) return
    setSaving(true); setError(null)
    try {
      await deleteAction(action.id, action.version)
      navigate('/actions')
    } catch (reason) {
      setError(reason instanceof Error && reason.message === 'CONFLICT' ? 'Task berubah sejak dibuka. Muat ulang sebelum mencoba lagi.' : reason instanceof Error ? reason.message : 'Task gagal dihapus dari tracker.')
    } finally { setSaving(false) }
  }
  if (loading) return <section className="empty-state"><p>Memuat tindak lanjut…</p></section>
  if (!action) return <section className="empty-state"><h2>Tindak lanjut tidak tersedia</h2><p>{error ?? 'Data tidak ditemukan.'}</p><Link className="button button--primary" to="/actions">Kembali ke tracker</Link></section>
  return <section className="action-detail" aria-labelledby="action-detail-title"><Link className="back-link" to="/actions">← Kembali ke tracker</Link><div className="section-heading"><div><p className="eyebrow">{action.kind === 'PENDING_MATTER' ? 'Pending matter' : 'Task'}</p><h2 id="action-detail-title">Detail tindak lanjut</h2></div><div className="action-detail__tools"><span className={`status-badge status-badge--${action.status.toLowerCase()}`}>{action.status}</span>{canManage && <button className="button button--danger-outline" type="button" disabled={saving} onClick={() => void remove()}><Trash2 size={16} aria-hidden="true" /> Hapus task</button>}</div></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="detail-grid"><form className="editor-card action-form" onSubmit={submit}><label>Judul<input value={title} disabled={!canManage} onChange={(event) => setTitle(event.target.value)} /></label><label>Deskripsi<textarea value={description} disabled={!canManage} onChange={(event) => setDescription(event.target.value)} /></label><label>Status<select value={status} disabled={!canUpdateStatus} onChange={(event) => setStatus(event.target.value as ActionStatus)}>{actionStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>PIC<select value={picId} disabled={!canManage} onChange={(event) => setPicId(event.target.value)}>{profiles.map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></label><div className="date-grid"><label>Mulai<input type="date" value={startDate} disabled={!canManage} onChange={(event) => setStartDate(event.target.value)} /></label><label>Deadline<input type="date" value={dueDate} disabled={!canManage} onChange={(event) => setDueDate(event.target.value)} /></label></div><label>Catatan perubahan<textarea value={note} disabled={!canUpdateStatus} onChange={(event) => setNote(event.target.value)} placeholder="Alasan wajib untuk perubahan judul, deskripsi, PIC, atau jadwal; catatan wajib untuk status terminal." /></label>{canUpdateStatus ? <button className="button button--primary" disabled={saving} type="submit">{saving ? 'Menyimpan…' : 'Simpan pembaruan'}</button> : <p className="permission-note">Anda dapat membaca detail, tetapi hanya PIC, owner, atau admin yang dapat memperbarui.</p>}</form><aside className="detail-side"><EvidencePanel key={action.id} kind="actions" targetId={action.id} canUpload={canUpdateStatus} /><section className="editor-card"><h3>Sumber notula</h3><p><Link className="table-link" to={`/meetings/${action.meeting_id}`}>{action.meeting_title}</Link></p><p className="muted-copy">Agenda: {action.source_agenda}</p><p className="muted-copy">Versi saat dibaca: {action.version}</p></section><section className="editor-card"><h3>Riwayat perubahan</h3>{updates.length === 0 ? <p className="muted-copy">Belum ada perubahan.</p> : <ol className="audit-list">{updates.map((update) => { const changes = auditChanges(update); return <li key={update.id}><strong>{update.actor_name}</strong><time dateTime={update.created_at}>{formatWitaTimestamp(update.created_at)}</time>{update.note && <p>{update.note}</p>}<details><summary>Lihat rincian perubahan ({changes.length})</summary>{changes.length ? <ul className="audit-changes">{changes.map(({ key, label, before, after }) => <li key={key}><strong>{label}</strong><p><span className="audit-value-label">Sebelum</span><span className="audit-value">{formatAuditValue(key, before, profiles)}</span><span className="audit-change-arrow" aria-hidden="true">→</span><span className="audit-value-label">Sesudah</span><span className="audit-value">{formatAuditValue(key, after, profiles)}</span></p></li>)}</ul> : <p className="audit-unchanged">Tidak ada nilai yang berubah pada catatan ini.</p>}</details></li>})}</ol>}</section></aside></div></section>
}
