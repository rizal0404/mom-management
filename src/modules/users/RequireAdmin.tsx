import { Navigate, Outlet } from 'react-router'

import { useAuth } from '../auth/AuthProvider'

export function RequireAdmin() {
  const { profile } = useAuth()
  if (profile?.role !== 'ADMIN') return <Navigate replace to="/" />
  return <Outlet />
}
