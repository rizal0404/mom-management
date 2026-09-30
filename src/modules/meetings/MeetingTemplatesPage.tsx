import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ClipboardList, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useUnsavedChanges } from '../../app/useUnsavedChanges'
import {
  createMeetingDraftFromTemplate,
  deleteMeetingTemplate,
  listMeetingTemplates,
  saveMeetingTemplate,
  type MeetingTemplate,
  type MeetingTemplateDraft,
  type MeetingTemplateKind,
} from './meetingService'

type TemplateForm = { name: string; initialTitle: string; items: MeetingTemplateDraft['items'] }

const emptyItem = (position = 1): MeetingTemplateDraft['items'][number] => ({
  position,
  agenda: '',
  kind: 'NOTE',
})
const emptyForm = (): TemplateForm => ({ name: '', initialTitle: '', items: [emptyItem()] })
const kindLabels: Record<MeetingTemplateKind, string> = {
  NOTE: 'Catatan',
  DECISION: 'Keputusan',
  TASK: 'Task',
  PENDING_MATTER: 'Pending matter',
}

function toForm(template: MeetingTemplate): TemplateForm {
  return {
    name: template.name,
    initialTitle: template.initial_title ?? '',
    items: [...template.meeting_template_items]
      .sort((left, right) => left.position - right.position)
      .map(({ position, agenda, kind }) => ({ position, agenda, kind })),
  }
}

