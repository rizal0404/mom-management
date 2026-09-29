import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { URL } from 'node:url'

const localEnv = Object.fromEntries((existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '').split(/\r?\n/)
  .filter((line) => /^[A-Z0-9_]+=.*/.test(line))
  .map((line) => { const separator = line.indexOf('='); return [line.slice(0, separator), line.slice(separator + 1)] }))
const apiUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL
if (!apiUrl || new URL(apiUrl).origin !== 'http://127.0.0.1:54321') {
  throw new Error('E2E DATA DEMO hanya boleh berjalan pada Supabase lokal 127.0.0.1:54321; cloud ditolak.')
}

const functionProcess = spawn('supabase', ['functions', 'serve', 'manage-users'], {
  cwd: process.cwd(),
  stdio: 'ignore',
  windowsHide: true,
})

async function waitForFunction() {
  const endpoint = 'http://127.0.0.1:54321/functions/v1/manage-users'
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await globalThis.fetch(endpoint, { method: 'OPTIONS' })
      if (response.ok) return
    } catch {
      // The Edge runtime is still starting.
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 500))
  }
  throw new Error('Edge Function manage-users tidak tersedia. Jalankan supabase start lalu coba lagi.')
}

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      windowsHide: true,
    })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve(undefined) : reject(new Error(`Playwright selesai dengan kode ${code ?? 'tidak diketahui'}.`)))
  })
}

try {
  await waitForFunction()
  await runPlaywright()
} finally {
  if (!functionProcess.killed) functionProcess.kill()
}
