import { expect, test, type Page } from '@playwright/test'

test.use({ trace: 'off' })

const initialPassword = 'TemporaryPass123!'
const updatedPassword = 'ChangedPass456!'
const finalPassword = 'FinalAccountPass789!'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
}

async function setInactive(adminPage: Page, displayName: string) {
  const form = adminPage.getByRole('form', { name: `Kelola ${displayName}` })
  if (await form.count() && await form.getByLabel('Status akses').inputValue() !== 'false') {
    await form.getByLabel('Status akses').selectOption('false')
    await form.getByRole('button', { name: 'Simpan perubahan' }).click()
    await expect(adminPage.getByRole('status')).toContainText('Data pengguna diperbarui')
  }
}

async function waitForRecoveryLink(email: string) {
  const mailbox = email.split('@')[0]
  const endpoint = `http://127.0.0.1:54324/api/v1/mailbox/${encodeURIComponent(mailbox)}`
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(endpoint)
    if (response.ok) {
      const result: unknown = await response.json()
      const messages = Array.isArray(result)
        ? result
        : typeof result === 'object' && result !== null && 'messages' in result && Array.isArray(result.messages)
          ? result.messages
          : []
      const message = messages.find((item: unknown) => typeof item === 'object' && item !== null
        && JSON.stringify(item).toLowerCase().includes(email.toLowerCase()))
      const id = typeof message === 'object' && message !== null && 'id' in message ? message.id : null
      if (typeof id === 'string') {
        const detailResponse = await fetch(`${endpoint}/${encodeURIComponent(id)}`)
        if (detailResponse.ok) {
          const detail = await detailResponse.text()
          const links = [...detail.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((match) => match[0].replaceAll('&amp;', '&'))
          const recoveryUrl = links.find((value) => value.includes('/auth/v1/verify') && value.includes('type=recovery'))
          if (recoveryUrl) return recoveryUrl
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Tautan pemulihan DATA DEMO tidak ditemukan pada penangkap email lokal.')
}

test('MOM-015: pemulihan sandi melalui Auth lokal, tautan hanya kembali ke aplikasi, dan akun nonaktif tetap ditolak', async ({ browser }) => {
  const adminContext = await browser.newContext()
  const memberContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  const memberPage = await memberContext.newPage()
  const suffix = Date.now()
  const displayName = `MOM-015 DATA DEMO ${suffix}`
  const email = `mom-015-${suffix}@mom.local`
  let userCreated = false

  try {
    await login(adminPage, 'admin.demo@mom.local', 'DemoPass123!')
    await expect(adminPage).not.toHaveURL(/\/login$/)
    await adminPage.goto('/users')
    await adminPage.getByLabel('Nama pengguna baru').fill(displayName)
    await adminPage.getByLabel('Email pengguna baru').fill(email)
    await adminPage.getByLabel('Kata sandi sementara').fill(initialPassword)
    await adminPage.getByLabel('Peran pengguna baru').selectOption('MEMBER')
    await adminPage.getByRole('button', { name: 'Buat akun' }).click()
    await expect(adminPage.getByRole('status')).toContainText('Akun dibuat')
    userCreated = true

    await memberPage.goto('/login')
    await expect(memberPage.getByRole('link', { name: 'Lupa kata sandi?' })).toBeVisible()
    await memberPage.getByRole('link', { name: 'Lupa kata sandi?' }).click()
    await expect(memberPage).toHaveURL(/\/account\/recovery$/)
    await memberPage.getByLabel('Email').fill(`missing-${suffix}@mom.local`)
    await memberPage.getByRole('button', { name: 'Kirim instruksi pemulihan' }).click()
    const genericMessage = 'Jika akun terdaftar, instruksi pemulihan akan dikirim ke alamat tersebut.'
    await expect(memberPage.getByRole('status')).toHaveText(genericMessage)

    await memberPage.getByLabel('Email').fill(email)
    let redirectTarget: string | null = null
    memberPage.on('request', (request) => {
      const requestUrl = new URL(request.url())
      if (requestUrl.pathname.endsWith('/auth/v1/recover')) {
        redirectTarget = requestUrl.searchParams.get('redirect_to')
      }
    })
    await memberPage.getByRole('button', { name: 'Kirim instruksi pemulihan' }).click()
    await expect(memberPage.getByRole('status')).toHaveText(genericMessage)
    expect(redirectTarget).toBe('http://127.0.0.1:5174/account/password')

    const recoveryLink = await waitForRecoveryLink(email)
    const parsedLink = new URL(recoveryLink)
    expect(parsedLink.origin).toBe('http://127.0.0.1:54321')
    expect(parsedLink.searchParams.get('redirect_to')).toBe('http://127.0.0.1:5174/account/password')
    await memberPage.goto(recoveryLink)
    await expect(memberPage).toHaveURL('http://127.0.0.1:5174/account/password')
    await expect(memberPage.getByLabel('Kata sandi baru')).toBeVisible()
    await memberPage.getByLabel('Kata sandi baru').fill(updatedPassword)
    await memberPage.getByLabel('Konfirmasi kata sandi baru').fill(updatedPassword)
    await memberPage.getByRole('button', { name: 'Simpan kata sandi baru' }).click()
    await expect(memberPage.getByRole('status')).toHaveText('Kata sandi berhasil diperbarui.')

    await memberPage.getByRole('link', { name: 'Kembali ke aplikasi' }).click()
    const accountLink = memberPage.getByRole('link', { name: 'Akun dan kata sandi' })
    await expect(accountLink).toBeVisible()
    await accountLink.click()
    await expect(memberPage.getByLabel('Kata sandi baru')).toBeVisible()
    await memberPage.getByRole('link', { name: 'Kembali ke aplikasi' }).click()
    await memberPage.getByRole('button', { name: 'Keluar' }).click()
    await expect(memberPage).toHaveURL(/\/login$/)
    await memberPage.getByLabel('Email').fill(email)
    await memberPage.getByLabel('Kata sandi').fill(initialPassword)
    await memberPage.getByRole('button', { name: 'Masuk' }).click()
    await expect(memberPage.getByRole('alert')).toHaveText('Email atau kata sandi tidak sesuai.')
    await memberPage.getByLabel('Kata sandi').fill(updatedPassword)
    await memberPage.getByRole('button', { name: 'Masuk' }).click()
    await expect(memberPage).not.toHaveURL(/\/login$/)

    await memberPage.getByRole('link', { name: 'Akun dan kata sandi' }).click()
    await memberPage.getByLabel('Kata sandi baru').fill(finalPassword)
    await memberPage.getByLabel('Konfirmasi kata sandi baru').fill(finalPassword)
    await memberPage.getByRole('button', { name: 'Simpan kata sandi baru' }).click()
    await expect(memberPage.getByRole('status')).toHaveText('Kata sandi berhasil diperbarui.')
    await memberPage.getByRole('link', { name: 'Kembali ke aplikasi' }).click()
    await memberPage.getByRole('button', { name: 'Keluar' }).click()
    await expect(memberPage).toHaveURL(/\/login$/)
    await memberPage.getByLabel('Email').fill(email)
    await memberPage.getByLabel('Kata sandi').fill(finalPassword)
    await memberPage.getByRole('button', { name: 'Masuk' }).click()
    await expect(memberPage).not.toHaveURL(/\/login$/)

    await setInactive(adminPage, displayName)
    await memberPage.goto('/meetings')
    await memberPage.reload()
    await expect(memberPage).toHaveURL(/\/login$/)
  } finally {
    if (userCreated) {
      await adminPage.goto('/users')
      await setInactive(adminPage, displayName)
    }
    await memberContext.close()
    await adminContext.close()
  }
})

test('MOM-015: tautan kedaluwarsa tidak membuka form penggantian sandi', async ({ page }) => {
  await page.goto('/account/password#error_code=otp_expired')
  await expect(page.getByText(/Tautan pemulihan tidak valid, sudah digunakan, atau kedaluwarsa/)).toBeVisible()
  await expect(page.getByLabel('Kata sandi baru')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Minta tautan pemulihan baru' })).toBeVisible()
})

test('MOM-015: halaman pemulihan tetap dapat dipakai pada desktop, tablet, dan ponsel', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/account/recovery')
    await expect(page.getByRole('heading', { name: 'Pulihkan akses akun' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }))
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
  }
})
