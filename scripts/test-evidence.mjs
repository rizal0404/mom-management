import { Buffer } from 'node:buffer'
import { URL } from 'node:url'
import console from 'node:console'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'

// Creates and removes only this run's local fixtures. Never resets or seeds the database.
const config = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
assert.equal(new URL(config.API_URL).hostname, '127.0.0.1')
const client = (key) => createClient(config.API_URL, key, { auth: { persistSession: false } })
const service = client(config.SERVICE_ROLE_KEY)
const anon = client(config.ANON_KEY)
const run = randomUUID()
const password = `Evidence-${randomUUID()}!`
const users = []
const paths = []
let meetingId, browser
const sql = (query) => execFileSync('docker', ['exec', 'supabase_db_mom_task_management', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atc', query], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const counts = () => sql("select (select count(*) from public.meetings)||','||(select count(*) from public.actions)||','||(select count(*) from storage.objects where bucket_id='evidence')").trim()
const before = counts()
const ok = (result) => { assert.equal(result.error, null, result.error?.message); return result.data }
const pdf = readFileSync('tests/fixtures/preview.DATA_DEMO.pdf')
const jpeg = readFileSync('tests/fixtures/preview.DATA_DEMO.jpg')
const makePath = (kind, id, name = 'DATA_DEMO.pdf') => { const path = `${kind}/${id}/${randomUUID()}--${name}`; paths.push(path); return path }
const upload = (who, path, body = pdf, type = 'application/pdf', upsert = false) => who.storage.from('evidence').upload(path, body, { contentType: type, upsert })
async function user(role, index) {
  const email = `evidence-${run}-${index}@mom.local`
  const account = ok(await service.auth.admin.createUser({ email, password, email_confirm: true }))
  users.push(account.user.id)
  ok(await service.from('profiles').upsert({ id: account.user.id, display_name: `Evidence ${index} DATA DEMO`, role, is_active: true }))
  const api = client(config.ANON_KEY)
  ok(await api.auth.signInWithPassword({ email, password }))
  return { api, id: account.user.id, email }
}
try {
  const owner = await user('MEMBER', 1), pic = await user('MEMBER', 2), outsider = await user('MEMBER', 3), admin = await user('ADMIN', 4)
  const draft = ok(await owner.api.rpc('save_meeting_draft', { p_expected_version: null, p_payload: {
    title: `Evidence DATA DEMO ${run}`, starts_at: '2026-09-24T01:00:00Z', chair_name: 'Evidence DATA DEMO',
    participants: [{ display_name_snapshot: 'Peserta DATA DEMO' }],
    items: [{ position: 1, agenda: 'Evidence task DATA DEMO', result: 'Hasil DATA DEMO', kind: 'TASK', draft_pic_id: pic.id, draft_start_date: '2026-09-24', draft_due_date: '2026-09-25' }],
  } }))
  meetingId = draft.id
  const meetingPath = makePath('meetings', meetingId)
  ok(await upload(owner.api, meetingPath))
  assert((await anon.storage.from('evidence').download(meetingPath)).error)
  assert((await pic.api.storage.from('evidence').download(meetingPath)).error)
  assert((await pic.api.rpc('list_evidence', { p_kind: 'meetings', p_id: meetingId })).error)
  assert((await upload(pic.api, makePath('meetings', meetingId))).error)
  assert((await upload(owner.api, meetingPath, pdf, 'application/pdf', true)).error)
  await owner.api.storage.from('evidence').remove([meetingPath])
  assert(Buffer.from(await ok(await owner.api.storage.from('evidence').download(meetingPath)).arrayBuffer()).equals(pdf))
  ok(await admin.api.storage.from('evidence').download(meetingPath))
  assert((await upload(owner.api, makePath('meetings', meetingId, 'bad.exe'), Buffer.from('no'), 'application/octet-stream')).error)
  assert((await upload(owner.api, makePath('meetings', meetingId), Buffer.alloc(10485761), 'application/pdf')).error)
  assert((await upload(owner.api, makePath('meetings', randomUUID()))).error)
  const list = ok(await owner.api.rpc('list_evidence', { p_kind: 'meetings', p_id: meetingId }))
  assert.equal(list[0].uploader_name, 'Evidence 1 DATA DEMO')
  assert.equal(list[0].file_name, 'DATA_DEMO.pdf')
  console.log('PASS Storage: private draft, owner/admin, anon/foreign denial, immutable object, type/size/target guards, uploader metadata')

  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/login')
  await page.getByLabel('Email').fill(owner.email)
  await page.getByLabel('Kata sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL('http://127.0.0.1:5173/')
  await page.goto(`http://127.0.0.1:5173/meetings/${meetingId}`)
  const chooserEvent = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Pilih file evidence', exact: true }).click()
  await (await chooserEvent).setFiles({ name: 'Browser_DATA_DEMO.pdf', mimeType: 'application/pdf', buffer: pdf })
  await page.getByRole('button', { name: 'Unggah evidence', exact: true }).click()
  await page.getByText('Evidence berhasil diunggah.', { exact: true }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: 'Unduh Browser_DATA_DEMO.pdf', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Pratinjau Browser_DATA_DEMO.pdf', exact: true }).click()
  await page.getByRole('dialog').getByTitle('Pratinjau Browser_DATA_DEMO.pdf').waitFor()
  assert((await page.getByRole('dialog').getByTitle('Pratinjau Browser_DATA_DEMO.pdf').getAttribute('src'))?.startsWith('blob:'))
  await page.getByRole('button', { name: 'Perbesar' }).click()
  await page.getByText('125%', { exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert(await page.getByRole('button', { name: 'Pratinjau Browser_DATA_DEMO.pdf', exact: true }).evaluate((element) => element === globalThis.document.activeElement))
  await page.route('**/storage/v1/object/**', (route) => route.abort('failed'))
  await page.getByRole('button', { name: 'Pratinjau Browser_DATA_DEMO.pdf', exact: true }).click()
  await page.getByRole('dialog').getByRole('alert').waitFor()
  await page.unroute('**/storage/v1/object/**')
  await page.getByRole('dialog').getByRole('button', { name: 'Coba lagi' }).click()
  await page.getByRole('dialog').getByTitle('Pratinjau Browser_DATA_DEMO.pdf').waitFor()
  await page.getByRole('button', { name: 'Tutup pratinjau' }).click()
  await page.route('**/storage/v1/object/**', (route) => route.abort('failed'))
  await page.getByRole('button', { name: 'Unduh Browser_DATA_DEMO.pdf', exact: true }).click()
  await page.getByRole('alert').getByRole('button', { name: 'Muat ulang daftar evidence' }).waitFor()
  await page.unroute('**/storage/v1/object/**')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Unduh Browser_DATA_DEMO.pdf', exact: true }).click()
  assert.equal((await downloadEvent).suggestedFilename(), 'Browser_DATA_DEMO.pdf')
  await page.getByLabel('File evidence', { exact: true }).setInputFiles({ name: 'Browser_DATA_DEMO.jpg', mimeType: 'image/jpeg', buffer: jpeg })
  await page.getByRole('button', { name: 'Unggah evidence', exact: true }).click()
  await page.getByText('Evidence berhasil diunggah.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Pratinjau Browser_DATA_DEMO.jpg', exact: true }).click()
  const previewImage = page.getByRole('img', { name: 'Pratinjau Browser_DATA_DEMO.jpg' })
  await previewImage.waitFor()
  assert(await previewImage.evaluate((image) => image.complete && image.naturalWidth > 0))
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForTimeout(400)
    assert(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), `Viewer overflow ${width}`)
  }
  await page.getByRole('button', { name: 'Perbesar' }).click()
  await page.getByRole('button', { name: '100%' }).click()
  await page.getByRole('button', { name: 'Tutup pratinjau' }).click()
  await page.getByLabel('File evidence', { exact: true }).setInputFiles({ name: 'bad.exe', mimeType: 'application/octet-stream', buffer: pdf })
  await page.getByText('Gunakan PDF, JPG, PNG, WebP, DOCX, atau XLSX.', { exact: true }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: 'Finalisasi', exact: true }).click()
  await page.getByRole('button', { name: 'Ya, finalisasi', exact: true }).click()
  await page.getByText('Final', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Unduh Browser_DATA_DEMO.pdf', exact: true }).waitFor()
  ok(await pic.api.storage.from('evidence').download(meetingPath))
  ok(await upload(owner.api, makePath('meetings', meetingId, 'Final_DATA_DEMO.pdf')))
  assert((await upload(pic.api, makePath('meetings', meetingId))).error)
  const action = ok(await service.from('actions').select('id,version').eq('source_item_id', ok(await service.from('meeting_items').select('id').eq('meeting_id', meetingId).single()).id).single())
  const actionPath = makePath('actions', action.id)
  ok(await upload(pic.api, actionPath))
  assert((await upload(outsider.api, makePath('actions', action.id))).error)
  ok(await outsider.api.storage.from('evidence').download(actionPath))
  ok(await service.from('profiles').update({ is_active: false }).eq('id', outsider.id))
  assert((await outsider.api.storage.from('evidence').download(actionPath)).error)
  ok(await service.from('profiles').update({ is_active: true }).eq('id', outsider.id))
  console.log('PASS Storage: final visibility, supplementary final evidence, PIC upload, unrelated write and inactive read denied')

  const picPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  picPage.on('pageerror', (error) => errors.push(error.message))
  await picPage.goto('http://127.0.0.1:5173/login')
  await picPage.getByLabel('Email').fill(pic.email)
  await picPage.getByLabel('Kata sandi').fill(password)
  await picPage.getByRole('button', { name: 'Masuk', exact: true }).click()
  await picPage.waitForURL('http://127.0.0.1:5173/')
  await picPage.goto(`http://127.0.0.1:5173/actions/${action.id}`)
  await picPage.getByLabel('File evidence', { exact: true }).setInputFiles({ name: 'Selesai_DATA_DEMO.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP9sAAAAASUVORK5CYII=', 'base64') })
  await picPage.getByRole('button', { name: 'Unggah evidence', exact: true }).click()
  await picPage.getByText('Evidence berhasil diunggah.', { exact: true }).waitFor()
  await picPage.getByLabel('Status').selectOption('DONE')
  await picPage.getByLabel('Catatan perubahan').fill('Selesai, bukti DATA DEMO terlampir.')
  await picPage.getByRole('button', { name: 'Simpan pembaruan', exact: true }).click()
  await picPage.getByText('Selesai, bukti DATA DEMO terlampir.', { exact: true }).waitFor()
  await picPage.reload()
  assert.equal(await picPage.getByLabel('Status').inputValue(), 'DONE')
  await picPage.getByRole('button', { name: 'Unduh Selesai_DATA_DEMO.png', exact: true }).waitFor()
  await picPage.getByRole('button', { name: 'Pratinjau Selesai_DATA_DEMO.png', exact: true }).click()
  const pngPreview = picPage.getByRole('img', { name: 'Pratinjau Selesai_DATA_DEMO.png' })
  await pngPreview.waitFor()
  assert(await pngPreview.evaluate((image) => image.complete && image.naturalWidth > 0))
  await picPage.getByRole('button', { name: 'Tutup pratinjau' }).click()
  mkdirSync('docs/qa/evidence', { recursive: true })
  for (const width of [1440, 1024, 390]) {
    await picPage.setViewportSize({ width, height: 1000 })
    await picPage.waitForTimeout(400)
    assert(await picPage.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), `Overflow ${width}`)
    await picPage.screenshot({ path: `docs/qa/evidence/task-${width}.png`, fullPage: true })
  }
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.waitForTimeout(400)
  assert(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth))
  await page.screenshot({ path: 'docs/qa/evidence/meeting-390.png', fullPage: true })
  assert.deepEqual(errors, [])
  const updated = ok(await service.from('actions').select('version').eq('id', action.id).single())
  ok(await owner.api.rpc('delete_action', { p_id: action.id, p_expected_version: updated.version }))
  assert((await pic.api.storage.from('evidence').download(actionPath)).error)
  assert((await upload(pic.api, makePath('actions', action.id))).error)
  console.log('PASS Browser: meeting upload/download/reload/final, task evidence + DONE/reload, mobile/tablet/desktop overflow, no page errors; deleted task evidence denied')
} finally {
  if (browser) await browser.close()
  if (meetingId) {
    // Enumerate only this run's target folders; remove bytes through Storage API.
    const items = ok(await service.from('meeting_items').select('id').eq('meeting_id', meetingId))
    const actions = items.length ? ok(await service.from('actions').select('id').in('source_item_id', items.map((i) => i.id))) : []
    const folders = [`meetings/${meetingId}`, ...actions.map((a) => `actions/${a.id}`)]
    for (const folder of folders) {
      const objects = ok(await service.storage.from('evidence').list(folder, { limit: 1000 }))
      if (objects.length) ok(await service.storage.from('evidence').remove(objects.map((o) => `${folder}/${o.name}`)))
    }
    sql(`begin; delete from public.action_updates where action_id in (select a.id from public.actions a join public.meeting_items i on i.id=a.source_item_id where i.meeting_id='${meetingId}'); delete from public.actions where source_item_id in (select id from public.meeting_items where meeting_id='${meetingId}'); delete from public.meetings where id='${meetingId}'; commit;`)
  }
  for (const id of users) {
    ok(await service.from('profiles').delete().eq('id', id))
    ok(await service.auth.admin.deleteUser(id))
  }
  assert.equal(counts(), before, 'Fixture cleanup must restore original record counts')
  console.log('PASS Cleanup: original local meeting/task/evidence counts preserved')
}
