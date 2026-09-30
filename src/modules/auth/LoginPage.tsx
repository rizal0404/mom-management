import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { useAuth } from './AuthProvider'
import { loginSchema } from './authService'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>((location.state as { message?: string } | null)?.message ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (auth.status === 'authenticated') return <Navigate replace to="/" />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Periksa data login.')
      return
    }

    setIsSubmitting(true)
    try {
      await auth.login(parsed.data.email, parsed.data.password)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login gagal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section aria-labelledby="login-title" className="login-card">
        <div className="login-mark" aria-hidden="true"><LogIn size={23} /></div>
        <p className="eyebrow">MOM Tracker</p>
        <h1 id="login-title">Masuk ke ruang kerja</h1>
        <p>Gunakan akun yang telah diprovisikan administrator. Pendaftaran publik tidak tersedia.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="email">Email</label>
          <input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          <label htmlFor="password">Kata sandi</label>
          <input autoComplete="current-password" id="password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          {error && <p className="form-error" role="alert">{error}</p>}
          {auth.status === 'configuration_error' && <p className="form-error" role="alert">{auth.message}</p>}
          <button className="button button--primary login-submit" disabled={isSubmitting || auth.status === 'configuration_error'} type="submit">
            {isSubmitting ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
        <Link className="account-security-link login-recovery-link" to="/account/recovery">Lupa kata sandi?</Link>
      </section>
    </main>
  )
}
