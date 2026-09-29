import { execFileSync } from 'node:child_process'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const demoPassword = 'DemoPass123!'

function runSupabase(...args) {
  return execFileSync('supabase', args, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function runLocalSql(sql) {
  return execFileSync('docker', [
    'exec', 'supabase_db_mom_task_management',
    'psql', '-U', 'postgres', '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1', '-c', sql,
  ], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function fail(message) {
  throw new Error(message)
}

async function signedInClient(url, key, email) {
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await client.auth.signInWithPassword({ email, password: demoPassword })
  if (error) fail(`Login fixture gagal untuk ${email}: ${error.message}`)
  return client
}

const status = JSON.parse(runSupabase('status', '--output', 'json'))
const url = status.API_URL
const anonKey = status.ANON_KEY
if (!url || !anonKey) fail('Supabase lokal tidak mengembalikan API_URL atau ANON_KEY.')

const anon = createClient(url, anonKey, { auth: { persistSession: false } })
const anonResult = await anon.from('meetings').select('id')
if (!anonResult.error) fail('Anon dapat membaca meetings; RLS seharusnya menolak.')
const signupResult = await anon.auth.signUp({ email: 'signup-blocked@mom.local', password: demoPassword })
if (!signupResult.error) fail('Public signup dapat membuat akun; seharusnya dinonaktifkan.')

const memberA = await signedInClient(url, anonKey, 'anggota-a.demo@mom.local')
const memberB = await signedInClient(url, anonKey, 'anggota-b.demo@mom.local')
const admin = await signedInClient(url, anonKey, 'admin.demo@mom.local')
const inactive = await signedInClient(url, anonKey, 'nonaktif.demo@mom.local')
const invalidCredentials = await anon.auth.signInWithPassword({ email: 'anggota-a.demo@mom.local', password: 'wrong-password' })
if (!invalidCredentials.error) fail('Login dengan kata sandi salah tidak ditolak.')
const reloadedSession = await memberA.auth.getSession()
if (!reloadedSession.data.session?.user) fail('Sesi anggota aktif tidak bertahan setelah dibaca ulang.')

const [aMeetings, bMeetings, inactiveMeetings] = await Promise.all([
  memberA.from('meetings').select('id,title,status').order('id'),
  memberB.from('meetings').select('id,title,status').order('id'),
  inactive.from('meetings').select('id'),
])
if (aMeetings.error || bMeetings.error || inactiveMeetings.error) fail('Query RLS anggota gagal.')
if (aMeetings.data.some((meeting) => meeting.id === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) fail('Anggota A dapat membaca draf B.')
if (bMeetings.data.some((meeting) => meeting.id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')) fail('Anggota B dapat membaca draf A.')
if (!aMeetings.data.some((meeting) => meeting.id === 'cccccccc-cccc-cccc-cccc-cccccccccccc')) fail('Anggota aktif tidak dapat membaca notula final.')
if (inactiveMeetings.data.length !== 0) fail('Anggota nonaktif masih dapat membaca meetings.')

const writeAttempt = await memberA.from('meetings').insert({
  title: 'Write harus ditolak',
  owner_id: '22222222-2222-2222-2222-222222222222',
})
if (!writeAttempt.error) fail('Write langsung oleh authenticated tidak ditolak.')
const roleEscalation = await memberA.from('profiles').update({ role: 'ADMIN' }).eq('id', '22222222-2222-2222-2222-222222222222')
if (!roleEscalation.error) fail('Member dapat menaikkan role sendiri.')

const initialDraft = {
  title: 'Draf transaksi RPC — DATA DEMO', starts_at: null, location_or_link: null, chair_name: null,
  participants: [{ display_name_snapshot: 'Peserta eksternal DATA DEMO' }],
  items: [{ position: 1, agenda: 'Agenda awal DATA DEMO', discussion: 'Pembahasan awal', result: 'Hasil awal', kind: 'DECISION' }],
}
const created = await memberA.rpc('save_meeting_draft', { p_payload: initialDraft, p_expected_version: null })
if (created.error || !created.data?.id || created.data.version !== 1) fail(`Create RPC draf gagal: ${created.error?.message ?? 'respons tidak valid'}`)
const createdId = created.data.id
const reloaded = await memberA.from('meetings').select('id,title,version,meeting_participants(id),meeting_items(id,agenda)').eq('id', createdId).single()
if (reloaded.error || reloaded.data.meeting_participants.length !== 1 || reloaded.data.meeting_items.length !== 1) fail('Reload draf hasil create tidak mempertahankan relasi.')
const itemId = reloaded.data.meeting_items[0].id
const participantId = reloaded.data.meeting_participants[0].id
const editedPayload = { ...initialDraft, id: createdId, title: 'Draf transaksi RPC diedit — DATA DEMO', participants: [{ id: participantId, display_name_snapshot: 'Peserta eksternal diperbarui' }], items: [{ id: itemId, position: 1, agenda: 'Agenda diperbarui DATA DEMO', discussion: 'Pembahasan awal', result: 'Hasil awal', kind: 'DECISION' }] }
const edited = await memberA.rpc('save_meeting_draft', { p_payload: editedPayload, p_expected_version: created.data.version })
if (edited.error || edited.data.version !== 2) fail(`Edit RPC draf gagal: ${edited.error?.message ?? 'versi tidak naik'}`)
const retained = await memberA.from('meeting_items').select('id,agenda').eq('id', itemId).single()
if (retained.error || retained.data.agenda !== 'Agenda diperbarui DATA DEMO') fail('Edit RPC tidak mempertahankan ID item.')
const stale = await memberA.rpc('save_meeting_draft', { p_payload: editedPayload, p_expected_version: 1 })
if (!stale.error || !stale.error.message.includes('CONFLICT')) fail('Simpan versi stale tidak menghasilkan CONFLICT.')
const otherMember = await memberB.rpc('save_meeting_draft', { p_payload: editedPayload, p_expected_version: 2 })
if (!otherMember.error || !otherMember.error.message.includes('FORBIDDEN')) fail('Member lain dapat mengedit draf owner.')
const adminRead = await admin.from('meetings').select('id').eq('id', createdId).single()
if (adminRead.error) fail('Admin tidak dapat membaca draf anggota.')
const nullDeleteVersion = await memberA.rpc('delete_meeting_draft', { p_id: createdId, p_expected_version: null })
if (!nullDeleteVersion.error || !nullDeleteVersion.error.message.includes('CONFLICT')) fail('Hapus draf dengan expected_version null tidak ditolak.')
const deleted = await memberA.rpc('delete_meeting_draft', { p_id: createdId, p_expected_version: 2 })
if (deleted.error) fail(`Hapus RPC draf gagal: ${deleted.error.message}`)
const afterDelete = await memberA.from('meetings').select('id').eq('id', createdId).maybeSingle()
if (afterDelete.error || afterDelete.data) fail('Draf yang dihapus masih terbaca owner.')

const reorderDraft = {
  title: 'Urut ulang agenda draf — DATA DEMO', starts_at: null, location_or_link: null, chair_name: null,
  participants: [{ display_name_snapshot: 'Peserta eksternal DATA DEMO' }],
  items: [
    { position: 1, agenda: 'Agenda pertama yang dihapus', discussion: null, result: 'Hasil pertama', kind: 'DECISION' },
    { position: 2, agenda: 'Agenda tengah dipertahankan', discussion: null, result: 'Hasil tengah', kind: 'DECISION' },
    { position: 3, agenda: 'Agenda akhir dipertahankan', discussion: null, result: 'Hasil akhir', kind: 'DECISION' },
  ],
}
const reorderCreated = await memberA.rpc('save_meeting_draft', { p_payload: reorderDraft, p_expected_version: null })
if (reorderCreated.error || reorderCreated.data?.version !== 1) fail(`Draf urut ulang gagal dibuat: ${reorderCreated.error?.message ?? 'respons tidak valid'}`)
const reorderInitial = await memberA.from('meeting_items').select('id,position,agenda,discussion,result,kind,draft_pic_id,draft_start_date,draft_due_date').eq('meeting_id', reorderCreated.data.id).order('position')
if (reorderInitial.error || reorderInitial.data.length !== 3) fail('Fixture urut ulang tidak memiliki tiga agenda.')
const [removedFirst, retainedMiddle, retainedLast] = reorderInitial.data
const afterRemovingFirst = await memberA.rpc('save_meeting_draft', {
  p_payload: {
    ...reorderDraft, id: reorderCreated.data.id,
    items: [
      { ...retainedMiddle, position: 1 },
      { ...retainedLast, position: 2 },
    ],
  },
  p_expected_version: 1,
})
if (afterRemovingFirst.error || afterRemovingFirst.data?.version !== 2) fail(`Hapus agenda pertama gagal: ${afterRemovingFirst.error?.message ?? 'versi tidak naik'}`)
const firstRemovalState = await memberA.from('meeting_items').select('id,position').eq('meeting_id', reorderCreated.data.id).order('position')
if (firstRemovalState.error || firstRemovalState.data.length !== 2
  || firstRemovalState.data[0].id !== retainedMiddle.id || firstRemovalState.data[0].position !== 1
  || firstRemovalState.data[1].id !== retainedLast.id || firstRemovalState.data[1].position !== 2
  || firstRemovalState.data.some((entry) => entry.id === removedFirst.id)) fail('Hapus agenda pertama tidak mempertahankan ID/urutan yang benar.')
const afterRemovingMiddle = await memberA.rpc('save_meeting_draft', {
  p_payload: {
    ...reorderDraft, id: reorderCreated.data.id,
    items: [{ ...retainedLast, position: 1 }],
  },
  p_expected_version: 2,
})
if (afterRemovingMiddle.error || afterRemovingMiddle.data?.version !== 3) fail(`Hapus agenda tengah gagal: ${afterRemovingMiddle.error?.message ?? 'versi tidak naik'}`)
const middleRemovalState = await memberA.from('meeting_items').select('id,position').eq('meeting_id', reorderCreated.data.id).order('position')
if (middleRemovalState.error || middleRemovalState.data.length !== 1 || middleRemovalState.data[0].id !== retainedLast.id || middleRemovalState.data[0].position !== 1) fail('Hapus agenda tengah tidak mempertahankan ID/urutan agenda akhir.')
const duplicatePosition = await memberA.rpc('save_meeting_draft', {
  p_payload: {
    ...reorderDraft, id: reorderCreated.data.id,
    items: [
      { ...retainedLast, position: 1 },
      { position: 1, agenda: 'Agenda posisi duplikat', discussion: null, result: 'Harus rollback', kind: 'DECISION' },
    ],
  },
  p_expected_version: 3,
})
if (!duplicatePosition.error) fail('Posisi agenda duplikat dapat disimpan.')
const afterDuplicateFailure = await memberA.from('meeting_items').select('id,position').eq('meeting_id', reorderCreated.data.id).order('position')
if (afterDuplicateFailure.error || afterDuplicateFailure.data.length !== 1 || afterDuplicateFailure.data[0].id !== retainedLast.id || afterDuplicateFailure.data[0].position !== 1) fail('Simpan urutan agenda gagal mengubah draf yang sebelumnya tersimpan.')

const finalDraft = {
  title: 'Finalisasi atomik — DATA DEMO',
  starts_at: '2026-09-21T09:00:00+08:00',
  location_or_link: 'Ruang DATA DEMO',
  chair_name: 'Ketua DATA DEMO',
  participants: [{ display_name_snapshot: 'Peserta eksternal DATA DEMO' }],
  items: [
    { position: 1, agenda: 'Keputusan tanpa action', result: 'Disepakati sebagai keputusan', kind: 'DECISION' },
    { position: 2, agenda: 'Task tindak lanjut', result: 'Dikerjakan minggu ini', kind: 'TASK', draft_pic_id: '33333333-3333-3333-3333-333333333333', draft_start_date: '2026-09-22', draft_due_date: '2026-09-25' },
    { position: 3, agenda: 'Pending matter', result: 'Tunggu data pendukung', kind: 'PENDING_MATTER', draft_pic_id: '22222222-2222-2222-2222-222222222222', draft_start_date: '2026-09-23', draft_due_date: '2026-09-26' },
  ],
}
const finalCreated = await memberA.rpc('save_meeting_draft', { p_payload: finalDraft, p_expected_version: null })
if (finalCreated.error || finalCreated.data?.version !== 1) fail(`Draf finalisasi gagal dibuat: ${finalCreated.error?.message ?? 'respons tidak valid'}`)
const forbiddenFinalize = await memberB.rpc('finalize_meeting', { p_id: finalCreated.data.id, p_expected_version: 1 })
if (!forbiddenFinalize.error || !forbiddenFinalize.error.message.includes('FORBIDDEN')) fail('Member lain dapat memfinalkan draf owner.')
const nullFinalize = await memberA.rpc('finalize_meeting', { p_id: finalCreated.data.id, p_expected_version: null })
if (!nullFinalize.error || !nullFinalize.error.message.includes('CONFLICT')) fail('Finalisasi draf dengan expected_version null tidak ditolak.')
const finalized = await memberA.rpc('finalize_meeting', { p_id: finalCreated.data.id, p_expected_version: 1 })
if (finalized.error || finalized.data?.status !== 'FINAL' || finalized.data?.action_count !== 2 || finalized.data?.idempotent !== false) fail(`Finalisasi atomik gagal: ${finalized.error?.message ?? 'respons tidak valid'}`)
const finalActions = await memberA.from('actions').select('id,source_item_id,kind').in('source_item_id', (await memberA.from('meeting_items').select('id').eq('meeting_id', finalCreated.data.id)).data.map((entry) => entry.id))
if (finalActions.error || finalActions.data.length !== 2 || finalActions.data.some((action) => action.kind === 'DECISION')) fail('Finalisasi tidak membuat tepat dua action TASK/PENDING.')
const retriedFinalize = await memberA.rpc('finalize_meeting', { p_id: finalCreated.data.id, p_expected_version: 2 })
if (retriedFinalize.error || retriedFinalize.data?.action_count !== 2 || retriedFinalize.data?.idempotent !== true) fail('Retry finalisasi tidak idempoten.')
const nullFinalizeRetry = await memberA.rpc('finalize_meeting', { p_id: finalCreated.data.id, p_expected_version: null })
if (!nullFinalizeRetry.error || !nullFinalizeRetry.error.message.includes('CONFLICT')) fail('Retry finalisasi dengan expected_version null tidak ditolak.')
const finalEdit = await memberA.rpc('save_meeting_draft', { p_payload: { ...finalDraft, id: finalCreated.data.id }, p_expected_version: 2 })
if (!finalEdit.error || !finalEdit.error.message.includes('FORBIDDEN')) fail('Notula final masih dapat diubah.')
const invalidFinalDraft = await memberA.rpc('save_meeting_draft', { p_payload: { ...finalDraft, title: 'Finalisasi invalid — DATA DEMO', items: [{ position: 1, agenda: 'Task tanpa PIC', result: 'Tetap ada hasil', kind: 'TASK' }] }, p_expected_version: null })
if (invalidFinalDraft.error) fail(`Draf invalid gagal dibuat: ${invalidFinalDraft.error.message}`)
const rejectedFinalize = await memberA.rpc('finalize_meeting', { p_id: invalidFinalDraft.data.id, p_expected_version: 1 })
if (!rejectedFinalize.error || !rejectedFinalize.error.message.includes('VALIDATION')) fail('TASK tanpa PIC/jadwal dapat difinalkan.')
const rejectedState = await memberA.from('meetings').select('status').eq('id', invalidFinalDraft.data.id).single()
const rejectedActions = await memberA.from('meeting_items').select('id').eq('meeting_id', invalidFinalDraft.data.id)
const invalidActionCount = rejectedActions.data?.length ? await memberA.from('actions').select('id', { count: 'exact', head: true }).in('source_item_id', rejectedActions.data.map((entry) => entry.id)) : null
if (rejectedState.error || rejectedState.data.status !== 'DRAFT' || invalidActionCount?.count !== 0) fail('Finalisasi gagal tidak menjaga draf dan action tetap rollback.')
const adminFinalDraft = await memberA.rpc('save_meeting_draft', { p_payload: { ...finalDraft, title: 'Finalisasi admin — DATA DEMO', items: [{ position: 1, agenda: 'Keputusan admin', result: 'Tidak menghasilkan action', kind: 'DECISION' }] }, p_expected_version: null })
if (adminFinalDraft.error) fail(`Draf admin gagal dibuat: ${adminFinalDraft.error.message}`)
const adminFinalized = await admin.rpc('finalize_meeting', { p_id: adminFinalDraft.data.id, p_expected_version: 1 })
if (adminFinalized.error || adminFinalized.data?.status !== 'FINAL' || adminFinalized.data?.action_count !== 0) fail('Admin tidak dapat memfinalkan draf valid tanpa action.')

const taskAction = finalActions.data.find((action) => action.kind === 'TASK')
if (!taskAction) fail('Fixture finalisasi tidak memiliki action TASK untuk MOM-006.')
const taskRead = await memberA.from('actions').select('id,version,status,pic_id,start_date,due_date').eq('id', taskAction.id).single()
if (taskRead.error || taskRead.data.version !== 1 || taskRead.data.status !== 'OPEN') fail('Action awal MOM-006 tidak sesuai.')
const nullActionVersion = await memberA.rpc('update_action', { p_id: taskAction.id, p_expected_version: null, p_patch: { title: 'Tidak boleh tanpa versi' }, p_note: 'Harus konflik' })
if (!nullActionVersion.error || !nullActionVersion.error.message.includes('CONFLICT')) fail('Update action dengan expected_version null tidak ditolak.')
const picProgress = await memberB.rpc('update_action', { p_id: taskAction.id, p_expected_version: 1, p_patch: { status: 'IN_PROGRESS' }, p_note: 'Mulai dikerjakan DATA DEMO' })
if (picProgress.error || picProgress.data?.version !== 2 || picProgress.data?.status !== 'IN_PROGRESS') fail(`PIC tidak dapat memperbarui status action: ${picProgress.error?.message ?? 'respons tidak valid'}`)
const noReasonDeadline = await memberA.rpc('update_action', { p_id: taskAction.id, p_expected_version: 2, p_patch: { due_date: '2026-09-27' }, p_note: null })
if (!noReasonDeadline.error || !noReasonDeadline.error.message.includes('VALIDATION')) fail('Perubahan deadline tanpa alasan tidak ditolak.')
const noReasonPic = await memberA.rpc('update_action', { p_id: taskAction.id, p_expected_version: 2, p_patch: { pic_id: '11111111-1111-1111-1111-111111111111' }, p_note: null })
if (!noReasonPic.error || !noReasonPic.error.message.includes('VALIDATION')) fail('Perubahan PIC tanpa alasan tidak ditolak.')
const picCannotEdit = await memberB.rpc('update_action', { p_id: taskAction.id, p_expected_version: 2, p_patch: { title: 'Tidak boleh diubah PIC' }, p_note: 'Percobaan edit owner' })
if (!picCannotEdit.error || !picCannotEdit.error.message.includes('FORBIDDEN')) fail('PIC dapat mengubah field owner/admin.')
const ownerEdit = await memberA.rpc('update_action', { p_id: taskAction.id, p_expected_version: 2, p_patch: { due_date: '2026-09-27' }, p_note: 'Penyesuaian deadline DATA DEMO' })
if (ownerEdit.error || ownerEdit.data?.version !== 3) fail(`Owner tidak dapat mengubah deadline action: ${ownerEdit.error?.message ?? 'versi tidak naik'}`)
const actionStale = await memberA.rpc('update_action', { p_id: taskAction.id, p_expected_version: 2, p_patch: { title: 'Versi stale' }, p_note: 'Harus konflik' })
if (!actionStale.error || !actionStale.error.message.includes('CONFLICT')) fail('Update action stale tidak menghasilkan CONFLICT.')
const picDone = await memberB.rpc('update_action', { p_id: taskAction.id, p_expected_version: 3, p_patch: { status: 'DONE' }, p_note: 'Hasil pekerjaan selesai DATA DEMO' })
if (picDone.error || picDone.data?.version !== 4 || picDone.data?.status !== 'DONE') fail(`PIC tidak dapat menutup action dengan catatan: ${picDone.error?.message ?? 'respons tidak valid'}`)
const picReopen = await memberB.rpc('update_action', { p_id: taskAction.id, p_expected_version: 4, p_patch: { status: 'OPEN' }, p_note: 'Tidak boleh membuka kembali owner' })
if (!picReopen.error || !picReopen.error.message.includes('FORBIDDEN')) fail('PIC dapat membuka kembali action terminal.')
const adminReopen = await admin.rpc('update_action', { p_id: taskAction.id, p_expected_version: 4, p_patch: { status: 'OPEN' }, p_note: 'Dibuka kembali untuk koreksi DATA DEMO' })
if (adminReopen.error || adminReopen.data?.version !== 5 || adminReopen.data?.status !== 'OPEN') fail('Admin tidak dapat membuka kembali action terminal.')
const actionAudit = await memberA.from('action_updates').select('id,note').eq('action_id', taskAction.id).order('created_at')
if (actionAudit.error || actionAudit.data.length !== 4) fail(`Audit action tidak lengkap: ${actionAudit.error?.message ?? actionAudit.data.length}`)
const weekOverlap = await memberA.from('actions').select('id').lte('start_date', '2026-09-27').gte('due_date', '2026-09-21')
if (weekOverlap.error || weekOverlap.data.length < 2 || !weekOverlap.data.some((action) => action.id === taskAction.id)) fail('Query overlap timeline tidak menyertakan action yang melintasi pekan secara inklusif.')

const pendingAction = finalActions.data.find((action) => action.kind === 'PENDING_MATTER')
const pendingVersion = await memberA.from('actions').select('version').eq('id', pendingAction.id).single()
const forbiddenPending = await memberB.rpc('update_action', { p_id: pendingAction.id, p_expected_version: pendingVersion.data.version, p_patch: { status: 'IN_PROGRESS' }, p_note: 'Tidak berhak' })
if (!forbiddenPending.error || !forbiddenPending.error.message.includes('FORBIDDEN')) fail('B dapat mengubah pending matter yang bukan miliknya.')
const badDates = await memberA.rpc('update_action', { p_id: pendingAction.id, p_expected_version: pendingVersion.data.version, p_patch: { start_date: '2026-09-27', due_date: '2026-09-26' }, p_note: 'Tanggal harus ditolak' })
if (!badDates.error || !badDates.error.message.includes('VALIDATION')) fail('Start setelah due tidak ditolak.')
const sameDates = await memberA.rpc('update_action', { p_id: pendingAction.id, p_expected_version: pendingVersion.data.version, p_patch: { start_date: '2026-09-26' }, p_note: 'Start sama dengan due DATA DEMO' })
if (sameDates.error || sameDates.data?.version !== pendingVersion.data.version + 1) fail('Start sama dengan due ditolak.')
const [raceA, raceB] = await Promise.all([
  memberA.rpc('update_action', { p_id: pendingAction.id, p_expected_version: sameDates.data.version, p_patch: { status: 'IN_PROGRESS' }, p_note: 'Sesi A DATA DEMO' }),
  admin.rpc('update_action', { p_id: pendingAction.id, p_expected_version: sameDates.data.version, p_patch: { status: 'BLOCKED' }, p_note: 'Sesi admin DATA DEMO' }),
])
if ([raceA, raceB].filter((result) => !result.error).length !== 1 || [raceA, raceB].filter((result) => result.error?.message.includes('CONFLICT')).length !== 1) fail('Dua sesi dengan versi sama tidak menghasilkan tepat satu sukses dan satu CONFLICT.')
const pendingAudit = await memberA.from('action_updates').select('id').eq('action_id', pendingAction.id)
if (pendingAudit.error || pendingAudit.data.length !== 2) fail('Write gagal menambahkan audit atau write sukses tidak mencatat audit.')
const auditTamper = await memberB.from('action_updates').delete().eq('action_id', pendingAction.id)
if (!auditTamper.error) fail('Client dapat menghapus audit.')

const mixedDraft = await memberA.rpc('save_meeting_draft', { p_payload: { ...finalDraft, title: 'Rollback dua item DATA DEMO', items: [finalDraft.items[1], { position: 3, agenda: 'Invalid tanpa PIC', result: 'Harus rollback', kind: 'TASK' }] }, p_expected_version: null })
if (mixedDraft.error) fail('Draf campuran gagal disimpan.')
const mixedFinal = await memberA.rpc('finalize_meeting', { p_id: mixedDraft.data.id, p_expected_version: 1 })
const mixedMeeting = await memberA.from('meetings').select('status').eq('id', mixedDraft.data.id).single()
const mixedItems = await memberA.from('meeting_items').select('id').eq('meeting_id', mixedDraft.data.id)
const mixedActions = await memberA.from('actions').select('id').in('source_item_id', mixedItems.data.map((entry) => entry.id))
if (!mixedFinal.error || mixedMeeting.data?.status !== 'DRAFT' || mixedActions.data?.length !== 0) fail('Validasi item kedua meninggalkan finalisasi/action parsial.')

const doubleDraft = await memberA.rpc('save_meeting_draft', { p_payload: { ...finalDraft, title: 'Klik ganda DATA DEMO' }, p_expected_version: null })
const [doubleA, doubleB] = await Promise.all([
  memberA.rpc('finalize_meeting', { p_id: doubleDraft.data.id, p_expected_version: 1 }),
  admin.rpc('finalize_meeting', { p_id: doubleDraft.data.id, p_expected_version: 1 }),
])
const doubleItems = await memberA.from('meeting_items').select('id,kind').eq('meeting_id', doubleDraft.data.id)
const doubleActions = await memberA.from('actions').select('source_item_id').in('source_item_id', doubleItems.data.map((entry) => entry.id))
if (doubleA.error || doubleB.error || doubleActions.data?.length !== 2 || new Set(doubleActions.data.map((entry) => entry.source_item_id)).size !== 2) fail('Finalisasi bersamaan membuat duplikasi atau gagal menjadi idempoten.')

// --- Validation failure: inactive PIC is rejected before INSERT ---
// Keep this assertion separate from A10's real INSERT failure proof below.
const validationFailDraft = await memberA.rpc('save_meeting_draft', { p_payload: {
  title: 'Validasi PIC nonaktif — DATA DEMO',
  starts_at: '2026-09-21T09:00:00+08:00', location_or_link: null, chair_name: 'Ketua DATA DEMO',
  participants: [{ display_name_snapshot: 'Peserta DATA DEMO' }],
  items: [
    { position: 1, agenda: 'Task dengan PIC yang akan dinonaktifkan', result: 'Harus rollback', kind: 'TASK', draft_pic_id: '44444444-4444-4444-4444-444444444444', draft_start_date: '2026-09-22', draft_due_date: '2026-09-30' },
    { position: 2, agenda: 'Keputusan aman', result: 'Ini keputusan saja', kind: 'DECISION' },
  ],
}, p_expected_version: null })
if (validationFailDraft.error) fail(`Draf validasi PIC nonaktif tidak dapat dibuat: ${validationFailDraft.error.message}`)
// The PIC '44444444-...' is nonaktif.demo — already is_active=false in the seed fixture.
const validationFinalize = await memberA.rpc('finalize_meeting', { p_id: validationFailDraft.data.id, p_expected_version: 1 })
if (!validationFinalize.error) fail('Finalisasi dengan PIC nonaktif seharusnya gagal pada validasi.')
const validationMeetingState = await memberA.from('meetings').select('status').eq('id', validationFailDraft.data.id).single()
if (validationMeetingState.error || validationMeetingState.data.status !== 'DRAFT') fail('Validasi PIC nonaktif tidak menjaga meeting tetap DRAFT.')
const validationItems = await memberA.from('meeting_items').select('id').eq('meeting_id', validationFailDraft.data.id)
const validationActions = validationItems.data?.length ? await memberA.from('actions').select('id', { count: 'exact', head: true }).in('source_item_id', validationItems.data.map((entry) => entry.id)) : null
if (validationActions?.count !== 0) fail('Validasi PIC nonaktif meninggalkan action parsial.')

// --- A10: real INSERT failure after all finalize validations ---
// This test-only trigger exists only in the disposable local database. It raises from
// public.actions INSERT so the RPC must roll back its meeting update and action rows.
const insertFailSql = `
create or replace function public.test_fail_actions_insert() returns trigger
language plpgsql as $$
begin
  raise exception 'TEST_INSERT_FAILURE';
end;
$$;
drop trigger if exists test_fail_actions_insert on public.actions;
create trigger test_fail_actions_insert
before insert on public.actions
for each row execute function public.test_fail_actions_insert();
`
const dropInsertFailSql = `
drop trigger if exists test_fail_actions_insert on public.actions;
drop function if exists public.test_fail_actions_insert();
`
const insertFailDraft = await memberA.rpc('save_meeting_draft', { p_payload: {
  title: 'Rollback INSERT setelah validasi — DATA DEMO',
  starts_at: '2026-09-21T10:00:00+08:00', location_or_link: null, chair_name: 'Ketua DATA DEMO',
  participants: [{ display_name_snapshot: 'Peserta DATA DEMO' }],
  items: [
    { position: 1, agenda: 'Task valid untuk trigger INSERT', result: 'Harus rollback setelah validasi', kind: 'TASK', draft_pic_id: '22222222-2222-2222-2222-222222222222', draft_start_date: '2026-09-22', draft_due_date: '2026-09-30' },
    { position: 2, agenda: 'Keputusan aman', result: 'Ini keputusan saja', kind: 'DECISION' },
  ],
}, p_expected_version: null })
if (insertFailDraft.error) fail(`Draf A10 gagal dibuat: ${insertFailDraft.error.message}`)
let insertFailureResult
try {
  runLocalSql(insertFailSql)
  insertFailureResult = await memberA.rpc('finalize_meeting', { p_id: insertFailDraft.data.id, p_expected_version: 1 })
} finally {
  runLocalSql(dropInsertFailSql)
}
if (!insertFailureResult?.error) fail('Trigger A10 tidak menghasilkan error INSERT saat finalisasi.')
const insertFailMeetingState = await memberA.from('meetings').select('status').eq('id', insertFailDraft.data.id).single()
if (insertFailMeetingState.error || insertFailMeetingState.data.status !== 'DRAFT') fail('Kegagalan INSERT A10 tidak me-rollback status meeting ke DRAFT.')
const insertFailItems = await memberA.from('meeting_items').select('id').eq('meeting_id', insertFailDraft.data.id)
const insertFailActions = insertFailItems.data?.length ? await memberA.from('actions').select('id', { count: 'exact', head: true }).in('source_item_id', insertFailItems.data.map((entry) => entry.id)) : null
if (insertFailActions?.count !== 0) fail('Kegagalan INSERT A10 meninggalkan action parsial — rollback tidak bekerja.')

// --- Dashboard count boundary: 1,001 accessible actions must remain countable ---
// This fixture is DATA DEMO only and lives in the disposable local database.
const dashboardItems = Array.from({ length: 1001 }, (_, index) => ({
  position: index + 1,
  agenda: `Dashboard boundary ${index + 1} DATA DEMO`,
  result: 'Fixture boundary dashboard',
  kind: 'TASK',
  draft_pic_id: '22222222-2222-2222-2222-222222222222',
  draft_start_date: '2026-09-22',
  draft_due_date: '2026-09-29',
}))
const dashboardDraft = await memberA.rpc('save_meeting_draft', {
  p_payload: {
    title: 'Dashboard boundary 1001 — DATA DEMO',
    starts_at: '2026-09-22T09:00:00+08:00',
    location_or_link: null,
    chair_name: 'Ketua DATA DEMO',
    participants: [{ display_name_snapshot: 'Peserta DATA DEMO' }],
    items: dashboardItems,
  },
  p_expected_version: null,
})
if (dashboardDraft.error) fail(`Fixture dashboard 1001 gagal dibuat: ${dashboardDraft.error.message}`)
const dashboardFinal = await memberA.rpc('finalize_meeting', { p_id: dashboardDraft.data.id, p_expected_version: 1 })
if (dashboardFinal.error || dashboardFinal.data?.action_count !== 1001) fail(`Finalisasi fixture dashboard 1001 gagal: ${dashboardFinal.error?.message ?? dashboardFinal.data?.action_count}`)
const dashboardCount = await memberA.from('actions').select('id', { count: 'exact', head: true })
if (dashboardCount.error || (dashboardCount.count ?? 0) < 1001) fail(`Count dashboard memotong record: ${dashboardCount.error?.message ?? dashboardCount.count}`)
const dashboardPageOne = await memberA.from('actions').select('id').order('id').range(0, 999)
const dashboardPageTwo = await memberA.from('actions').select('id').order('id').range(1000, 1999)
if (dashboardPageOne.error || dashboardPageOne.data.length !== 1000 || dashboardPageTwo.error || dashboardPageTwo.data.length < 1) fail('Boundary pagination dashboard 1,000/1,001 tidak mengembalikan halaman kedua.')

// --- MOM-006 soft delete: authorization, stale/null guard, retry and private history ---
const deleteVersion = (await memberA.from('actions').select('version').eq('id', taskAction.id).single()).data.version
const deniedDelete = await memberB.rpc('delete_action', { p_id: taskAction.id, p_expected_version: deleteVersion })
if (!deniedDelete.error || !deniedDelete.error.message.includes('FORBIDDEN')) fail('PIC tanpa hak owner dapat menghapus task.')
const inactiveDelete = await inactive.rpc('delete_action', { p_id: taskAction.id, p_expected_version: deleteVersion })
if (!inactiveDelete.error) fail('Anggota nonaktif dapat menghapus task.')
const nullDeleteAction = await memberA.rpc('delete_action', { p_id: taskAction.id, p_expected_version: null })
if (!nullDeleteAction.error || !nullDeleteAction.error.message.includes('CONFLICT')) fail('Hapus task dengan versi null tidak ditolak.')
const staleDeleteAction = await memberA.rpc('delete_action', { p_id: taskAction.id, p_expected_version: deleteVersion - 1 })
if (!staleDeleteAction.error || !staleDeleteAction.error.message.includes('CONFLICT')) fail('Hapus task dengan versi stale tidak ditolak.')
const deleteAuditBefore = Number(runLocalSql(`select count(*) from public.action_updates where action_id='${taskAction.id}';`).match(/\d+/)?.[0])
const firstDelete = await memberA.rpc('delete_action', { p_id: taskAction.id, p_expected_version: deleteVersion })
if (firstDelete.error || firstDelete.data?.deleted !== true || firstDelete.data?.idempotent === true) fail('Owner gagal menghapus task.')
const retryDelete = await admin.rpc('delete_action', { p_id: taskAction.id, p_expected_version: deleteVersion })
if (retryDelete.error || retryDelete.data?.idempotent !== true) fail('Retry admin setelah hapus task tidak idempoten.')
const deleteAuditAfter = Number(runLocalSql(`select count(*) from public.action_updates where action_id='${taskAction.id}';`).match(/\d+/)?.[0])
if (deleteAuditAfter !== deleteAuditBefore + 1) fail('Hapus task tidak menghasilkan tepat satu audit.')
const retainedDeleted = runLocalSql(`select (deleted_at is not null)::int from public.actions where id='${taskAction.id}';`)
if (!/\b1\b/.test(retainedDeleted)) fail('Soft delete menghilangkan row atau deleted_at tidak terisi.')
const hiddenAction = await memberA.from('actions').select('id').eq('id', taskAction.id)
const hiddenAudit = await memberA.from('action_updates').select('id').eq('action_id', taskAction.id)
if (hiddenAction.error || hiddenAction.data.length !== 0 || hiddenAudit.error || hiddenAudit.data.length !== 0) fail('Task/audit terhapus masih terbaca melalui API anggota.')
const closedMutation = await memberA.rpc('update_action', { p_id: taskAction.id, p_expected_version: deleteVersion + 1, p_patch: { status: 'DONE' }, p_note: 'Tidak boleh berubah' })
if (!closedMutation.error) fail('Task yang telah dihapus masih dapat diubah.')
const pendingDeleteVersion = (await memberA.from('actions').select('version').eq('id', pendingAction.id).single()).data.version
const adminDelete = await admin.rpc('delete_action', { p_id: pendingAction.id, p_expected_version: pendingDeleteVersion })
if (adminDelete.error || adminDelete.data?.deleted !== true) fail('Admin gagal menghapus task anggota lain.')

process.stdout.write('PASS test:db — auth/RLS, draf/finalisasi, audit/konflik, rollback INSERT, boundary dashboard 1.001 action, dan soft delete otorisasi/idempotensi/privasi.\n')
