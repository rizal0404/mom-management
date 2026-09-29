import { EvidencePanel } from '../evidence/EvidencePanel'
import { useAuth } from '../auth/AuthProvider'
import { CalendarDays, ChevronRight, ClipboardList, Home, ListChecks, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useUnsavedChanges } from '../../app/useUnsavedChanges'
import { deleteMeetingDraft, finalizeMeeting, getMeetingDraft, listActiveProfiles, saveMeetingDraft, type ActiveProfile, type MeetingDetail, type MeetingDraft } from './meetingService'
import { FinalMeetingView } from './FinalMeetingView'
import { formatWitaDateTimeInput, parseWitaDateTimeInput } from '../../lib/witaDateTime'

type Participant = MeetingDraft['participants'][number]
type Item = MeetingDraft['items'][number]
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const participant = (): Participant => ({ display_name_snapshot: '' })
const item = (position: number): Item => ({ position, agenda: '', discussion: '', result: '', kind: 'NOTE' })
const saveStatusLabel: Record<SaveStatus, string> = {
  idle: 'Belum disimpan',
  saving: 'Menyimpan…',
  saved: 'Tersimpan ✓',
  error: 'Gagal ✗',
}

const saveStatusClass: Record<SaveStatus, string> = {
  idle: 'save-indicator--idle',
  saving: 'save-indicator--saving',
  saved: 'save-indicator--saved',
  error: 'save-indicator--error',
}

