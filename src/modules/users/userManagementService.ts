import { z } from 'zod'

import { getSupabaseClient } from '../../lib/supabase'

export type ManagedUser = {
  id: string
  display_name: string
  role: 'ADMIN' | 'MEMBER'
  is_active: boolean
  created_at: string
  updated_at: string
  email: string | null
}

export const createUserSchema = z.object({
  displayName: z.string().trim().min(1, 'Nama wajib diisi.').max(120, 'Nama maksimal 120 karakter.'),
  email: z.string().trim().email('Masukkan email yang valid.').max(254),
  password: z.string().min(12, 'Kata sandi minimal 12 karakter.').max(72, 'Kata sandi maksimal 72 karakter.'),
  role: z.enum(['ADMIN', 'MEMBER']),
})

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(1, 'Nama wajib diisi.').max(120, 'Nama maksimal 120 karakter.'),
  role: z.enum(['ADMIN', 'MEMBER']),
  isActive: z.boolean(),
})

type ApiError = { error?: { message?: string } }

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke('manage-users', { body })
  if (error) {
    const context = (error as { context?: unknown }).context
    const apiError = context instanceof Response
      ? await context.clone().json().catch(() => null) as ApiError | null
      : null
    throw new Error(apiError?.error?.message ?? 'Pengelolaan pengguna tidak dapat diproses.')
  }
  return data as T
}

export async function listManagedUsers(search = '', page = 1, pageSize = 25) {
  return invoke<{ users: ManagedUser[]; total: number; page: number; pageSize: number }>({ action: 'list', search, page, pageSize })
}

export async function createManagedUser(input: z.infer<typeof createUserSchema>) {
  const value = createUserSchema.parse(input)
  return invoke<{ user: ManagedUser }>({ action: 'create', ...value })
}

export async function updateManagedUser(input: z.infer<typeof updateUserSchema>) {
  const value = updateUserSchema.parse(input)
  return invoke<{ user: ManagedUser }>({ action: 'update', ...value })
}
