// Resume UI checks on the existing audit draft; no new database fixture.
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import console from 'node:console'
import { URL } from 'node:url'
import { chromium, expect } from '@playwright/test'
const path = 'docs/qa/audit-2026-09-22/results.json'
const out = JSON.parse(readFileSync(path, 'utf8'))
const configuredUrl = readFileSync('.env.local', 'utf8').match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1]
if (!configuredUrl || !['127.0.0.1', 'localhost'].includes(new URL(configuredUrl).hostname)) throw new Error('Local frontend required')
const demoPassword = process.env.MOM_DEMO_PASSWORD
if (!demoPassword) throw new Error('Set MOM_DEMO_PASSWORD in the local test environment')
const record = (name, evidence) => { out.findings.push({ name, ...evidence }); console.log(JSON.stringify({ name, ...evidence })) }
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar', viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5175/login')
  await page.getByLabel('Email').fill('anggota-a.demo@mom.local')
  await page.getByLabel('Kata sandi').fill(demoPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL('http://127.0.0.1:5175/')
  const meetingId = out.fixtureIds[2]
  await page.goto(`http://127.0.0.1:5175/meetings/${meetingId}`)
  await expect(page.getByRole('textbox', { name: 'Hasil', exact: true })).toHaveValue('HASIL LAMA DATA DEMO')
  await page.getByRole('textbox', { name: 'Hasil', exact: true }).fill('HASIL BARU BELUM DISIMPAN DATA DEMO')
  await page.getByRole('button', { name: 'Finalisasi', exact: true }).click()
  await page.getByRole('button', { name: 'Ya, finalisasi', exact: true }).click()
  await page.getByText('Notula final', { exact: true }).waitFor()
  const beforeReload = await page.getByText('Hasil: HASIL BARU BELUM DISIMPAN DATA DEMO', { exact: true }).isVisible()
  await page.screenshot({ path: 'docs/qa/audit-2026-09-22/final-before-reload.png', fullPage: true })
  await page.reload()
  await page.getByText('Hasil: HASIL LAMA DATA DEMO', { exact: true }).waitFor()
  record('dirty_finalization', { displayedUnsavedAsFinal: beforeReload, afterReload: 'HASIL LAMA DATA DEMO', meetingId })
  await page.screenshot({ path: 'docs/qa/audit-2026-09-22/final-after-reload.png', fullPage: true })
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
  const response = page.waitForResponse(r => r.url().includes('/rest/v1/actions') && r.status() === 200)
  await page.getByRole('button', { name: 'Pekan berikutnya', exact: false }).click()
  await response
  record('timeline_error_recovery', { errorRemainsAfterSuccessfulNewWeek: await page.getByText('Timeline tidak dapat dimuat.', { exact: true }).isVisible() })
} finally { await browser.close(); writeFileSync(path, JSON.stringify(out, null, 2)) }
