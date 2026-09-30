import { expect, test, type Page } from '@playwright/test'

const password = 'DemoPass123!'
const label = `E2E DATA DEMO ${Date.now()}`

async function login(page: Page, email: string, userPassword = password) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(userPassword)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

async function verifyPrintButton(page: Page) {
  const button = page.getByRole('button', { name: 'Cetak / Simpan PDF' })
  await expect(button).toBeVisible()
  await page.evaluate(() => {
    window.print = () => { document.documentElement.dataset.printCalled = 'true' }
  })
  await button.click()
  await expect(page.locator('html')).toHaveAttribute('data-print-called', 'true')
}

function witaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDate(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function summaryCount(page: Page, label: RegExp) {
  const card = page.getByRole('link', { name: label })
  await expect(card.locator('strong')).toHaveText(/^\d+$/)
  return Number(await card.locator('strong').innerText())
}

test('MOM-013 pintasan personal mengikuti PIC sesi dan berganti pada tengah malam WITA', async ({ browser }) => {
  const suffix = Date.now()
  const password = 'TemporaryPass123!'
  const picAName = `MOM-013 PIC A ${suffix}`
  const picBName = `MOM-013 PIC B ${suffix}`
  const picAEmail = `mom013-a-${suffix}@mom.local`
  const picBEmail = `mom013-b-${suffix}@mom.local`
  const label = `MOM-013 DATA DEMO ${suffix}`
  const today = witaDate()
  const adminContext = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const memberContext = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const adminPage = await adminContext.newPage()
  const page = await memberContext.newPage()
  let createdUsers = false
  try {
    await login(adminPage, 'admin.demo@mom.local')
    await adminPage.goto('/users')
    for (const [name, email] of [[picAName, picAEmail], [picBName, picBEmail]]) {
      await adminPage.getByLabel('Nama pengguna baru').fill(name)
      await adminPage.getByLabel('Email pengguna baru').fill(email)
      await adminPage.getByLabel('Kata sandi sementara').fill(password)
      await adminPage.getByLabel('Peran pengguna baru').selectOption('MEMBER')
      await adminPage.getByRole('button', { name: 'Buat akun' }).click()
      await expect(adminPage.getByRole('status')).toContainText('Akun dibuat')
      createdUsers = true
      await expect(adminPage.getByRole('form', { name: `Kelola ${name}` })).toBeVisible()
    }

    // WITA midnight is 16:00 UTC. Freeze just before it so the same date stays active
    // while the fixture is entered, then advance across the boundary below.
    await page.clock.pauseAt(new Date(`${today}T15:59:58.000Z`))
    await login(page, picAEmail, password)
    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(label)
    await page.getByLabel('Waktu rapat').fill(`${today}T09:00`)
    await page.getByLabel('Pimpinan rapat').fill('Ketua MOM-013 DATA DEMO')
    await page.getByLabel('Peserta 1').fill('Peserta MOM-013 DATA DEMO')
    const fillTask = async (index: number, title: string, pic: string, startDate: string, dueDate: string) => {
      const item = page.getByRole('group', { name: `Agenda ${index}` })
      await item.getByLabel('Agenda').fill(title)
      await item.getByLabel('Jenis').selectOption('TASK')
      await item.getByLabel('Hasil rapat').fill(`Hasil ${title}`)
      await item.getByLabel('PIC').selectOption({ label: pic })
      await item.getByLabel('Mulai').fill(startDate)
      await item.getByLabel('Jatuh tempo').fill(dueDate)
    }
    await fillTask(1, `${label} hari ini`, picAName, today, today)
    await page.getByRole('button', { name: 'Tambah agenda' }).click()
    await fillTask(2, `${label} +8 hari`, picAName, today, shiftDate(today, 8))
    await page.getByRole('button', { name: 'Tambah agenda' }).click()
    await fillTask(3, `${label} PIC B terlambat`, picBName, shiftDate(today, -1), shiftDate(today, -1))
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await page.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(page.getByText('Final', { exact: true })).toBeVisible()

    await page.goto('/actions?preset=mine')
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: `${label} +8 hari`, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: `${label} PIC B terlambat`, exact: true })).toHaveCount(0)
    expect(await summaryCount(page, /Tugas Saya/)).toBe(2)
    expect(await summaryCount(page, /Jatuh tempo hari ini/)).toBe(1)
    expect(await summaryCount(page, /7 hari ke depan/)).toBe(1)
    expect(await summaryCount(page, /Terlambat/)).toBe(0)

    await page.getByRole('link', { name: /Jatuh tempo hari ini/ }).click()
    await expect(page).toHaveURL(/\/actions\?preset=today$/)
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toBeVisible()
    await page.getByRole('link', { name: `${label} hari ini`, exact: true }).click()
    await expect(page).toHaveURL(/\/actions\/[0-9a-f-]+$/)
    await expect(page.getByLabel('Deadline')).toHaveValue(today)

    await page.clock.fastForward(3000)
    await page.goto('/actions?preset=today')
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toHaveCount(0)
    expect(await summaryCount(page, /Jatuh tempo hari ini/)).toBe(0)
    await page.getByRole('link', { name: /Terlambat/ }).click()
    await expect(page).toHaveURL(/\/actions\?preset=overdue$/)
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toBeVisible()
    await page.getByRole('link', { name: /7 hari ke depan/ }).click()
    await expect(page).toHaveURL(/\/actions\?preset=next7$/)
    await expect(page.getByRole('link', { name: `${label} +8 hari`, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await login(page, picBEmail, password)
    await page.goto('/actions?preset=mine')
    await expect(page).toHaveURL(/\/actions\?preset=mine$/)
    await expect(page.getByRole('link', { name: `${label} PIC B terlambat`, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: `${label} +8 hari`, exact: true })).toHaveCount(0)
    expect(await summaryCount(page, /Tugas Saya/)).toBe(1)
    expect(await summaryCount(page, /Jatuh tempo hari ini/)).toBe(0)
    expect(await summaryCount(page, /7 hari ke depan/)).toBe(0)
    expect(await summaryCount(page, /Terlambat/)).toBe(1)

    await page.getByRole('link', { name: `${label} PIC B terlambat`, exact: true }).click()
    await expect(page).toHaveURL(/\/actions\/[0-9a-f-]+$/)
    await page.goto('/actions?preset=mine')
    await page.getByText('Filter', { exact: true }).click()
    await page.getByRole('button', { name: 'Reset filter' }).click()
    await expect(page).toHaveURL(/\/actions$/)
    await expect(page.getByRole('link', { name: `${label} PIC B terlambat`, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: `${label} hari ini`, exact: true })).toBeVisible()
  } finally {
    await memberContext.close()
    if (createdUsers) {
      for (const name of [picAName, picBName]) {
        const form = adminPage.getByRole('form', { name: `Kelola ${name}` })
        if (await form.count()) {
          await form.getByLabel('Status akses').selectOption('false')
          await form.getByRole('button', { name: 'Simpan perubahan' }).click()
          await expect(adminPage.getByRole('status')).toContainText('Data pengguna diperbarui')
        }
      }
    }
    await adminContext.close()
  }
})

test('A dan B: draf privat, finalisasi, tindak lanjut PIC dan audit setelah refresh', async ({ browser }) => {
  const a = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const b = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const admin = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const aPage = await a.newPage()
  const bPage = await b.newPage()
  const adminPage = await admin.newPage()
  try {
    await aPage.goto('/meetings')
    await expect(aPage).toHaveURL(/\/login$/)
    await login(aPage, 'anggota-a.demo@mom.local')
    await login(bPage, 'anggota-b.demo@mom.local')
    await login(adminPage, 'admin.demo@mom.local')
    await aPage.goto('/meetings/new')
    await aPage.getByLabel('Judul rapat').fill(label)
    await aPage.getByLabel('Waktu rapat').fill('2026-09-22T09:00')
    await aPage.getByLabel('Pimpinan rapat').fill('Ketua DATA DEMO')
    await aPage.getByLabel('Peserta 1').fill('Peserta DATA DEMO')
    const fillItem = async (index: number, kind: string, agenda: string, pic?: string) => {
      const fieldset = aPage.getByRole('group', { name: `Agenda ${index}` })
      await fieldset.getByLabel('Agenda').fill(agenda)
      await fieldset.getByLabel('Jenis').selectOption(kind)
      await fieldset.getByLabel('Hasil rapat').fill(`Hasil ${agenda}`)
      if (pic) {
        await fieldset.getByLabel('PIC').selectOption({ label: pic })
        await fieldset.getByLabel('Mulai').fill('2026-09-22')
        await fieldset.getByLabel('Jatuh tempo').fill('2026-09-25')
      }
    }
    await fillItem(1, 'DECISION', `${label} keputusan`)
    await aPage.getByRole('button', { name: 'Tambah agenda' }).click()
    await fillItem(2, 'TASK', `${label} task`, 'Anggota B DATA DEMO')
    await aPage.getByRole('button', { name: 'Tambah agenda' }).click()
    await fillItem(3, 'PENDING_MATTER', `${label} pending`, 'Anggota A DATA DEMO')
    await aPage.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(aPage).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    const meetingPath = new URL(aPage.url()).pathname
    await aPage.reload()
    await expect(aPage.getByLabel('Judul rapat')).toHaveValue(label)
    await verifyPrintButton(aPage)
    await adminPage.goto(meetingPath)
    await expect(adminPage.getByLabel('Judul rapat')).toHaveValue(label)
    await verifyPrintButton(adminPage)
    await bPage.goto(meetingPath)
    await expect(bPage.getByRole('alert')).toContainText('tidak dapat diakses')
    await expect(bPage.getByRole('button', { name: 'Cetak / Simpan PDF' })).toHaveCount(0)
    await aPage.getByRole('button', { name: 'Finalisasi' }).click()
    await aPage.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(aPage.getByText('Final', { exact: true })).toBeVisible()
    await bPage.reload()
    await expect(bPage.getByRole('heading', { name: label, exact: true })).toBeVisible()
    await verifyPrintButton(bPage)
    await bPage.goto(`/actions?search=${encodeURIComponent(label)}`)
    await expect(bPage.locator('.result-count')).toContainText('2 item')
    await expect(bPage.getByRole('link', { name: `${label} task`, exact: true })).toBeVisible()
    await expect(bPage.getByRole('link', { name: `${label} keputusan`, exact: true })).toHaveCount(0)
    await bPage.getByRole('link', { name: `${label} task`, exact: true }).click()
    const actionPath = new URL(bPage.url()).pathname
    await expect(bPage.getByLabel('Deadline')).toBeDisabled()
    await bPage.getByLabel('Status').selectOption('IN_PROGRESS')
    await bPage.getByLabel('Catatan perubahan').fill('Mulai dikerjakan DATA DEMO')
    await bPage.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(bPage.getByText('Mulai dikerjakan DATA DEMO')).toBeVisible()
    await bPage.getByLabel('Status').selectOption('DONE')
    await bPage.getByLabel('Catatan perubahan').fill('Resolusi selesai DATA DEMO')
    await bPage.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(bPage.getByText('Resolusi selesai DATA DEMO')).toBeVisible()
    await aPage.goto(actionPath)
    await expect(aPage.getByText('Resolusi selesai DATA DEMO')).toBeVisible()
    await expect(aPage.getByText('Mulai dikerjakan DATA DEMO')).toBeVisible()
    await aPage.reload()
    await expect(aPage.getByText('Resolusi selesai DATA DEMO')).toBeVisible()
    await bPage.goto(`/actions?search=${encodeURIComponent(label)}`)
    await bPage.getByRole('link', { name: `${label} pending`, exact: true }).click()
    await expect(bPage.getByRole('button', { name: 'Simpan pembaruan' })).toHaveCount(0)
  } finally {
    await a.close()
    await b.close()
    await admin.close()
  }
})

test('gagal jaringan, retry, direct URL, keyboard dan viewport responsif', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto('/login')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('id', 'email')
    await login(page, 'anggota-a.demo@mom.local')
    await page.goto('/meetings/new')
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page.getByRole('alert')).toContainText('Judul rapat wajib diisi')
    await page.route('**/rest/v1/actions**', (route) => route.abort('failed'))
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText('Dashboard tidak dapat dimuat')
    await page.unroute('**/rest/v1/actions**')
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByRole('heading', { name: 'Ringkasan kerja' })).toBeVisible()
    await page.route('**/rest/v1/actions**', (route) => route.abort('failed'))
    await page.goto('/actions')
    await expect(page.getByRole('alert')).toContainText('Tindak lanjut tidak dapat dimuat')
    await page.unroute('**/rest/v1/actions**')
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.locator('.result-count')).toBeVisible()
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/', '/meetings/new', '/actions', '/actions?view=timeline']) {
        await page.goto(path)
        await expect(page.locator('body')).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
        if ((width === 390 && path === '/') || (width === 1024 && path === '/meetings/new') || (width === 1440 && path === '/actions')) {
          if (path === '/') await expect(page.getByRole('heading', { name: 'Ringkasan kerja' })).toBeVisible()
          if (path === '/actions') await expect(page.locator('.result-count')).toBeVisible()
          const name = path === '/' ? 'dashboard' : path === '/meetings/new' ? 'form' : 'tracker'
          await page.screenshot({ path: `docs/qa/MOM-009-${name}-${width}.png`, fullPage: true })
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/actions')
    await expect(page).toHaveURL(/\/login$/)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})

