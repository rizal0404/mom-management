import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './AuthProvider'

export function RequireActiveSession() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <main className="auth-loading">Memeriksa sesi…</main>
  if (auth.status === 'authenticated') return <Outlet />

  return <Navigate replace state={{ from: location.pathname, message: auth.message }} to="/login" />
}
