import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { useAuth } from './AuthProvider'
import * as accountPasswordService from './accountPasswordService'
import { PasswordRecoveryRequestPage, PasswordUpdatePage } from './AccountSecurityPages'

vi.mock('./AuthProvider', () => ({ useAuth: vi.fn() }))

const authenticated = {
  status: 'authenticated' as const,
  user: null,
  profile: { id: 'member-id', display_name: 'Anggota DATA DEMO', role: 'MEMBER' as const, is_active: true },
  message: null,
  login: vi.fn(),
  logout: vi.fn(),
}

function renderWithRouter(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('account security pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue(authenticated)
    vi.spyOn(accountPasswordService, 'requestPasswordRecovery').mockResolvedValue(undefined)
    vi.spyOn(accountPasswordService, 'updateAccountPassword').mockResolvedValue(undefined)
  })

  it('shows the same generic success message after requesting recovery', async () => {
    renderWithRouter(<PasswordRecoveryRequestPage />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim instruksi pemulihan' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Jika akun terdaftar, instruksi pemulihan akan dikirim')
    expect(accountPasswordService.requestPasswordRecovery).toHaveBeenCalledWith('member@example.test')
    expect(screen.queryByText(/member@example\.test/)).not.toBeInTheDocument()
  })

  it('shows a clear delivery error without echoing the submitted address', async () => {
    vi.mocked(accountPasswordService.requestPasswordRecovery).mockRejectedValue(new Error('Permintaan pemulihan tidak dapat diproses sekarang. Coba lagi nanti.'))
    renderWithRouter(<PasswordRecoveryRequestPage />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim instruksi pemulihan' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Permintaan pemulihan tidak dapat diproses sekarang')
    expect(screen.queryByText(/member@example\.test/)).not.toBeInTheDocument()
  })

  it('explains expired or used links and does not expose a password form without a session', () => {
    vi.mocked(useAuth).mockReturnValue({ ...authenticated, status: 'anonymous', profile: null })
    renderWithRouter(<PasswordUpdatePage />)

    expect(screen.getByText(/Tautan pemulihan tidak valid, sudah digunakan, atau kedaluwarsa/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Minta tautan pemulihan baru' })).toHaveAttribute('href', '/account/recovery')
    expect(screen.queryByLabelText('Kata sandi baru')).not.toBeInTheDocument()
  })

  it('validates both password fields before calling Auth and confirms a successful update', async () => {
    renderWithRouter(<PasswordUpdatePage />)
    fireEvent.change(screen.getByLabelText('Kata sandi baru'), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText('Konfirmasi kata sandi baru'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan kata sandi baru' }))
    expect(screen.getByRole('alert')).toHaveTextContent('minimal 8 karakter')
    expect(accountPasswordService.updateAccountPassword).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Kata sandi baru'), { target: { value: 'NewPassword123!' } })
    fireEvent.change(screen.getByLabelText('Konfirmasi kata sandi baru'), { target: { value: 'NewPassword123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan kata sandi baru' }))

    await waitFor(() => expect(accountPasswordService.updateAccountPassword).toHaveBeenCalledWith('NewPassword123!'))
    expect(await screen.findByRole('status')).toHaveTextContent('Kata sandi berhasil diperbarui.')
    expect(screen.getByLabelText('Kata sandi baru')).toHaveValue('')
    expect(screen.getByLabelText('Konfirmasi kata sandi baru')).toHaveValue('')
  })
})
