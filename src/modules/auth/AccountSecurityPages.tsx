import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { Link } from 'react-router'

import { useAuth } from './AuthProvider'
import {
  passwordRecoveryRequestSchema,
  passwordUpdateSchema,
  requestPasswordRecovery,
  updateAccountPassword,
} from './accountPasswordService'

function AccountSecurityCard({ children, title, description }: {
  children: ReactNode
  title: string
  description: string
}) {
  return (
    <main className="login-page">
      <section aria-labelledby="account-security-title" className="login-card">
        <div className="login-mark" aria-hidden="true"><KeyRound size={23} /></div>
        <p className="eyebrow">MOM Tracker</p>
        <h1 id="account-security-title">{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </main>
  )
}

export function PasswordRecoveryRequestPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailInput = useRef<HTMLInputElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setRequestSent(false)
    const parsed = passwordRecoveryRequestSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Masukkan alamat email yang valid.')
      emailInput.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await requestPasswordRecovery(parsed.data.email)
      setRequestSent(true)
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Permintaan pemulihan tidak dapat diproses sekarang. Coba lagi nanti.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AccountSecurityCard
      title="Pulihkan akses akun"
      description="Masukkan alamat email akun Anda. Jika akun terdaftar, instruksi pemulihan akan dikirim."
    >
      <form className="account-security-form" onSubmit={submit} noValidate>
        <label htmlFor="recovery-email">Email</label>
        <input
          autoComplete="email"
          id="recovery-email"
          ref={emailInput}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        {requestSent && (
          <p className="form-success" role="status">
            Jika akun terdaftar, instruksi pemulihan akan dikirim ke alamat tersebut.
          </p>
        )}
        <button className="button button--primary login-submit" disabled={isSubmitting} type="submit">
          <Mail aria-hidden="true" size={17} />
          {isSubmitting ? 'Mengirim…' : 'Kirim instruksi pemulihan'}
        </button>
      </form>
      <Link className="account-security-link" to="/login">Kembali ke halaman masuk</Link>
    </AccountSecurityCard>
  )
}

export function PasswordUpdatePage() {
  const auth = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const passwordInput = useRef<HTMLInputElement>(null)
  const confirmationInput = useRef<HTMLInputElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    const parsed = passwordUpdateSchema.safeParse({ password, confirmation })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Periksa kata sandi baru.')
      if (parsed.error.issues[0]?.path[0] === 'confirmation') confirmationInput.current?.focus()
      else passwordInput.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await updateAccountPassword(parsed.data.password)
      setPassword('')
      setConfirmation('')
      setSuccess(true)
    } catch (updateError) {
      setError(updateError instanceof Error
        ? updateError.message
        : 'Kata sandi tidak dapat diperbarui sekarang. Coba lagi nanti.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (auth.status === 'loading') {
    return <main className="auth-loading" role="status">Memeriksa sesi akun…</main>
  }

  if (auth.status !== 'authenticated') {
    const message = auth.status === 'inactive'
      ? 'Akun ini tidak aktif. Hubungi administrator untuk mendapatkan bantuan.'
      : auth.status === 'configuration_error'
        ? auth.message ?? 'Konfigurasi Supabase belum tersedia.'
        : 'Tautan pemulihan tidak valid, sudah digunakan, atau kedaluwarsa. Minta tautan baru.'

    return (
      <AccountSecurityCard title="Sesi pemulihan tidak tersedia" description={message}>
        <div className="account-security-links">
          <Link className="account-security-link" to="/account/recovery">Minta tautan pemulihan baru</Link>
          <Link className="account-security-link" to="/login">Kembali ke halaman masuk</Link>
        </div>
      </AccountSecurityCard>
    )
  }

  return (
    <AccountSecurityCard
      title="Perbarui kata sandi"
      description="Gunakan kata sandi baru minimal 8 karakter. Sandi hanya dikirim ke Supabase Auth."
    >
      <form className="account-security-form" onSubmit={submit} noValidate>
        <label htmlFor="new-password">Kata sandi baru</label>
        <input
          autoComplete="new-password"
          id="new-password"
          onChange={(event) => setPassword(event.target.value)}
          ref={passwordInput}
          type="password"
          value={password}
        />
        <label htmlFor="confirm-password">Konfirmasi kata sandi baru</label>
        <input
          autoComplete="new-password"
          id="confirm-password"
          onChange={(event) => setConfirmation(event.target.value)}
          ref={confirmationInput}
          type="password"
          value={confirmation}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="form-success" role="status">Kata sandi berhasil diperbarui.</p>}
        <button className="button button--primary login-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Menyimpan…' : 'Simpan kata sandi baru'}
        </button>
      </form>
      <div className="account-security-links">
        <Link className="account-security-link" to="/">Kembali ke aplikasi</Link>
        <Link className="account-security-link" to="/account/recovery">Kirim ulang tautan pemulihan</Link>
      </div>
    </AccountSecurityCard>
  )
}
