// Audit probes: local DATA DEMO only. Adds fixtures; never resets or deletes existing data.
import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import console from 'node:console'
import { URL } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { chromium, expect } from '@playwright/test'

const status = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
if (!['127.0.0.1', 'localhost'].includes(new URL(status.API_URL).hostname)) throw new Error('Local API required')
const env = readFileSync('.env.local', 'utf8')
const configuredUrl = env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1]
if (!configuredUrl || !['127.0.0.1', 'localhost'].includes(new URL(configuredUrl).hostname)) throw new Error('Local frontend required')
const client = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } })
const demoPassword = process.env.MOM_DEMO_PASSWORD
if (!demoPassword) throw new Error('Set MOM_DEMO_PASSWORD in the local test environment')
const login = await client.auth.signInWithPassword({ email: 'anggota-a.demo@mom.local', password: demoPassword })
if (login.error) throw login.error
const label = `AUDIT DATA DEMO ${Date.now()}`
const out = { label, findings: [], fixtureIds: [] }
const record = (name, evidence) => { out.findings.push({ name, ...evidence }); console.log(JSON.stringify({ name, ...evidence })) }
const base = {
  title: label, starts_at: '2026-09-22T09:00:00+08:00', chair_name: 'Ketua DATA DEMO',
  participants: [{ display_name_snapshot: 'Peserta DATA DEMO' }],
}
const makeItem = (i) => ({ position: i, kind: 'TASK', agenda: `${label} task ${i}`, result: 'Hasil DATA DEMO', draft_pic_id: login.data.user.id, draft_start_date: '2099-01-01', draft_due_date: '2099-01-02' })
const create = async (items, suffix) => {
  const r = await client.rpc('save_meeting_draft', { p_payload: { ...base, title: `${label} ${suffix}`, items }, p_expected_version: null })
  if (r.error) throw r.error
  out.fixtureIds.push(r.data.id)
  return r.data
}
let browser
try {
  const bulk = await create(Array.from({ length: 30 }, (_, i) => makeItem(i + 1)), 'bulk')
  const final = await client.rpc('finalize_meeting', { p_id: bulk.id, p_expected_version: 1 })
  if (final.error) throw final.error
  const all = await client.from('actions').select('id,title,version').order('due_date').order('updated_at', { ascending: false })
  const target = all.data.slice(25).find((r) => r.title.startsWith(label))
  if (!target) throw new Error('No page-two fixture')
  const noReason = await client.rpc('update_action', { p_id: target.id, p_expected_version: target.version, p_patch: { due_date: '2099-01-03' }, p_note: null })
  record('deadline_without_reason', { accepted: !noReason.error, error: noReason.error?.message ?? null })
  const nullVersion = await client.rpc('update_action', { p_id: target.id, p_expected_version: null, p_patch: { status: 'IN_PROGRESS' }, p_note: 'Audit null version DATA DEMO' })
  record('null_expected_version', { accepted: !nullVersion.error, error: nullVersion.error?.message ?? null })

  const reorder = await create([1, 2].map((i) => ({ position: i, kind: 'NOTE', agenda: `Catatan ${i}`, result: 'DATA DEMO' })), 'remove-first')
  const children = await client.from('meeting_items').select('*').eq('meeting_id', reorder.id).order('position')
  const remove = await client.rpc('save_meeting_draft', { p_payload: { ...base, id: reorder.id, items: [{ ...children.data[1], position: 1 }] }, p_expected_version: 1 })
  record('remove_first_item', { accepted: !remove.error, code: remove.error?.code ?? null, error: remove.error?.message ?? null })

  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar', viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5175/login')
  await page.getByLabel('Email').fill('anggota-a.demo@mom.local')
  await page.getByLabel('Kata sandi').fill(demoPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL('http://127.0.0.1:5175/')
  await page.goto(`http://127.0.0.1:5175/actions/${target.id}`)
  await page.getByRole('heading', { name: 'Tindak lanjut tidak tersedia' }).waitFor()
  record('action_after_first_25', { databaseRecordExists: true, UI: await page.locator('.empty-state').innerText(), actionId: target.id })
  await page.screenshot({ path: 'docs/qa/audit-2026-09-22/detail-after-25.png', fullPage: true })

  const dirty = await create([{ position: 1, kind: 'DECISION', agenda: 'Kesepakatan tersimpan', result: 'HASIL LAMA DATA DEMO' }], 'dirty-final')
  await page.goto(`http://127.0.0.1:5175/meetings/${dirty.id}`)
  await expect(page.getByLabel('Judul rapat')).toHaveValue(`${label} dirty-final`)
  await expect(page.getByRole('textbox', { name: 'Hasil', exact: true })).toHaveValue('HASIL LAMA DATA DEMO')
  await page.getByRole('textbox', { name: 'Hasil', exact: true }).fill('HASIL BARU BELUM DISIMPAN DATA DEMO')
  await page.getByRole('button', { name: 'Finalisasi', exact: true }).click()
  await page.getByRole('button', { name: 'Ya, finalisasi', exact: true }).click()
  await page.getByText('Notula final', { exact: true }).waitFor()
  const beforeReload = await page.getByText('Hasil: HASIL BARU BELUM DISIMPAN DATA DEMO', { exact: true }).isVisible()
  await page.reload()
  await page.getByText('Hasil: HASIL LAMA DATA DEMO', { exact: true }).waitFor()
  record('dirty_finalization', { displayedUnsavedAsFinal: beforeReload, afterReload: 'HASIL LAMA DATA DEMO', meetingId: dirty.id })

  await page.goto('http://127.0.0.1:5175/meetings/new')
  await page.getByLabel('Judul rapat').fill('INPUT BELUM DISIMPAN DATA DEMO')
  let dialogs = 0
  page.on('dialog', async d => { dialogs++; await d.dismiss() })
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
  await page.waitForURL('http://127.0.0.1:5175/')
  record('dirty_internal_navigation', { leftWithoutWarning: dialogs === 0, dialogs })

  await page.route('**/rest/v1/actions**', route => route.abort())
  await page.goto('http://127.0.0.1:5175/actions?view=timeline&week=2098-12-29')
  await page.getByText('Timeline tidak dapat dimuat.', { exact: true }).waitFor()
  await page.unroute('**/rest/v1/actions**')
  await page.getByRole('button', { name: 'Pekan berikutnya', exact: false }).click()
  await page.waitForResponse(r => r.url().includes('/rest/v1/actions') && r.status() === 200)
  record('timeline_error_recovery', { errorRemainsAfterSuccessfulNewWeek: await page.getByText('Timeline tidak dapat dimuat.', { exact: true }).isVisible() })
  await context.close()
} finally {
  if (browser) await browser.close()
  writeFileSync('docs/qa/audit-2026-09-22/results.json', JSON.stringify(out, null, 2))
}
