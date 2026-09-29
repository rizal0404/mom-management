import { z } from 'zod'

import { getSupabaseClient } from '../../lib/supabase'

export type ActiveProfile = {
  id: string
  display_name: string
  role: 'ADMIN' | 'MEMBER'
  is_active: boolean
}

export const loginSchema = z.object({
  email: z.string().trim().email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Masukkan kata sandi.'),
})

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
  if (error) throw new Error('Email atau kata sandi tidak sesuai.')
  if (!data.user) throw new Error('Sesi login tidak tersedia.')
  return data.user
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error) throw new Error('Sesi tidak dapat diakhiri. Coba lagi.')
}

export async function getActiveProfile(userId: string): Promise<ActiveProfile | null> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, display_name, role, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error('Profil aktif tidak dapat dimuat.')
  return data as ActiveProfile | null
}
