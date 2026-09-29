import { useEffect, useRef, useState } from 'react'
import { Download, Maximize2, Minus, Paperclip, Plus, Upload, X } from 'lucide-react'
import { downloadEvidence, evidenceAccept, evidencePath, listEvidence, readEvidence, supportsEvidencePreview, uploadEvidence, validateEvidence, type Evidence, type EvidenceKind } from './evidenceService'

export function EvidencePanel({ kind, targetId, canUpload, title: titleOverride, description: descriptionOverride, className }: { kind: EvidenceKind; targetId?: string; canUpload: boolean; title?: string; description?: string; className?: string }) {
  const [rows, setRows] = useState<Evidence[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(Boolean(targetId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [selection, setSelection] = useState<{ file: File; path: string } | null>(null)
  const [reload, setReload] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const viewerDialog = useRef<HTMLDialogElement>(null)
  const viewerObjectUrl = useRef<string | null>(null)
  const viewerRequest = useRef(0)
  const [preview, setPreview] = useState<Evidence | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const title = titleOverride ?? (kind === 'meetings' ? 'Evidence rapat' : 'Bukti penyelesaian tindak lanjut')
  const previewFormat = preview?.file_name.toLowerCase().endsWith('.pdf') ? 'PDF' : preview?.file_name.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG'

  function revokePreviewUrl() {
    if (viewerObjectUrl.current) URL.revokeObjectURL(viewerObjectUrl.current)
    viewerObjectUrl.current = null
  }

  async function openPreview(evidence: Evidence) {
    const request = ++viewerRequest.current
    revokePreviewUrl()
    setPreview(evidence); setPreviewUrl(null); setPreviewLoading(true); setPreviewError(null); setZoom(100)
    try {
      const blob = await readEvidence(evidence)
      const url = URL.createObjectURL(blob)
      if (request !== viewerRequest.current) { URL.revokeObjectURL(url); return }
      viewerObjectUrl.current = url
      setPreviewUrl(url)
    } catch (reason) {
      if (request === viewerRequest.current) setPreviewError((reason as Error).message)
    } finally {
      if (request === viewerRequest.current) setPreviewLoading(false)
    }
  }

  function closePreview() {
    viewerRequest.current += 1
    revokePreviewUrl()
    setPreview(null); setPreviewUrl(null); setPreviewLoading(false); setPreviewError(null); setZoom(100)
  }

  useEffect(() => {
    const dialog = viewerDialog.current
    if (!dialog) return
    if (preview && !dialog.open) dialog.showModal()
    else if (!preview && dialog.open) dialog.close()
  }, [preview])

  useEffect(() => () => {
    viewerRequest.current += 1
    if (viewerObjectUrl.current) URL.revokeObjectURL(viewerObjectUrl.current)
  }, [])

  useEffect(() => {
    if (!targetId) return
    let active = true
    void listEvidence(kind, targetId).then((result) => { if (active) { setRows(result.rows); setHasMore(result.hasMore); setError(null) } })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [kind, targetId, reload])

  async function upload() {
    if (!selection || busy) return
    setBusy(true); setError(null); setSuccess('')
    try {
      await uploadEvidence(selection.path, selection.file)
      setSelection(null)
      if (fileInput.current) fileInput.current.value = ''
      setSuccess('Evidence berhasil diunggah.'); setReload((value) => value + 1)
    } catch (reason) { setError((reason as Error).message) }
    finally { setBusy(false) }
  }
  async function more() {
    if (!targetId) return
    setBusy(true); setError(null)
    try { const result = await listEvidence(kind, targetId, rows.length); setRows((current) => [...current, ...result.rows]); setHasMore(result.hasMore) }
    catch (reason) { setError((reason as Error).message) }
    finally { setBusy(false) }
  }
  async function download(row: Evidence) {
    setBusy(true); setError(null)
    try { await downloadEvidence(row) } catch (reason) { setError((reason as Error).message) }
    finally { setBusy(false) }
  }
  return <section className={`editor-card evidence-panel ${className ?? ''}`} aria-label={title}>
    <h3><Paperclip size={20} aria-hidden="true" /> {title}</h3>
    <p className="muted-copy">{descriptionOverride ?? 'Lampiran tambahan dengan pengunggah dan waktu unggah. File yang tersimpan tidak dapat ditimpa atau dihapus.'}</p>
    {!targetId ? <p>Simpan draf terlebih dahulu untuk menambahkan evidence.</p> : <>
      {canUpload && <div className="evidence-upload">
        <label>File evidence<input ref={fileInput} type="file" accept={evidenceAccept} disabled={busy} onChange={(event) => {
          setSelection(null); setError(null); setSuccess('')
          const file = event.target.files?.[0]
          if (!file) return
          try { validateEvidence(file); setSelection({ file, path: evidencePath(kind, targetId, file.name) }) }
          catch (reason) { setError((reason as Error).message); event.target.value = '' }
        }} /></label>
        <p className="muted-copy">PDF, JPG, PNG, WebP, DOCX, XLSX · Maksimal 10 MB/file. Unggah disimpan terpisah dari perubahan formulir dan status.</p>
        <p className="evidence-selection" role="status">{selection ? `${selection.file.name} siap diunggah. Klik Unggah evidence untuk menyimpan.` : 'Belum ada file dipilih. Klik Pilih file evidence untuk memilih berkas.'}</p>
        <button className="button button--quiet" type="button" disabled={busy} onClick={() => { if (selection) void upload(); else fileInput.current?.click() }}><Upload size={16} /> {busy ? 'Memproses…' : selection ? 'Unggah evidence' : 'Pilih file evidence'}</button>
      </div>}
      {success && <p role="status">{success}</p>}
      {error && <div role="alert"><p className="form-error">{error}</p><button type="button" className="button button--quiet" disabled={busy} onClick={() => { setLoading(true); setReload((value) => value + 1) }}>Muat ulang daftar evidence</button></div>}
      {loading ? <p>Memuat evidence…</p> : rows.length === 0 && !error ? <p className="muted-copy">Belum ada evidence.</p> : <ul className="evidence-list">{rows.map((row) => <li key={row.id}>
        <div><strong>{row.file_name}</strong><span>{row.uploader_name} · {new Date(row.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA · {(row.size / 1024).toFixed(1)} KB</span></div>
        <div className="evidence-list__actions">{supportsEvidencePreview(row.file_name) && <button className="button button--quiet" type="button" disabled={busy} onClick={() => void openPreview(row)} aria-label={`Pratinjau ${row.file_name}`}><Maximize2 size={16} /> Lihat</button>}<button className="button button--quiet" type="button" disabled={busy} onClick={() => void download(row)} aria-label={`Unduh ${row.file_name}`}><Download size={16} /> Unduh</button></div>
      </li>)}</ul>}
      {hasMore && <button type="button" className="button button--quiet" disabled={busy} onClick={() => void more()}>Evidence berikutnya</button>}
    </>}
    <dialog ref={viewerDialog} className="evidence-viewer" aria-labelledby="evidence-viewer-title" onCancel={(event) => { event.preventDefault(); closePreview() }} onClick={(event) => { if (event.target === event.currentTarget) closePreview() }}>
      {preview && <div className="evidence-viewer__layout">
        <header className="evidence-viewer__header">
          <div className="evidence-viewer__heading"><p className="eyebrow">Pratinjau {previewFormat}</p><h2 id="evidence-viewer-title" title={preview.file_name}>{preview.file_name}</h2></div>
          <div className="evidence-viewer__tools" aria-label="Kontrol viewer">
            <button className="button button--quiet" type="button" disabled={zoom <= 50 || previewLoading} onClick={() => setZoom((value) => Math.max(50, value - 25))} aria-label="Perkecil"><Minus size={16} /></button>
            <span className="evidence-viewer__zoom" aria-live="polite">{zoom}%</span>
            <button className="button button--quiet" type="button" disabled={zoom >= 300 || previewLoading} onClick={() => setZoom((value) => Math.min(300, value + 25))} aria-label="Perbesar"><Plus size={16} /></button>
            <button className="button button--quiet" type="button" disabled={zoom === 100 || previewLoading} onClick={() => setZoom(100)}><Maximize2 size={16} /> 100%</button>
            <button className="button button--quiet" type="button" onClick={closePreview} aria-label="Tutup pratinjau"><X size={18} /></button>
          </div>
        </header>
        <div className="evidence-viewer__stage" aria-busy={previewLoading}>
          {previewLoading && <p className="evidence-viewer__message" role="status">Memuat pratinjau…</p>}
          {previewError && <div className="evidence-viewer__message" role="alert"><p>{previewError}</p><button className="button button--quiet" type="button" onClick={() => void openPreview(preview)}>Coba lagi</button></div>}
          {!previewLoading && !previewError && previewUrl && (preview.file_name.toLowerCase().endsWith('.pdf')
            ? <iframe className="evidence-viewer__pdf" title={`Pratinjau ${preview.file_name}`} src={previewUrl} style={{ width: `${zoom}%`, height: `${zoom}%` }} />
            : <img className="evidence-viewer__image" src={previewUrl} alt={`Pratinjau ${preview.file_name}`} style={{ width: `${zoom}%` }} />)}
        </div>
      </div>}
    </dialog>
  </section>
}
