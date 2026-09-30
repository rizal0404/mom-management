import { z } from 'zod'

import { getSupabaseClient } from '../../lib/supabase'

export const passwordRecoveryRequestSchema = z.object({
  email: z.string().trim().email('Masukkan alamat email yang valid.'),
})

export const passwordUpdateSchema = z.object({
  password: z.string().min(8, 'Kata sandi baru minimal 8 karakter.'),
  confirmation: z.string(),
}).refine((value) => value.password === value.confirmation, {
  message: 'Konfirmasi kata sandi belum sama.',
  path: ['confirmation'],
})

export function getPasswordRecoveryRedirectUrl(appOrigin: string) {
  const origin = new URL(appOrigin)
  if (origin.origin !== appOrigin) throw new Error('Alamat aplikasi tidak valid.')
  return new URL('/account/password', origin).toString()
}

export async function requestPasswordRecovery(email: string) {
  const redirectTo = getPasswordRecoveryRedirectUrl(window.location.origin)
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw new Error('Permintaan pemulihan tidak dapat diproses sekarang. Coba lagi nanti.')
}

export async function updateAccountPassword(password: string) {
  const { error } = await getSupabaseClient().auth.updateUser({ password })
  if (!error) return

  const reason = error.message.toLowerCase()
  if (reason.includes('weak_password') || reason.includes('password should') || reason.includes('password is too')) {
    throw new Error('Kata sandi ditolak Auth. Gunakan kata sandi yang lebih kuat dan sesuai ketentuan.')
  }
  if (reason.includes('session') || reason.includes('token') || reason.includes('otp')) {
    throw new Error('Sesi pemulihan tidak valid, sudah digunakan, atau kedaluwarsa. Minta tautan baru.')
  }
  throw new Error('Kata sandi tidak dapat diperbarui sekarang. Coba lagi nanti.')
}
