import { getSupabaseClient } from '../../lib/supabase'

export type EvidenceKind = 'meetings' | 'actions'
export type Evidence = { id: string; path: string; file_name: string; size: number; created_at: string; uploader_name: string }
export const evidenceAccept = '.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx'
const mimeTypes: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
export function evidenceMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return mimeTypes[extension]
}
export function supportsEvidencePreview(fileName: string) {
  const mime = evidenceMimeType(fileName)
  return mime === 'application/pdf' || mime === 'image/jpeg' || mime === 'image/png'
}
export function validateEvidence(file: Pick<File, 'name' | 'size' | 'type'>) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mime = mimeTypes[extension]
  if (!mime || (file.type && file.type !== mime && file.type !== 'application/octet-stream')) throw new Error('Gunakan PDF, JPG, PNG, WebP, DOCX, atau XLSX.')
  if (file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error('File harus berisi data dan maksimal 10 MB.')
  return mime
}
export async function listEvidence(kind: EvidenceKind, id: string, offset = 0) {
  const { data, error } = await getSupabaseClient().rpc('list_evidence', { p_kind: kind, p_id: id, p_offset: offset })
  if (error) throw new Error('Evidence tidak dapat dimuat. Coba lagi atau periksa hak akses Anda.')
  const rows = (data ?? []) as Evidence[]
  return { rows: rows.slice(0, 20), hasMore: rows.length > 20 }
}
export function evidencePath(kind: EvidenceKind, id: string, fileName: string) {
  const safeName = fileName.normalize('NFKD').replace(/[^a-zA-Z0-9_. -]/g, '_').slice(-160)
  return `${kind}/${id}/${crypto.randomUUID()}--${safeName}`
}
export async function uploadEvidence(path: string, file: File) {
  const contentType = validateEvidence(file)
  const client = getSupabaseClient()
  const { error } = await client.storage.from('evidence').upload(path, file, { contentType, upsert: false })
  if (error) {
    // A retry uses the same object key. Resolve a lost success response before reporting failure.
    const existing = await client.storage.from('evidence').download(path)
    if (!existing.error) return
    throw new Error('Unggah gagal. Periksa koneksi, ukuran file, dan hak akses lalu coba lagi.')
  }
}
export async function readEvidence(evidence: Evidence) {
  const { data, error } = await getSupabaseClient().storage.from('evidence').download(evidence.path)
  if (error) throw new Error('File tidak dapat dibuka. Periksa koneksi atau hak akses Anda.')
  const mime = evidenceMimeType(evidence.file_name)
  return mime ? new Blob([data], { type: mime }) : data
}
export async function downloadEvidence(evidence: Evidence) {
  const data = await readEvidence(evidence)
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url; link.download = evidence.file_name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
