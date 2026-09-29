import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

import { getSupabaseClient } from '../../lib/supabase'
import { getActiveProfile, signInWithPassword, signOut, type ActiveProfile } from './authService'

type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'inactive' | 'configuration_error'

type AuthContextValue = {
  status: AuthStatus
  user: User | null
  profile: ActiveProfile | null
  message: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function unavailableContext(): AuthContextValue {
  return {
    status: 'configuration_error',
    user: null,
    profile: null,
    message: 'Konfigurasi Supabase belum tersedia.',
    login: async () => undefined,
    logout: async () => undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextValue, 'login' | 'logout'>>({
    status: 'loading', user: null, profile: null, message: null,
  })

  const hydrate = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ status: 'anonymous', user: null, profile: null, message: null })
      return
    }

    try {
      const profile = await getActiveProfile(user.id)
      if (!profile?.is_active) {
        await signOut()
        setState({ status: 'inactive', user: null, profile: null, message: 'Akun ini tidak aktif. Hubungi administrator.' })
        return
      }
      setState({ status: 'authenticated', user, profile, message: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sesi tidak dapat diverifikasi.'
      setState({ status: 'anonymous', user: null, profile: null, message })
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | undefined

    try {
      const supabase = getSupabaseClient()
      void supabase.auth.getSession().then(({ data }) => {
        if (mounted) void hydrate(data.session?.user ?? null)
      })
      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) void hydrate(session?.user ?? null)
      })
      unsubscribe = () => listener.data.subscription.unsubscribe()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Konfigurasi Supabase tidak valid.'
      queueMicrotask(() => {
        if (mounted) setState({ status: 'configuration_error', user: null, profile: null, message })
      })
    }

    return () => { mounted = false; unsubscribe?.() }
  }, [hydrate])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login: async (email, password) => {
      const user = await signInWithPassword(email, password)
      await hydrate(user)
    },
    logout: async () => { await signOut() },
  }), [hydrate, state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext) ?? unavailableContext()
}
