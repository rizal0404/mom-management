import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { UserPlus, UsersRound } from 'lucide-react'

import { createManagedUser, createUserSchema, listManagedUsers, updateManagedUser, updateUserSchema, type ManagedUser } from './userManagementService'

type CreateForm = { displayName: string; email: string; password: string; role: 'ADMIN' | 'MEMBER' }
type EditForm = { displayName: string; role: 'ADMIN' | 'MEMBER'; isActive: boolean }

const emptyCreateForm: CreateForm = { displayName: '', email: '', password: '', role: 'MEMBER' }

function errorMessage(reason: unknown) {
  if (reason && typeof reason === 'object' && 'issues' in reason) {
    const issue = (reason as { issues?: { message?: string }[] }).issues?.[0]
    if (issue?.message) return issue.message
  }
  return reason instanceof Error ? reason.message : 'Terjadi kesalahan. Coba lagi.'
}

export function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selected, setSelected] = useState<ManagedUser | null>(null)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const pageSize = 25
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    let cancelled = false
    void listManagedUsers(appliedSearch, page, pageSize)
      .then((result) => {
        if (cancelled) return
        setUsers(result.users)
        setTotal(result.total)
        setError(null)
      })
      .catch((reason: unknown) => { if (!cancelled) setError(errorMessage(reason)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [appliedSearch, page, reloadKey])

  const selectedLabel = useMemo(() => selected ? `Kelola ${selected.display_name}` : 'Kelola pengguna', [selected])

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setPage(1)
    setAppliedSearch(search)
    setReloadKey((value) => value + 1)
  }

  function selectUser(user: ManagedUser | null) {
    setSelected(user)
    setEditForm(user ? { displayName: user.display_name, role: user.role, isActive: user.is_active } : null)
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice(null)
    try {
      const result = await createManagedUser(createUserSchema.parse(createForm))
      setCreateForm(emptyCreateForm)
      selectUser(result.user)
      setNotice('Akun dibuat. Sampaikan kata sandi sementara kepada pengguna melalui saluran aman.')
      setPage(1)
      setAppliedSearch('')
      setSearch('')
      setLoading(true)
      setReloadKey((value) => value + 1)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault()
    if (!selected || !editForm) return
    setSubmitting(true)
    setError(null)
    setNotice(null)
    try {
      const result = await updateManagedUser(updateUserSchema.parse({ id: selected.id, ...editForm }))
      selectUser(result.user)
      setUsers((current) => current.map((user) => user.id === result.user.id ? result.user : user))
      setNotice('Data pengguna diperbarui.')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="user-management">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administrator</p>
          <h2>Kelola pengguna</h2>
          <p className="section-description">Buat akun, atur peran, dan aktifkan atau nonaktifkan akses tim.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-notice" role="status">{notice}</p>}

      <div className="user-management__grid">
        <form className="editor-card user-form" onSubmit={submitCreate}>
          <div className="user-form__title"><UserPlus aria-hidden="true" size={20} /><h3>Tambah pengguna</h3></div>
          <p className="muted-copy">Akun baru langsung aktif. Kata sandi hanya digunakan untuk login awal dan tidak disimpan pada aplikasi.</p>
          <label>Nama tampilan<input aria-label="Nama pengguna baru" autoComplete="name" disabled={submitting} onChange={(event) => setCreateForm((value) => ({ ...value, displayName: event.target.value }))} value={createForm.displayName} /></label>
          <label>Email<input aria-label="Email pengguna baru" autoComplete="email" disabled={submitting} inputMode="email" onChange={(event) => setCreateForm((value) => ({ ...value, email: event.target.value }))} type="email" value={createForm.email} /></label>
          <label>Kata sandi sementara<input aria-label="Kata sandi sementara" autoComplete="new-password" disabled={submitting} onChange={(event) => setCreateForm((value) => ({ ...value, password: event.target.value }))} type="password" value={createForm.password} /></label>
          <label>Peran<select aria-label="Peran pengguna baru" disabled={submitting} onChange={(event) => setCreateForm((value) => ({ ...value, role: event.target.value as CreateForm['role'] }))} value={createForm.role}><option value="MEMBER">Anggota</option><option value="ADMIN">Administrator</option></select></label>
          <button className="button button--primary" disabled={submitting} type="submit">{submitting ? 'Menyimpan…' : 'Buat akun'}</button>
        </form>

        <div className="editor-card user-directory">
          <div className="user-form__title"><UsersRound aria-hidden="true" size={20} /><h3>Direktori pengguna</h3></div>
          <form className="user-search" onSubmit={submitSearch}>
            <label>Cari nama<input aria-label="Cari pengguna" onChange={(event) => setSearch(event.target.value)} value={search} /></label>
            <button className="button button--quiet" type="submit">Cari</button>
          </form>
          {loading ? <p className="muted-copy">Memuat pengguna…</p> : users.length === 0 ? <div className="empty-state"><h3>Pengguna tidak ditemukan</h3><p>Ubah pencarian atau tambahkan pengguna baru.</p></div> : <ul className="user-list">
            {users.map((user) => <li key={user.id}>
              <button aria-pressed={selected?.id === user.id} className={`user-list__item ${selected?.id === user.id ? 'user-list__item--selected' : ''}`} onClick={() => selectUser(user)} type="button">
                <span className="avatar" aria-hidden="true">{user.display_name.slice(0, 1).toUpperCase()}</span>
                <span><strong>{user.display_name}</strong><small>{user.email ?? 'Email tidak tersedia'}</small></span>
                <span className={`user-status ${user.is_active ? 'user-status--active' : 'user-status--inactive'}`}>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </button>
            </li>)}
          </ul>}
          <div className="pagination-controls">
            <span className="result-count">{total} pengguna</span>
            <div><button className="button button--quiet" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((value) => value - 1) }} type="button">Sebelumnya</button><span>Halaman {page} / {pageCount}</span><button className="button button--quiet" disabled={page >= pageCount || loading} onClick={() => { setLoading(true); setPage((value) => value + 1) }} type="button">Berikutnya</button></div>
          </div>
        </div>
      </div>

      {selected && editForm && <form aria-label={selectedLabel} className="editor-card user-edit-form" onSubmit={submitEdit}>
        <div><p className="eyebrow">Pengguna terpilih</p><h3>{selectedLabel}</h3><p className="muted-copy">{selected.email ?? 'Email tidak tersedia'}</p></div>
        <label>Nama tampilan<input aria-label="Nama tampilan" disabled={submitting} onChange={(event) => setEditForm((value) => value ? { ...value, displayName: event.target.value } : value)} value={editForm.displayName} /></label>
        <label>Peran<select aria-label="Peran" disabled={submitting} onChange={(event) => setEditForm((value) => value ? { ...value, role: event.target.value as EditForm['role'] } : value)} value={editForm.role}><option value="MEMBER">Anggota</option><option value="ADMIN">Administrator</option></select></label>
        <label>Status akses<select aria-label="Status akses" disabled={submitting} onChange={(event) => setEditForm((value) => value ? { ...value, isActive: event.target.value === 'true' } : value)} value={String(editForm.isActive)}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></label>
        <div className="user-edit-form__actions"><button className="button button--primary" disabled={submitting} type="submit">{submitting ? 'Menyimpan…' : 'Simpan perubahan'}</button><button className="button button--quiet" disabled={submitting} onClick={() => selectUser(null)} type="button">Tutup</button></div>
      </form>}
    </section>
  )
}
