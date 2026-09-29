import { createClient } from 'npm:@supabase/supabase-js@2'

type ProfileRole = 'ADMIN' | 'MEMBER'
type UserRecord = {
  id: string
  display_name: string
  role: ProfileRole
  is_active: boolean
  created_at: string
  updated_at: string
  email: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function failure(status: number, code: string, message: string) {
  return response({ error: { code, message } }, status)
}

function isRole(value: unknown): value is ProfileRole {
  return value === 'ADMIN' || value === 'MEMBER'
}

function validName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 120
}

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 72
}

async function resolveAdmin(request: Request) {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')
  if (!url || !anonKey || !serviceRoleKey) throw new Error('Function configuration missing.')
  if (!authorization?.startsWith('Bearer ')) return { error: failure(401, 'UNAUTHENTICATED', 'Sesi login tidak tersedia.') }

  const caller = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
  const { data: authData, error: authError } = await caller.auth.getUser()
  if (authError || !authData.user) return { error: failure(401, 'UNAUTHENTICATED', 'Sesi login tidak valid.') }

  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,role,is_active')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (profileError || !profile?.is_active || profile.role !== 'ADMIN') {
    return { error: failure(403, 'FORBIDDEN', 'Hanya administrator aktif yang dapat mengelola pengguna.') }
  }
  return { admin, actorId: authData.user.id }
}

async function toUserRecord(admin: ReturnType<typeof createClient>, profile: Omit<UserRecord, 'email'>): Promise<UserRecord> {
  const { data } = await admin.auth.admin.getUserById(profile.id)
  return { ...profile, email: data.user?.email ?? null }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return failure(405, 'METHOD_NOT_ALLOWED', 'Metode tidak didukung.')

  try {
    const authorization = await resolveAdmin(request)
    if ('error' in authorization) return authorization.error
    const { admin, actorId } = authorization
    const payload: unknown = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return failure(400, 'VALIDATION', 'Permintaan tidak valid.')
    }
    const body = payload as Record<string, unknown>

    if (body.action === 'list') {
      const page = Number.isInteger(body.page) && Number(body.page) > 0 ? Number(body.page) : 1
      const pageSize = Number.isInteger(body.pageSize) && Number(body.pageSize) > 0 && Number(body.pageSize) <= 50 ? Number(body.pageSize) : 25
      const from = (page - 1) * pageSize
      let query = admin
        .from('profiles')
        .select('id,display_name,role,is_active,created_at,updated_at', { count: 'exact' })
        .order('display_name')
        .range(from, from + pageSize - 1)
      if (typeof body.search === 'string' && body.search.trim()) query = query.ilike('display_name', `%${body.search.trim()}%`)
      const { data, count, error } = await query
      if (error) throw error
      const users = await Promise.all((data ?? []).map((profile) => toUserRecord(admin, profile as Omit<UserRecord, 'email'>)))
      return response({ users, total: count ?? 0, page, pageSize })
    }

    if (body.action === 'create') {
      if (!validName(body.displayName) || !validEmail(body.email) || !validPassword(body.password) || !isRole(body.role)) {
        return failure(400, 'VALIDATION', 'Nama, email, kata sandi minimal 12 karakter, dan peran wajib valid.')
      }
      const email = body.email.trim().toLowerCase()
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      })
      if (createError || !created.user) {
        const message = createError?.message.toLowerCase().includes('already')
          ? 'Email tersebut sudah terdaftar.'
          : 'Akun tidak dapat dibuat.'
        return failure(409, 'CREATE_FAILED', message)
      }
      const { data: profile, error: profileError } = await admin.rpc('admin_create_profile', {
        p_actor_id: actorId,
        p_profile_id: created.user.id,
        p_display_name: body.displayName.trim(),
        p_role: body.role,
      })
      if (profileError || !profile) {
        await admin.auth.admin.deleteUser(created.user.id)
        throw profileError ?? new Error('Profile creation failed.')
      }
      return response({ user: await toUserRecord(admin, profile as Omit<UserRecord, 'email'>) }, 201)
    }

    if (body.action === 'update') {
      if (typeof body.id !== 'string' || !validName(body.displayName) || !isRole(body.role) || typeof body.isActive !== 'boolean') {
        return failure(400, 'VALIDATION', 'Data pengguna tidak valid.')
      }
      const { data: target, error: targetError } = await admin
        .from('profiles')
        .select('id,display_name,role,is_active,created_at,updated_at')
        .eq('id', body.id)
        .maybeSingle()
      if (targetError) throw targetError
      if (!target) return failure(404, 'NOT_FOUND', 'Pengguna tidak ditemukan.')
      if (target.id === actorId && (body.role !== target.role || body.isActive !== target.is_active)) {
        return failure(400, 'SELF_CHANGE', 'Gunakan administrator lain untuk mengubah peran atau status akun Anda sendiri.')
      }
      const removesActiveAdmin = target.role === 'ADMIN' && target.is_active && (body.role !== 'ADMIN' || !body.isActive)
      if (removesActiveAdmin) {
        const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'ADMIN').eq('is_active', true)
        if (error) throw error
        if ((count ?? 0) <= 1) return failure(400, 'LAST_ADMIN', 'Administrator aktif terakhir tidak dapat dinonaktifkan atau diturunkan perannya.')
      }
      const { data: profile, error: updateError } = await admin.rpc('admin_update_profile', {
        p_actor_id: actorId,
        p_profile_id: target.id,
        p_display_name: body.displayName.trim(),
        p_role: body.role,
        p_is_active: body.isActive,
      })
      if (updateError || !profile) throw updateError ?? new Error('Profile update failed.')
      return response({ user: await toUserRecord(admin, profile as Omit<UserRecord, 'email'>) })
    }

    return failure(400, 'VALIDATION', 'Aksi tidak dikenal.')
  } catch (error) {
    console.error('manage-users failed', error instanceof Error ? error.message : error)
    return failure(500, 'INTERNAL', 'Pengelolaan pengguna gagal. Coba lagi.')
  }
})
