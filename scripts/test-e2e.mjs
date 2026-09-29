import { spawn } from 'node:child_process'
import process from 'node:process'

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
