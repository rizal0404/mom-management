import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { URL } from 'node:url'
import process from 'node:process'
import console from 'node:console'
import { setTimeout } from 'node:timers'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const origin = 'http://127.0.0.1:5175'
const apiOrigin = 'http://127.0.0.1:54321'
const userId = randomUUID()
const meetingId = randomUUID()
const now = Math.floor(Date.now() / 1000)
const jwt = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: userId, role: 'authenticated', aud: 'authenticated', exp: now + 3600, iat: now })).toString('base64url'),
  'demo',
].join('.')
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'qa-stage0.demo@mom.local', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
const profile = { id: userId, display_name: 'QA DATA DEMO', role: 'MEMBER', is_active: true }
let meeting
let failSaveOnce = false
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175', '--strictPort'], { stdio: 'ignore', windowsHide: true })
let browser

async function mockApi(route) {
  const request = route.request()
  const path = new URL(request.url()).pathname
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS', 'content-type': 'application/json', 'content-range': '0-0/0' }
  const fulfill = (body, status = 200) => route.fulfill({ status, headers, body: typeof body === 'string' ? body : JSON.stringify(body) })
  if (request.method() === 'OPTIONS') return fulfill('', 204)
  if (path === '/auth/v1/token') return fulfill({ access_token: jwt, refresh_token: 'DATA_DEMO_REFRESH', token_type: 'bearer', expires_in: 3600, user })
  if (path === '/auth/v1/user') return fulfill(user)
  if (path === '/rest/v1/profiles') return fulfill(request.headers().accept?.includes('object+json') ? profile : [profile])
  if (path === '/rest/v1/rpc/list_evidence') return fulfill([])
  if (path === '/rest/v1/rpc/save_meeting_draft') {
    if (failSaveOnce) { failSaveOnce = false; return fulfill({ message: 'DATA DEMO network error' }, 503) }
    const draft = request.postDataJSON().p_payload
    meeting = {
      ...draft, id: meetingId, owner_id: userId, version: (meeting?.version ?? 0) + 1, status: 'DRAFT',
      meeting_participants: draft.participants.map((entry, index) => ({ ...entry, id: `${index}`, profile_id: null })),
      meeting_items: draft.items.map((entry, index) => ({ ...entry, id: `${index}`, draft_pic_id: null, draft_start_date: null, draft_due_date: null })),
    }
    return fulfill(meeting)
  }
  if (path === '/rest/v1/meetings') {
    if (new URL(request.url()).searchParams.has('id')) return fulfill(meeting ?? null)
    return fulfill([])
  }
  if (path === '/rest/v1/actions') return fulfill(request.method() === 'HEAD' ? '' : [])
  return fulfill([])
}

async function login(page) {
  await page.goto(`${origin}/login`)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Kata sandi').fill('DATA DEMO')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL(`${origin}/`, { timeout: 15000 })
}

try {
  let ready = false
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await globalThis.fetch(`${origin}/login`)).ok) { ready = true; break } } catch { /* server starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert(ready, 'Vite did not start')
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ timezoneId: 'UTC' })
  await context.route(`${apiOrigin}/**`, mockApi)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await login(page)
  await page.goto(`${origin}/meetings/new`)
  await page.getByLabel('Judul rapat').fill('Browser Tahap 0 DATA DEMO')
  await page.getByLabel('Waktu rapat (WITA)').fill('2026-09-22T09:00')
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(450)
    const overflow = await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth)
    assert(overflow, `Form overflows at ${width}`)
    await page.screenshot({ path: `docs/qa/stage0-form-${width}.png`, fullPage: true })
  }
  await page.getByRole('button', { name: 'Simpan draf' }).click()
  await page.waitForURL(`${origin}/meetings/${meetingId}`)
  assert.equal(meeting.starts_at, '2026-09-22T01:00:00.000Z')
  await page.reload()
  assert.equal(await page.getByLabel('Waktu rapat (WITA)').inputValue(), '2026-09-22T09:00')
  await page.getByRole('button', { name: 'Finalisasi' }).click()
  const dialog = page.getByRole('dialog')
  assert(await dialog.isVisible())
  assert(await dialog.getByRole('button', { name: 'Batal' }).evaluate((element) => element === globalThis.document.activeElement))
  await page.keyboard.press('Shift+Tab')
  assert(await dialog.getByRole('button', { name: 'Ya, finalisasi' }).evaluate((element) => element === globalThis.document.activeElement))
  await page.keyboard.press('Tab')
  assert(await dialog.getByRole('button', { name: 'Batal' }).evaluate((element) => element === globalThis.document.activeElement))
  await page.keyboard.press('Escape')
  assert(!(await dialog.isVisible()))
  assert(await page.getByRole('button', { name: 'Finalisasi' }).evaluate((element) => element === globalThis.document.activeElement))
  await page.getByLabel('Judul rapat').fill('Retry DATA DEMO')
  failSaveOnce = true
  await page.getByRole('button', { name: 'Simpan draf' }).click()
  await page.getByText('Gagal ✗').waitFor()
  assert.equal(await page.getByLabel('Judul rapat').inputValue(), 'Retry DATA DEMO')
  await page.getByRole('button', { name: 'Simpan draf' }).click()
  await page.getByText('Tersimpan ✓').waitFor()
  await page.reload()
  assert.equal(await page.getByLabel('Judul rapat').inputValue(), 'Retry DATA DEMO')
  const jakarta = await browser.newContext({ timezoneId: 'Asia/Jakarta' })
  await jakarta.route(`${apiOrigin}/**`, mockApi)
  const jakartaPage = await jakarta.newPage()
  await login(jakartaPage)
  await jakartaPage.goto(`${origin}/meetings/${meetingId}`)
  assert.equal(await jakartaPage.getByLabel('Waktu rapat (WITA)').inputValue(), '2026-09-22T09:00')
  assert.deepEqual(errors, [])
  console.log('PASS browser Edge UI-mock: form 1440/1024/390, WITA UTC/Jakarta, save/reload, failure/retry, finalize keyboard; DB integration remains NOT_RUN')
  await jakarta.close()
  await context.close()
} finally {
  if (browser) await browser.close()
  server.kill()
}