test('owner dapat menghapus agenda pertama dari draf lalu menyimpan urutan baru', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const label = `Urut ulang DATA DEMO ${Date.now()}`
  try {
    await login(page, 'anggota-a.demo@mom.local')
    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(label)
    await page.getByRole('group', { name: 'Agenda 1' }).getByLabel('Agenda').fill('Agenda pertama dihapus')
    await page.getByRole('button', { name: 'Tambah agenda' }).click()
    await page.getByRole('group', { name: 'Agenda 2' }).getByLabel('Agenda').fill('Agenda kedua dipertahankan')
    await page.getByRole('button', { name: 'Tambah agenda' }).click()
    await page.getByRole('group', { name: 'Agenda 3' }).getByLabel('Agenda').fill('Agenda ketiga dipertahankan')
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)

    await page.getByRole('group', { name: 'Agenda 1' }).getByRole('button', { name: 'Hapus agenda' }).click()
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page.getByRole('group', { name: 'Agenda 1' }).getByLabel('Agenda')).toHaveValue('Agenda kedua dipertahankan')
    await expect(page.getByRole('group', { name: 'Agenda 2' }).getByLabel('Agenda')).toHaveValue('Agenda ketiga dipertahankan')
    await expect(page.getByRole('group', { name: 'Agenda 3' })).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('group', { name: 'Agenda 1' }).getByLabel('Agenda')).toHaveValue('Agenda kedua dipertahankan')
    await expect(page.getByRole('group', { name: 'Agenda 2' }).getByLabel('Agenda')).toHaveValue('Agenda ketiga dipertahankan')
  } finally {
    await context.close()
  }
})