export function MeetingEditorPage() {
  const { profile } = useAuth()
  const [ownerId, setOwnerId] = useState<string>()
  const canUploadEvidence = Boolean(profile && (profile.role === 'ADMIN' || profile.id === ownerId))
  const navigate = useNavigate()
  const { id } = useParams()
  const { setDirty: setGlobalDirty, allowNextNavigation } = useUnsavedChanges()
  const titleRef = useRef<HTMLInputElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const finalizeButtonRef = useRef<HTMLButtonElement>(null)
  const finalizeCancelRef = useRef<HTMLButtonElement>(null)
  const finalizeDialogRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [locationOrLink, setLocationOrLink] = useState('')
  const [chairName, setChairName] = useState('')
  const [people, setPeople] = useState<Participant[]>([participant()])
  const [items, setItems] = useState<Item[]>([item(1)])
  const [profiles, setProfiles] = useState<ActiveProfile[]>([])
  const [version, setVersion] = useState<number>()
  const [isFinal, setIsFinal] = useState(false)
  const [loadedMeetingId, setLoadedMeetingId] = useState<string | null>(null)
  const [meetingLoadFailure, setMeetingLoadFailure] = useState<{ id: string; message: string } | null>(null)
  const [meetingLoadRetry, setMeetingLoadRetry] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isDirty, setIsDirty] = useState(false)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const pendingMeetingNavigation = useRef<string | null>(null)

  useEffect(() => {
    setGlobalDirty(isDirty)
    return () => setGlobalDirty(false)
  }, [isDirty, setGlobalDirty])

  useEffect(() => {
    if (!showFinalizeConfirm) return
    finalizeCancelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (saving) return
        event.preventDefault()
        setShowFinalizeConfirm(false)
        finalizeButtonRef.current?.focus()
      }
      if (event.key !== 'Tab') return
      const buttons = [...(finalizeDialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
      if (!buttons.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showFinalizeConfirm, saving])

  useEffect(() => {
    const meetingId = pendingMeetingNavigation.current
    if (!meetingId || isDirty) return
    pendingMeetingNavigation.current = null
    navigate(`/meetings/${meetingId}`, { replace: true })
  }, [isDirty, navigate])

  // Track dirty state
  const markDirty = useCallback(() => {
    setIsDirty(true)
    setSaveStatus('idle')
  }, [])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  useEffect(() => { void listActiveProfiles().then(setProfiles).catch((reason: Error) => setError(reason.message)) }, [])

  const applyMeeting = useCallback((meeting: MeetingDetail) => {
    setOwnerId(meeting.owner_id)
    setTitle(meeting.title)
    setStartsAt(formatWitaDateTimeInput(meeting.starts_at))
    setLocationOrLink(meeting.location_or_link ?? '')
    setChairName(meeting.chair_name ?? '')
    setVersion(meeting.version)
    setIsFinal(meeting.status === 'FINAL')
    setPeople(meeting.meeting_participants.length ? meeting.meeting_participants : [participant()])
    setItems(meeting.meeting_items.length ? meeting.meeting_items : [item(1)])
  }, [])

  useEffect(() => {
    if (!id) return
    let active = true
    void getMeetingDraft(id).then((meeting) => {
      if (!active) return
      applyMeeting(meeting)
      setLoadedMeetingId(id)
      setMeetingLoadFailure(null)
      setIsDirty(false); setSaveStatus('saved')
    }).catch((reason: Error) => {
      if (active) setMeetingLoadFailure({ id, message: reason.message })
    })
    return () => { active = false }
  }, [applyMeeting, id, meetingLoadRetry])

  function updateItem(index: number, changes: Partial<Item>) {
    setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, ...changes } : entry))
    markDirty()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Judul rapat wajib diisi.')
      titleRef.current?.focus()
      return
    }
    let startsAtUtc: string | null
    try {
      startsAtUtc = startsAt ? parseWitaDateTimeInput(startsAt) : null
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Waktu rapat tidak valid.')
      return
    }
    setSaving(true); setError(null); setSaveStatus('saving')
    try {
      const meeting = await saveMeetingDraft({ id, title, starts_at: startsAtUtc, location_or_link: locationOrLink || null, chair_name: chairName || null, participants: people.filter((entry) => entry.display_name_snapshot.trim()), items: items.map((entry, index) => ({ ...entry, position: index + 1 })).filter((entry) => entry.agenda.trim()) }, version)
      setVersion(meeting.version)
      setIsDirty(false); setGlobalDirty(false); setSaveStatus('saved')
      if (!id) {
        allowNextNavigation()
        pendingMeetingNavigation.current = meeting.id
      }
    } catch (reason) {
      setSaveStatus('error')
      setError(reason instanceof Error && reason.message === 'CONFLICT' ? 'Data berubah; muat ulang.' : reason instanceof Error ? reason.message : 'Gagal disimpan.')
    } finally { setSaving(false) }
  }

  // Count actionable items for confirmation dialog
  const taskCount = items.filter((entry) => entry.kind === 'TASK' && entry.agenda.trim()).length
  const pendingCount = items.filter((entry) => entry.kind === 'PENDING_MATTER' && entry.agenda.trim()).length

  function requestFinalisation() {
    if (isDirty) {
      setError('Simpan draf terlebih dahulu sebelum finalisasi.')
      saveButtonRef.current?.focus()
      return
    }
    setError(null)
    setShowFinalizeConfirm(true)
  }

  function cancelFinalisation() {
    if (saving) return
    setShowFinalizeConfirm(false)
    finalizeButtonRef.current?.focus()
  }

  async function finalise() {
    if (!id || version === undefined) return
    if (isDirty) {
      setShowFinalizeConfirm(false)
      setError('Simpan draf terlebih dahulu sebelum finalisasi.')
      saveButtonRef.current?.focus()
      return
    }
    setSaving(true); setError(null); setSaveStatus('saving')
    try {
      await finalizeMeeting(id, version)
      const finalizedMeeting = await getMeetingDraft(id)
      applyMeeting(finalizedMeeting)
      setIsDirty(false); setSaveStatus('saved')
    } catch (reason) {
      setSaveStatus('error')
      setError(reason instanceof Error ? reason.message : 'Finalisasi gagal.')
    } finally { setSaving(false); setShowFinalizeConfirm(false) }
  }

  if (id && loadedMeetingId !== id) {
    const failure = meetingLoadFailure?.id === id ? meetingLoadFailure : null
    return failure
      ? <section className="empty-state" role="alert"><h3>Notula tidak dapat dimuat</h3><p>{failure.message}</p><button className="button button--primary" type="button" onClick={() => setMeetingLoadRetry((value) => value + 1)}>Coba lagi</button></section>
      : <section className="empty-state" aria-live="polite"><h3>Memuat detail notula</h3><p>Mengambil data rapat…</p></section>
  }
  if (isFinal) return <FinalMeetingView id={id} title={title} startsAt={startsAt} chairName={chairName} locationOrLink={locationOrLink} people={people} items={items} profiles={profiles} canUploadEvidence={canUploadEvidence} />
  return <section className="meeting-editor meeting-editor--draft" aria-labelledby="meeting-form-title">
    <nav className="meeting-detail__breadcrumb" aria-label="Breadcrumb">
      <Link to="/meetings"><Home size={15} aria-hidden="true" /><span>Notula Rapat</span></Link>
      <ChevronRight size={14} aria-hidden="true" />
      <span aria-current="page">{id ? 'Edit Draf' : 'Buat Draf'}</span>
    </nav>

    <header className="meeting-draft__hero">
      <div>
        <p className="eyebrow">{id ? 'DRAF RAPAT' : 'NOTULA'}</p>
        <div className="meeting-detail__title-row">
          <h2 id="meeting-form-title">{id ? 'Edit draf rapat' : 'Buat draf rapat'}</h2>
          {id && <span className="meeting-draft__status"><ClipboardList size={15} aria-hidden="true" /> Draf</span>}
        </div>
        <p>Catat informasi, peserta, dan hasil pembahasan. Draf dapat dilanjutkan dan disimpan sebelum finalisasi.</p>
      </div>
    </header>

    <form className="meeting-draft__form" onSubmit={submit} aria-busy={saving}>
      <section className="editor-card meeting-draft__card" aria-labelledby="meeting-info-title" inert={saving}>
        <header className="meeting-draft__card-heading">
          <span className="meeting-draft__section-icon"><CalendarDays size={20} aria-hidden="true" /></span>
          <div><h3 id="meeting-info-title">Informasi Rapat</h3><p>Data pokok rapat yang akan dicatat di notula.</p></div>
        </header>
        <div className="meeting-draft__info-grid">
          <label className="meeting-draft__field--wide">Judul rapat<input ref={titleRef} value={title} onChange={(event) => { setTitle(event.target.value); markDirty() }} /></label>
          <label>Waktu rapat (WITA)<input type="datetime-local" value={startsAt} onChange={(event) => { setStartsAt(event.target.value); markDirty() }} /></label>
          <label>Pimpinan rapat<input value={chairName} onChange={(event) => { setChairName(event.target.value); markDirty() }} /></label>
          <label className="meeting-draft__field--wide">Lokasi atau tautan<input value={locationOrLink} onChange={(event) => { setLocationOrLink(event.target.value); markDirty() }} /></label>
        </div>
      </section>

      <section className="editor-card meeting-draft__card" aria-labelledby="meeting-people-title" inert={saving}>
        <header className="meeting-draft__card-heading meeting-draft__card-heading--action">
          <span className="meeting-draft__section-icon"><Users size={20} aria-hidden="true" /></span>
          <div><h3 id="meeting-people-title">Peserta Rapat</h3><p>Tambahkan peserta internal maupun eksternal.</p></div>
          <div className="meeting-draft__heading-tools">
            <span className="meeting-detail__count">{people.filter((entry) => entry.display_name_snapshot.trim()).length} peserta</span>
            <button className="button button--quiet" type="button" onClick={() => { setPeople((current) => [...current, participant()]); markDirty() }}><UserPlus size={16} aria-hidden="true" /> Tambah peserta</button>
          </div>
        </header>
        <ol className="meeting-draft__participant-list">{people.map((entry, index) => <li className="meeting-draft__participant-row" key={entry.id ?? index}>
          <span className={`meeting-detail__avatar meeting-detail__avatar--${index % 4}`} aria-hidden="true">{entry.display_name_snapshot.trim() ? entry.display_name_snapshot.trim().charAt(0).toLocaleUpperCase('id-ID') : String(index + 1).padStart(2, '0')}</span>
          <input aria-label={`Peserta ${index + 1}`} placeholder="Nama peserta" value={entry.display_name_snapshot} onChange={(event) => { setPeople((current) => current.map((person, personIndex) => personIndex === index ? { ...person, display_name_snapshot: event.target.value } : person)); markDirty() }} />
          <button className="button button--quiet meeting-draft__remove" type="button" aria-label={`Hapus peserta ${index + 1}`} onClick={() => { setPeople((current) => current.length === 1 ? [participant()] : current.filter((_, personIndex) => personIndex !== index)); markDirty() }}><Trash2 size={16} aria-hidden="true" /><span>Hapus</span></button>
        </li>)}</ol>
      </section>

      <section className="editor-card meeting-draft__card" aria-labelledby="meeting-items-title" inert={saving}>
        <header className="meeting-draft__card-heading meeting-draft__card-heading--action">
          <span className="meeting-draft__section-icon"><ListChecks size={20} aria-hidden="true" /></span>
          <div><h3 id="meeting-items-title">Agenda &amp; Hasil Rapat</h3><p>Catat pembahasan dan hasil untuk setiap agenda.</p></div>
          <div className="meeting-draft__heading-tools"><span className="meeting-detail__count">{items.length} agenda</span>
            <button className="button button--quiet" type="button" onClick={() => { setItems((current) => [...current, item(current.length + 1)]); markDirty() }}><Plus size={16} aria-hidden="true" /> Tambah agenda</button>
          </div>
        </header>
        <div className="meeting-draft__agenda-list">{items.map((entry, index) => <fieldset className="meeting-draft__agenda-card" key={entry.id ?? index}>
          <legend className="meeting-draft__sr-only">Agenda {index + 1}</legend>
          <div className="meeting-draft__agenda-heading">
            <span className="meeting-agenda-card__number">{String(index + 1).padStart(2, '0')}</span>
            <label className="meeting-draft__kind">Jenis<select value={entry.kind} onChange={(event) => updateItem(index, { kind: event.target.value as Item['kind'], ...(event.target.value === 'TASK' || event.target.value === 'PENDING_MATTER' ? {} : { draft_pic_id: null, draft_start_date: null, draft_due_date: null }) })}><option value="NOTE">Catatan</option><option value="DECISION">Keputusan</option><option value="TASK">Task</option><option value="PENDING_MATTER">Pending matter</option></select></label>
            <button className="button button--quiet meeting-draft__remove" type="button" aria-label={`Hapus agenda ${index + 1}`} onClick={() => { setItems((current) => current.length === 1 ? [item(1)] : current.filter((_, itemIndex) => itemIndex !== index)); markDirty() }}><Trash2 size={16} aria-hidden="true" /><span>Hapus agenda</span></button>
          </div>
          <div className="meeting-draft__agenda-fields">
            <label className="meeting-draft__field--wide">Agenda<input value={entry.agenda} onChange={(event) => updateItem(index, { agenda: event.target.value })} /></label>
            <label>Pembahasan<textarea value={entry.discussion ?? ''} onChange={(event) => updateItem(index, { discussion: event.target.value })} /></label>
            <label>Hasil rapat<textarea value={entry.result ?? ''} onChange={(event) => updateItem(index, { result: event.target.value })} /></label>
          </div>
          {(entry.kind === 'TASK' || entry.kind === 'PENDING_MATTER') && <div className="meeting-draft__action-fields">
            <label>PIC<select value={entry.draft_pic_id ?? ''} onChange={(event) => updateItem(index, { draft_pic_id: event.target.value || null })}><option value="">Pilih PIC aktif</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label>
            <label>Mulai<input type="date" value={entry.draft_start_date ?? ''} onChange={(event) => updateItem(index, { draft_start_date: event.target.value || null })} /></label>
            <label>Jatuh tempo<input type="date" value={entry.draft_due_date ?? ''} onChange={(event) => updateItem(index, { draft_due_date: event.target.value || null })} /></label>
          </div>}
        </fieldset>)}</div>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <footer className="meeting-draft__actions">
        <span className={`save-indicator ${saveStatusClass[saveStatus]}`} aria-live="polite">{saveStatusLabel[saveStatus]}</span>
        <div className="meeting-draft__action-buttons">
          <button ref={saveButtonRef} className="button button--primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan draf'}</button>
          {id && <button ref={finalizeButtonRef} className="button button--quiet" type="button" disabled={saving} onClick={requestFinalisation}>Finalisasi</button>}
          {id && <button className="button button--danger-outline" type="button" disabled={saving} onClick={() => { if (version !== undefined && confirm('Hapus draf?')) void deleteMeetingDraft(id, version).then(() => { setIsDirty(false); navigate('/meetings') }).catch((reason: Error) => setError(reason.message)) }}><Trash2 size={16} aria-hidden="true" /> Hapus draf</button>}
        </div>
      </footer>
    </form>

    <EvidencePanel key={id ?? 'new'} kind="meetings" targetId={id} canUpload={canUploadEvidence} title="Lampiran & Evidence" description="Dokumen pendukung rapat beserta nama pengunggah dan waktu unggah." className="meeting-detail__evidence meeting-draft__evidence" />
  {showFinalizeConfirm && <div className="modal-backdrop" onClick={cancelFinalisation}>
    <div ref={finalizeDialogRef} className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="finalize-title" onClick={(event) => event.stopPropagation()}>
      <h3 id="finalize-title">Konfirmasi finalisasi</h3>
      <p>Finalisasi akan membuat <strong>{taskCount} task</strong> dan <strong>{pendingCount} pending matter</strong> sebagai tindak lanjut.</p>
      <p>Notula menjadi tetap dan tidak dapat diubah setelah finalisasi. Lanjutkan?</p>
      <div className="modal-actions">
        <button ref={finalizeCancelRef} className="button button--quiet" type="button" onClick={cancelFinalisation} disabled={saving}>Batal</button>
        <button className="button button--primary" type="button" onClick={() => void finalise()} disabled={saving}>{saving ? 'Memfinalisasi…' : 'Ya, finalisasi'}</button>
      </div>
    </div>
  </div>}
  </section>
}