export function MeetingTemplatesPage() {
  const navigate = useNavigate()
  const { setDirty: setGlobalDirty } = useUnsavedChanges()
  const nameRef = useRef<HTMLInputElement>(null)
  const [templates, setTemplates] = useState<MeetingTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const selected = templates.find((template) => template.id === selectedId) ?? null
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const formKey = JSON.stringify(form)
  const [savedFormKey, setSavedFormKey] = useState(formKey)
  const dirty = formKey !== savedFormKey
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [instantiatingId, setInstantiatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

  function changeSelectedId(id: string | null) {
    selectedIdRef.current = id
    setSelectedId(id)
  }

  useEffect(() => {
    let active = true
    void listMeetingTemplates().then((result) => {
      if (!active) return
      setTemplates(result)
      const currentId = selectedIdRef.current
      if (currentId) {
        const current = result.find((template) => template.id === currentId)
        if (current) {
          const nextForm = toForm(current)
          setForm(nextForm)
          setSavedFormKey(JSON.stringify(nextForm))
        } else {
          changeSelectedId(null)
          const nextForm = emptyForm()
          setForm(nextForm)
          setSavedFormKey(JSON.stringify(nextForm))
        }
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Template agenda tidak dapat dimuat.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadAttempt])
  useEffect(() => {
    setGlobalDirty(dirty)
    return () => setGlobalDirty(false)
  }, [dirty, setGlobalDirty])

  const templateDescription = useMemo(() => {
    if (!templates.length) return 'Setiap template hanya dapat dilihat dan dikelola oleh pembuatnya.'
    return `${templates.length} template pribadi · perubahan template tidak mengubah draf yang sudah dibuat.`
  }, [templates.length])

  function startNewTemplate() {
    if (dirty && !window.confirm('Batalkan perubahan template yang belum disimpan?')) return
    const nextForm = emptyForm()
    changeSelectedId(null)
    setForm(nextForm)
    setSavedFormKey(JSON.stringify(nextForm))
    setError(null)
    setStatus('Template baru')
    nameRef.current?.focus()
  }

  function selectTemplate(template: MeetingTemplate) {
    if (dirty && !window.confirm('Batalkan perubahan template yang belum disimpan?')) return
    const nextForm = toForm(template)
    changeSelectedId(template.id)
    setForm(nextForm)
    setSavedFormKey(JSON.stringify(nextForm))
    setError(null)
    setStatus('')
  }

  function discardChanges() {
    const nextForm = selected ? toForm(selected) : emptyForm()
    setForm(nextForm)
    setSavedFormKey(JSON.stringify(nextForm))
    setError(null)
    setStatus('Perubahan dibatalkan.')
  }

  function retryLoad() {
    setError(null)
    setLoading(true)
    setLoadAttempt((value) => value + 1)
  }

  function updateItem(index: number, changes: Partial<MeetingTemplateDraft['items'][number]>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item),
    }))
    setStatus('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Nama template wajib diisi.')
      nameRef.current?.focus()
      return
    }
    if (form.items.length === 0 || form.items.some((item) => !item.agenda.trim())) {
      setError('Isi agenda untuk setiap baris template.')
      return
    }
    setSaving(true)
    setError(null)
    setStatus('Menyimpan template…')
    const payload: MeetingTemplateDraft = {
      ...(selectedId ? { id: selectedId } : {}),
      name: form.name.trim(),
      initial_title: form.initialTitle.trim() || null,
      items: form.items.map((item, index) => ({
        position: index + 1,
        agenda: item.agenda.trim(),
        kind: item.kind,
      })),
    }
    try {
      const row = await saveMeetingTemplate(payload, selected?.version)
      const saved: MeetingTemplate = {
        ...row,
        meeting_template_items: payload.items.map((item, index) => ({ ...item, id: `local-${index + 1}` })),
      }
      const nextForm = toForm(saved)
      setTemplates((current) => [saved, ...current.filter((template) => template.id !== saved.id)])
      changeSelectedId(saved.id)
      setForm(nextForm)
      setSavedFormKey(JSON.stringify(nextForm))
      setStatus('Template tersimpan.')
    } catch (reason) {
      setStatus('')
      setError(reason instanceof Error && reason.message === 'CONFLICT'
        ? 'Template berubah di sesi lain. Muat ulang sebelum menyimpan lagi.'
        : reason instanceof Error ? reason.message : 'Template agenda gagal disimpan.')
    } finally { setSaving(false) }
  }

  async function removeTemplate(template: MeetingTemplate) {
    if (dirty && selectedId === template.id) {
      setError('Simpan atau batalkan perubahan sebelum menghapus template ini.')
      return
    }
    if (!window.confirm(`Hapus template “${template.name}”? Draf yang sudah dibuat tetap tersimpan.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteMeetingTemplate(template.id, template.version)
      setTemplates((current) => current.filter((entry) => entry.id !== template.id))
      if (selectedId === template.id) {
        const nextForm = emptyForm()
        changeSelectedId(null)
        setForm(nextForm)
        setSavedFormKey(JSON.stringify(nextForm))
      }
      setStatus('Template dihapus. Draf yang sudah dibuat tetap tersimpan.')
    } catch (reason) {
      setError(reason instanceof Error && reason.message === 'CONFLICT'
        ? 'Template berubah di sesi lain. Muat ulang sebelum menghapusnya.'
        : reason instanceof Error ? reason.message : 'Template agenda gagal dihapus.')
    } finally { setDeleting(false) }
  }

  async function instantiateTemplate(template: MeetingTemplate) {
    if (dirty) {
      setError('Simpan atau batalkan perubahan template sebelum membuat draf baru.')
      return
    }
    setInstantiatingId(template.id)
    setError(null)
    try {
      const meeting = await createMeetingDraftFromTemplate(template.id)
      setGlobalDirty(false)
      navigate(`/meetings/${meeting.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Draf rapat dari template gagal dibuat.')
    } finally { setInstantiatingId(null) }
  }

  return <section className="meeting-templates-page" aria-labelledby="meeting-templates-title">
    <div className="section-heading meeting-templates-page__heading">
      <div>
        <p className="eyebrow">Notula · Persiapan rapat</p>
        <h2 id="meeting-templates-title">Template agenda</h2>
        <p className="section-description">{templateDescription}</p>
      </div>
      <div className="meeting-templates-page__heading-actions">
        <Link className="button button--quiet" to="/meetings"><ArrowLeft size={17} aria-hidden="true" /> Kembali ke rapat</Link>
        <button className="button button--primary" type="button" onClick={startNewTemplate} disabled={saving || deleting}><Plus size={17} aria-hidden="true" /> Template baru</button>
      </div>
    </div>

    {error && <div className="form-error meeting-templates-page__error" role="alert">
      <span>{error}</span>
      {(error.includes('memuat') || error.includes('sesi lain')) && <button className="inline-button" type="button" onClick={retryLoad}>Muat ulang</button>}
    </div>}

    <div className="meeting-templates-page__layout">
      <section className="meeting-templates-list editor-card" aria-labelledby="meeting-template-list-title">
        <header className="meeting-templates-list__heading"><ClipboardList size={19} aria-hidden="true" /><div><h3 id="meeting-template-list-title">Template pribadi</h3><p>Hanya Anda yang dapat mengakses template ini.</p></div></header>
        {loading ? <div className="empty-state" aria-live="polite"><h3>Memuat template…</h3></div> : templates.length === 0
          ? <div className="meeting-templates-list__empty"><h4>Belum ada template agenda</h4><p>Simpan struktur agenda rutin agar dapat dipakai pada draf rapat baru.</p><button className="button button--quiet" type="button" onClick={startNewTemplate}>Buat template pertama</button></div>
          : <ul className="meeting-templates-list__items">{templates.map((template) => <li className={`meeting-template-card ${selectedId === template.id ? 'meeting-template-card--selected' : ''}`} key={template.id}>
            <div className="meeting-template-card__copy"><strong>{template.name}</strong><span>{template.meeting_template_items.length} agenda · {template.initial_title || 'Judul memakai nama template'}</span><small>{[...template.meeting_template_items].sort((left, right) => left.position - right.position).map((item) => item.agenda).join(' · ')}</small></div>
            <div className="meeting-template-card__actions">
              <button className="button button--primary" type="button" disabled={instantiatingId !== null || dirty} title={dirty ? 'Simpan atau batalkan perubahan template terlebih dahulu.' : undefined} onClick={() => void instantiateTemplate(template)}>{instantiatingId === template.id ? 'Membuat draf…' : 'Gunakan template'}</button>
              <button className="button button--quiet" type="button" disabled={saving || deleting || dirty} onClick={() => selectTemplate(template)}>Edit</button>
              <button className="icon-button delete-button" type="button" aria-label={`Hapus template ${template.name}`} title="Hapus template" disabled={deleting || instantiatingId === template.id} onClick={() => void removeTemplate(template)}>{deleting && selectedId === template.id ? '…' : <Trash2 size={16} aria-hidden="true" />}</button>
            </div>
          </li>)}</ul>}
      </section>

      <form className="meeting-template-form editor-card" onSubmit={(event) => void submit(event)} aria-busy={saving}>
        <header className="meeting-templates-list__heading"><ClipboardList size={19} aria-hidden="true" /><div><h3>{selected ? 'Edit template' : 'Template baru'}</h3><p>Struktur agenda saja yang akan disalin ke draf baru.</p></div></header>
        <label>Nama template<input ref={nameRef} maxLength={120} value={form.name} onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setStatus('') }} placeholder="Contoh: Rapat evaluasi mingguan" /></label>
        <label>Judul awal (opsional)<input maxLength={250} value={form.initialTitle} onChange={(event) => { setForm((current) => ({ ...current, initialTitle: event.target.value })); setStatus('') }} placeholder="Jika kosong, nama template dipakai" /></label>
        <section className="meeting-template-form__agenda" aria-labelledby="meeting-template-agenda-title">
          <div className="meeting-template-form__agenda-heading"><div><h4 id="meeting-template-agenda-title">Urutan agenda</h4><p>Jenis Task/Pending matter tidak membawa PIC atau jadwal.</p></div><button className="button button--quiet" type="button" disabled={saving} onClick={() => setForm((current) => ({ ...current, items: [...current.items, emptyItem(current.items.length + 1)] }))}><Plus size={16} aria-hidden="true" /> Tambah agenda</button></div>
          <ol className="meeting-template-form__items">{form.items.map((item, index) => <li className="meeting-template-form__item" key={index}>
            <span className="meeting-agenda-card__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <label>Agenda<input maxLength={2000} value={item.agenda} onChange={(event) => updateItem(index, { agenda: event.target.value })} /></label>
            <label>Jenis<select value={item.kind} onChange={(event) => updateItem(index, { kind: event.target.value as MeetingTemplateKind })}><option value="NOTE">Catatan</option><option value="DECISION">Keputusan</option><option value="TASK">Task</option><option value="PENDING_MATTER">Pending matter</option></select><span className="meeting-template-form__kind-hint">{kindLabels[item.kind]}</span></label>
            <button className="button button--quiet meeting-template-form__remove" type="button" aria-label={`Hapus agenda template ${index + 1}`} disabled={saving || form.items.length === 1} onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={15} aria-hidden="true" /> Hapus</button>
          </li>)}</ol>
        </section>
        <p className="meeting-template-form__note">Setiap draf dari template memiliki ID baru. Data rapat, peserta, pembahasan, hasil, PIC, tanggal, evidence, dan status task tidak disalin. Finalisasi tetap memakai validasi notula yang sama.</p>
        {status && <p className="meeting-template-form__status" aria-live="polite">{status}</p>}
        <footer className="meeting-template-form__actions">
          {selected && <button className="button button--danger-outline" type="button" disabled={saving || deleting || dirty} onClick={() => void removeTemplate(selected)}><Trash2 size={16} aria-hidden="true" /> Hapus template</button>}
          {dirty && <button className="button button--quiet" type="button" disabled={saving || deleting} onClick={discardChanges}>Batalkan perubahan</button>}
          <button className="button button--primary" type="submit" disabled={saving || deleting || !dirty}><Save size={16} aria-hidden="true" /> {saving ? 'Menyimpan…' : 'Simpan template'}</button>
        </footer>
      </form>
    </div>
  </section>
}