test('finalisasi menolak perubahan draf yang belum disimpan lalu memakai hasil tersimpan', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const label = `Finalisasi tersimpan DATA DEMO ${Date.now()}`
  try {
    await login(page, 'anggota-a.demo@mom.local')
    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(label)
    await page.getByLabel('Waktu rapat').fill('2026-09-22T09:00')
    await page.getByLabel('Pimpinan rapat').fill('Ketua DATA DEMO')
    await page.getByLabel('Peserta 1').fill('Peserta DATA DEMO')
    const item = page.getByRole('group', { name: 'Agenda 1' })
    await item.getByLabel('Agenda').fill('Keputusan finalisasi DATA DEMO')
    await item.getByLabel('Jenis').selectOption('DECISION')
    await item.getByLabel('Hasil rapat').fill('Hasil tersimpan awal')
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await expect(item.getByLabel('Hasil rapat')).toHaveValue('Hasil tersimpan awal')

    await item.getByLabel('Hasil rapat').fill('Hasil baru belum disimpan')
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await expect(page.getByRole('alert')).toContainText('Simpan draf terlebih dahulu sebelum finalisasi.')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Simpan draf' })).toBeFocused()

    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page.getByText('Tersimpan ✓')).toBeVisible()
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Batal' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('button', { name: 'Ya, finalisasi' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Batal' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Finalisasi' })).toBeFocused()
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await page.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(page.getByText('Final', { exact: true })).toBeVisible()
    await expect(page.getByText('Hasil baru belum disimpan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Hasil baru belum disimpan', { exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('waktu rapat WITA konsisten pada browser UTC dan Jakarta', async ({ browser }) => {
  const utc = await browser.newContext({ timezoneId: 'UTC' })
  const jakarta = await browser.newContext({ timezoneId: 'Asia/Jakarta' })
  const utcPage = await utc.newPage()
  const jakartaPage = await jakarta.newPage()
  const title = `WITA DATA DEMO ${Date.now()}`
  try {
    await login(utcPage, 'anggota-a.demo@mom.local')
    await utcPage.goto('/meetings/new')
    await utcPage.getByLabel('Judul rapat').fill(title)
    await utcPage.getByLabel('Waktu rapat (WITA)').fill('2026-09-22T09:00')
    const saved = utcPage.waitForRequest((request) => request.url().includes('/rpc/save_meeting_draft') && request.method() === 'POST')
    await utcPage.getByRole('button', { name: 'Simpan draf' }).click()
    const request = await saved
    expect(request.postDataJSON().p_payload.starts_at).toBe('2026-09-22T01:00:00.000Z')
    await expect(utcPage).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    const path = new URL(utcPage.url()).pathname
    await utcPage.reload()
    await expect(utcPage.getByLabel('Waktu rapat (WITA)')).toHaveValue('2026-09-22T09:00')
    await login(jakartaPage, 'anggota-a.demo@mom.local')
    await jakartaPage.goto(path)
    await expect(jakartaPage.getByLabel('Waktu rapat (WITA)')).toHaveValue('2026-09-22T09:00')
  } finally {
    await utc.close()
    await jakarta.close()
  }
})

test('owner menghapus action, PIC kehilangan akses detail langsung', async ({ browser }) => {
  const owner = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const pic = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const ownerPage = await owner.newPage()
  const picPage = await pic.newPage()
  const title = `Hapus action DATA DEMO ${Date.now()}`
  try {
    await login(ownerPage, 'anggota-a.demo@mom.local')
    await login(picPage, 'anggota-b.demo@mom.local')
    await ownerPage.goto('/meetings/new')
    await ownerPage.getByLabel('Judul rapat').fill(title)
    await ownerPage.getByLabel('Waktu rapat (WITA)').fill('2026-09-22T09:00')
    await ownerPage.getByLabel('Pimpinan rapat').fill('Ketua DATA DEMO')
    await ownerPage.getByLabel('Peserta 1').fill('Peserta DATA DEMO')
    const item = ownerPage.getByRole('group', { name: 'Agenda 1' })
    await item.getByLabel('Agenda').fill(title)
    await item.getByLabel('Jenis').selectOption('TASK')
    await item.getByLabel('PIC').selectOption({ label: 'Anggota B DATA DEMO' })
    await item.getByLabel('Mulai').fill('2026-09-22')
    await item.getByLabel('Jatuh tempo').fill('2026-09-25')
    await ownerPage.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(ownerPage).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await ownerPage.getByRole('button', { name: 'Finalisasi' }).click()
    await ownerPage.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(ownerPage.getByText('Final', { exact: true })).toBeVisible()
    await ownerPage.goto(`/actions?search=${encodeURIComponent(title)}`)
    await ownerPage.getByRole('link', { name: title, exact: true }).click()
    const actionPath = new URL(ownerPage.url()).pathname
    await picPage.goto(actionPath)
    await expect(picPage.getByRole('button', { name: 'Hapus task' })).toHaveCount(0)
    ownerPage.once('dialog', (dialog) => void dialog.accept())
    await ownerPage.getByRole('button', { name: 'Hapus task' }).click()
    await expect(ownerPage).toHaveURL(/\/actions$/)
    await ownerPage.goto(`/actions?search=${encodeURIComponent(title)}`)
    await expect(ownerPage.locator('.result-count')).toContainText('0 item')
    await picPage.reload()
    await expect(picPage.getByRole('heading', { name: 'Tindak lanjut tidak tersedia' })).toBeVisible()
    await expect(picPage.getByRole('button', { name: 'Simpan pembaruan' })).toHaveCount(0)
  } finally {
    await owner.close()
    await pic.close()
  }
})

test('perubahan draf memblokir back, navigasi internal, dan logout', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  try {
    await login(page, 'anggota-a.demo@mom.local')

    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(`A06 tersimpan DATA DEMO ${Date.now()}`)
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('link', { name: 'Notula', exact: true }).click()
    await expect(page).toHaveURL(/\/meetings$/)
    await page.getByRole('link', { name: 'Buat rapat' }).first().click()
    await page.getByLabel('Judul rapat').fill('A06 back DATA DEMO')
    await page.goBack({ waitUntil: 'commit' })
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page).toHaveURL(/\/meetings\/new$/)
    await page.getByRole('dialog').getByRole('button', { name: 'Batal' }).click()
    await expect(page.getByLabel('Judul rapat')).toHaveValue('A06 back DATA DEMO')

    await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Tinggalkan tanpa menyimpan' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill('A06 logout DATA DEMO')
    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal' }).click()
    await expect(page).not.toHaveURL(/\/login$/)
    await page.getByRole('button', { name: 'Keluar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Tinggalkan tanpa menyimpan' }).click()
    await expect(page).toHaveURL(/\/login$/)
  } finally {
    await context.close()
  }
})

test('action halaman kedua dapat dibuka melalui detail direct URL', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const label = `A02 halaman kedua DATA DEMO ${Date.now()}`
  try {
    await login(page, 'anggota-a.demo@mom.local')
    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(label)
    await page.getByLabel('Waktu rapat').fill('2026-09-23T09:00')
    await page.getByLabel('Pimpinan rapat').fill('Ketua A02 DATA DEMO')
    await page.getByLabel('Peserta 1').fill('Peserta A02 DATA DEMO')

    for (let index = 1; index <= 26; index += 1) {
      if (index > 1) await page.getByRole('button', { name: 'Tambah agenda' }).click()
      const item = page.getByRole('group', { name: `Agenda ${index}` })
      await item.getByLabel('Agenda').fill(`${label} item ${index}`)
      await item.getByLabel('Jenis').selectOption('TASK')
      await item.getByLabel('Hasil rapat').fill(`Hasil ${label} item ${index}`)
      await item.getByLabel('PIC').selectOption({ label: 'Anggota A DATA DEMO' })
      await item.getByLabel('Mulai').fill('2026-09-23')
      await item.getByLabel('Jatuh tempo').fill('2026-09-30')
    }

    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await page.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(page.getByText('Final', { exact: true })).toBeVisible()

    await page.goto(`/actions?search=${encodeURIComponent(label)}`)
    await expect(page.locator('.result-count')).toContainText('26 item')
    await page.getByRole('button', { name: 'Berikutnya →' }).click()
    await expect(page).toHaveURL(/\/actions\?search=.*&page=2$/)
    const secondPageAction = page.getByRole('link', { name: `${label} item 26`, exact: true })
    await expect(secondPageAction).toBeVisible()
    await secondPageAction.click()
    const actionPath = new URL(page.url()).pathname
    await expect(page.getByLabel('Judul')).toHaveValue(`${label} item 26`)
    await page.reload()
    await expect(page).toHaveURL(actionPath)
    await expect(page.getByLabel('Judul')).toHaveValue(`${label} item 26`)

    await page.goto(`/actions?view=timeline&search=${encodeURIComponent(label)}`)
    await expect(page.locator('.result-count')).toContainText('26 item')
    await page.getByLabel('Navigasi halaman timeline', { exact: true }).getByRole('button', { name: 'Berikutnya →', exact: true }).click()
    await expect(page.getByText('Halaman 2 dari 2 · 26 item')).toBeVisible()
    await page.getByRole('link', { name: `${label} item 26`, exact: false }).first().click()
    await expect(page.getByLabel('Judul')).toHaveValue(`${label} item 26`)
  } finally {
    await context.close()
  }
})

test('owner wajib memberi alasan saat mengubah deadline atau PIC', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const label = `A05 alasan perubahan DATA DEMO ${Date.now()}`
  try {
    await login(page, 'anggota-a.demo@mom.local')
    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(label)
    await page.getByLabel('Waktu rapat').fill('2026-09-23T09:00')
    await page.getByLabel('Pimpinan rapat').fill('Ketua A05 DATA DEMO')
    await page.getByLabel('Peserta 1').fill('Peserta A05 DATA DEMO')
    const item = page.getByRole('group', { name: 'Agenda 1' })
    await item.getByLabel('Agenda').fill(`${label} task`)
    await item.getByLabel('Jenis').selectOption('TASK')
    await item.getByLabel('Hasil rapat').fill('Hasil A05 DATA DEMO')
    await item.getByLabel('PIC').selectOption({ label: 'Anggota B DATA DEMO' })
    await item.getByLabel('Mulai').fill('2026-09-23')
    await item.getByLabel('Jatuh tempo').fill('2026-09-30')
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await page.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(page.getByText('Final', { exact: true })).toBeVisible()

    await page.goto(`/actions?search=${encodeURIComponent(label)}`)
    await page.getByRole('link', { name: `${label} task`, exact: true }).click()
    await page.getByLabel('Deadline').fill('2026-10-01')
    await page.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(page.getByRole('alert')).toContainText('Alasan wajib diisi')
    await expect(page.getByText('Versi saat dibaca: 1')).toBeVisible()

    await page.getByLabel('Catatan perubahan').fill('Penyesuaian deadline A05 DATA DEMO')
    await page.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(page.getByText('Penyesuaian deadline A05 DATA DEMO')).toBeVisible()
    await expect(page.getByText('Versi saat dibaca: 2')).toBeVisible()

    await page.getByLabel('PIC').selectOption('22222222-2222-2222-2222-222222222222')
    await expect(page.getByLabel('PIC')).toHaveValue('22222222-2222-2222-2222-222222222222')
    await page.getByLabel('Catatan perubahan').fill('')
    await page.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(page.getByRole('alert')).toContainText('Alasan wajib diisi')
    await page.getByLabel('Catatan perubahan').fill('Pengalihan PIC A05 DATA DEMO')
    await page.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(page.getByText('Pengalihan PIC A05 DATA DEMO')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('A09 filter notula, pagination, notula asal, dan status aktif default', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const label = `A09 pagination DATA DEMO ${Date.now()}`
  try {
    await login(page, 'anggota-a.demo@mom.local')

    await page.goto('/meetings?search=Draf%20privat%20A')
    await expect(page.getByRole('link', { name: /Draf privat A/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Notula final bersama/ })).toHaveCount(0)
    await page.goto('/meetings?status=FINAL&from=2026-09-21&to=2026-09-21')
    await expect(page.getByRole('link', { name: /Notula final bersama/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Draf privat A/ })).toHaveCount(0)

    for (let index = 1; index <= 26; index += 1) {
      await page.goto('/meetings/new')
      await page.getByLabel('Judul rapat').fill(`${label} ${index}`)
      await page.getByRole('button', { name: 'Simpan draf' }).click()
      await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    }
    await page.goto(`/meetings?search=${encodeURIComponent(label)}`)
    await expect(page.locator('.pagination__info')).toContainText('26 notula')
    await page.getByRole('button', { name: 'Berikutnya →' }).click()
    await expect(page).toHaveURL(/\/meetings\?search=.*&page=2$/)
    await expect(page.getByText(`${label} 1`, { exact: true })).toBeVisible()

    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(`${label} action`)
    await page.getByLabel('Waktu rapat').fill('2026-09-23T09:00')
    await page.getByLabel('Pimpinan rapat').fill('Ketua A09 DATA DEMO')
    await page.getByLabel('Peserta 1').fill('Peserta A09 DATA DEMO')
    const item = page.getByRole('group', { name: 'Agenda 1' })
    await item.getByLabel('Agenda').fill(`${label} action item`)
    await item.getByLabel('Jenis').selectOption('TASK')
    await item.getByLabel('Hasil rapat').fill('Hasil A09 DATA DEMO')
    await item.getByLabel('PIC').selectOption({ label: 'Anggota A DATA DEMO' })
    await item.getByLabel('Mulai').fill('2026-09-23')
    await item.getByLabel('Jatuh tempo').fill('2026-09-30')
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    const meetingId = new URL(page.url()).pathname.split('/').pop()
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await page.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(page.getByText('Final', { exact: true })).toBeVisible()

    await page.goto(`/actions?meeting=${meetingId}`)
    await expect(page.locator('.result-count')).toContainText('1 item')
    await page.getByRole('link', { name: `${label} action item`, exact: true }).click()
    await page.getByLabel('Status').selectOption('DONE')
    await page.getByLabel('Catatan perubahan').fill('Selesai A09 DATA DEMO')
    await page.getByRole('button', { name: 'Simpan pembaruan' }).click()
    await expect(page.getByText('Selesai A09 DATA DEMO')).toBeVisible()

    await page.goto(`/actions?meeting=${meetingId}`)
    await expect(page.locator('.result-count')).toContainText('0 item')
    await expect(page.getByLabel('Filter status')).toHaveValue('ACTIVE')
    await page.getByText('Filter', { exact: true }).click()
    await page.getByLabel('Filter status').selectOption('ALL')
    await expect(page.locator('.result-count')).toContainText('1 item')
    await expect(page.getByRole('link', { name: `${label} action item`, exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('A07 timeline memulihkan error saat retry, ganti pekan, dan filter', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Makassar' })
  const page = await context.newPage()
  const label = `A07 recovery DATA DEMO ${Date.now()}`
  try {
    await login(page, 'anggota-a.demo@mom.local')
    await page.goto('/meetings/new')
    await page.getByLabel('Judul rapat').fill(label)
    await page.getByLabel('Waktu rapat').fill('2026-09-23T09:00')
    await page.getByLabel('Pimpinan rapat').fill('Ketua A07 DATA DEMO')
    await page.getByLabel('Peserta 1').fill('Peserta A07 DATA DEMO')
    const item = page.getByRole('group', { name: 'Agenda 1' })
    await item.getByLabel('Agenda').fill(`${label} task`)
    await item.getByLabel('Jenis').selectOption('TASK')
    await item.getByLabel('Hasil rapat').fill('Hasil A07 DATA DEMO')
    await item.getByLabel('PIC').selectOption({ label: 'Anggota A DATA DEMO' })
    await item.getByLabel('Mulai').fill('2026-09-23')
    await item.getByLabel('Jatuh tempo').fill('2026-09-25')
    await page.getByRole('button', { name: 'Simpan draf' }).click()
    await expect(page).toHaveURL(/\/meetings\/[0-9a-f-]+$/)
    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await page.getByRole('button', { name: 'Ya, finalisasi' }).click()
    await expect(page.getByText('Final', { exact: true })).toBeVisible()

    const timelineRequest = (requestUrl: string) => requestUrl.includes('start_date=lte.') && requestUrl.includes('due_date=gte.')
    await page.route('**/rest/v1/actions**', async (route) => {
      if (timelineRequest(route.request().url())) await route.abort('failed')
      else await route.continue()
    })
    await page.goto(`/actions?view=timeline&week=2026-09-21&search=${encodeURIComponent(label)}`)
    await expect(page.getByText('Timeline tidak dapat dimuat.', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Coba lagi', exact: true })).toBeVisible()

    await page.unroute('**/rest/v1/actions**')
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await expect(page.getByText('Timeline tidak dapat dimuat.', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('Timeline mingguan', { exact: true }).getByRole('link', { name: `${label} task`, exact: false })).toBeVisible()

    await page.route('**/rest/v1/actions**', async (route) => {
      if (timelineRequest(route.request().url())) await route.abort('failed')
      else await route.continue()
    })
    await page.getByRole('button', { name: 'Pekan berikutnya →' }).click()
    await expect(page.getByText('Timeline tidak dapat dimuat.', { exact: true })).toBeVisible()
    await page.unroute('**/rest/v1/actions**')
    await page.getByRole('button', { name: 'Pekan sebelumnya' }).click()
    await expect(page.getByText('Timeline tidak dapat dimuat.', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('Timeline mingguan', { exact: true }).getByRole('link', { name: `${label} task`, exact: false })).toBeVisible()

    await page.getByText('Filter', { exact: true }).click()
    await page.getByLabel('Cari judul').fill('A07 tidak ada DATA DEMO')
    await expect(page.getByText('Timeline tidak dapat dimuat.', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Tidak ada action pada pekan ini', { exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('hanya admin dapat membuat dan mengelola user dari aplikasi', async ({ browser }) => {
  const memberContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const memberPage = await memberContext.newPage()
  const adminPage = await adminContext.newPage()
  const suffix = Date.now()
  const name = `User admin DATA DEMO ${suffix}`
  const email = `user-admin-${suffix}@mom.local`
  try {
    await login(memberPage, 'anggota-a.demo@mom.local')
    await memberPage.goto('/users')
    await expect(memberPage).toHaveURL(/\/$/)
    await expect(memberPage.getByRole('link', { name: 'Kelola pengguna' })).toHaveCount(0)

    await login(adminPage, 'admin.demo@mom.local')
    await adminPage.goto('/users')
    await expect(adminPage.getByRole('heading', { name: 'Kelola pengguna' }).last()).toBeVisible()
    await adminPage.getByLabel('Nama pengguna baru').fill(name)
    await adminPage.getByLabel('Email pengguna baru').fill(email)
    await adminPage.getByLabel('Kata sandi sementara').fill('TemporaryPass123!')
    await adminPage.getByLabel('Peran pengguna baru').selectOption('MEMBER')
    await adminPage.getByRole('button', { name: 'Buat akun' }).click()
    await expect(adminPage.getByRole('status')).toContainText('Akun dibuat')
    await expect(adminPage.getByRole('form', { name: `Kelola ${name}` })).toBeVisible()
    await expect(adminPage.getByRole('form', { name: `Kelola ${name}` }).getByText(email, { exact: true })).toBeVisible()

    await adminPage.getByLabel('Status akses').selectOption('false')
    await adminPage.getByRole('button', { name: 'Simpan perubahan' }).click()
    await expect(adminPage.getByRole('status')).toContainText('Data pengguna diperbarui')
    await expect(adminPage.getByLabel('Status akses')).toHaveValue('false')
  } finally {
    await memberContext.close()
    await adminContext.close()
  }
})
