import { execFileSync } from 'node:child_process'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const password = 'DemoPass123!'

function runSupabase(...args) {
  return execFileSync('supabase', args, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function fail(message) {
  throw new Error(message)
}

function runLocalSql(sql) {
  return execFileSync('docker', [
    'exec', 'supabase_db_mom_task_management',
    'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql,
  ], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

async function signIn(url, anonKey, email, userPassword = password) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const { error } = await client.auth.signInWithPassword({ email, password: userPassword })
  if (error) fail(`Login gagal untuk ${email}: ${error.message}`)
  return client
}

async function invoke(client, body) {
  const { data, error } = await client.functions.invoke('manage-users', { body })
  return { data, error }
}

const status = JSON.parse(runSupabase('status', '--output', 'json'))
const url = status.API_URL
const anonKey = status.ANON_KEY
if (!url || !anonKey) fail('Supabase lokal tidak mengembalikan API_URL atau ANON_KEY.')

const admin = await signIn(url, anonKey, 'admin.demo@mom.local')
const member = await signIn(url, anonKey, 'anggota-a.demo@mom.local')

const forbidden = await invoke(member, { action: 'list', page: 1, pageSize: 25 })
if (!forbidden.error) fail('Member dapat memanggil Edge Function kelola pengguna.')

const initial = await invoke(admin, { action: 'list', page: 1, pageSize: 25 })
if (initial.error || (initial.data?.total ?? 0) < 4) fail('Admin tidak dapat membaca direktori user fixture.')

const suffix = Date.now()
const email = `kelola-user-${suffix}@mom.local`
const displayName = `Pengguna Kelola DATA DEMO ${suffix}`
const created = await invoke(admin, {
  action: 'create',
  displayName,
  email,
  password: 'TemporaryPass123!',
  role: 'MEMBER',
})
if (created.error || created.data?.user?.email !== email || created.data.user.role !== 'MEMBER' || !created.data.user.is_active) {
  fail('Admin tidak dapat membuat akun beserta profile aktif.')
}

const createdClient = await signIn(url, anonKey, email, 'TemporaryPass123!')
const createdForbidden = await invoke(createdClient, { action: 'list', page: 1, pageSize: 25 })
if (!createdForbidden.error) fail('Akun baru MEMBER dapat mengelola pengguna.')

const found = await invoke(admin, { action: 'list', search: displayName, page: 1, pageSize: 25 })
if (found.error || found.data?.total !== 1 || found.data.users[0]?.id !== created.data.user.id) fail('Direktori tidak memuat akun baru.')

const selfChange = await invoke(admin, {
  action: 'update',
  id: '11111111-1111-1111-1111-111111111111',
  displayName: 'Admin DATA DEMO',
  role: 'MEMBER',
  isActive: true,
})
if (!selfChange.error) fail('Admin dapat menurunkan peran dirinya sendiri.')

const lastAdmin = await invoke(admin, {
  action: 'update',
  id: '11111111-1111-1111-1111-111111111111',
  displayName: 'Admin DATA DEMO',
  role: 'ADMIN',
  isActive: false,
})
if (!lastAdmin.error) fail('Administrator aktif terakhir dapat dinonaktifkan.')

const updated = await invoke(admin, {
  action: 'update',
  id: created.data.user.id,
  displayName: `${displayName} diperbarui`,
  role: 'MEMBER',
  isActive: false,
})
if (updated.error || updated.data?.user?.is_active !== false || updated.data.user.display_name !== `${displayName} diperbarui`) {
  fail('Admin tidak dapat memperbarui status/nama pengguna.')
}

const inactiveRead = await createdClient.from('profiles').select('id').eq('id', created.data.user.id)
if (inactiveRead.error || inactiveRead.data?.length !== 0) fail('Akun nonaktif masih mendapat akses profil melalui RLS.')

const auditEvents = Number(runLocalSql(`select count(*) from public.user_admin_audit where target_profile_id = '${created.data.user.id}'`))
if (auditEvents !== 2) fail('Pembuatan dan perubahan user tidak menghasilkan dua audit event.')

process.stdout.write('PASS user management function: member ditolak, admin membuat/memperbarui user, guard admin terakhir aktif, dan audit tercatat.\n')
