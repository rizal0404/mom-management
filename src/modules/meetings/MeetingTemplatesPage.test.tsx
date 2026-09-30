import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  setDirty: vi.fn(),
  listMeetingTemplates: vi.fn(),
  saveMeetingTemplate: vi.fn(),
  deleteMeetingTemplate: vi.fn(),
  createMeetingDraftFromTemplate: vi.fn(),
}))

vi.mock('../../app/useUnsavedChanges', () => ({ useUnsavedChanges: () => ({ setDirty: mocks.setDirty }) }))
vi.mock('./meetingService', () => ({
  listMeetingTemplates: mocks.listMeetingTemplates,
  saveMeetingTemplate: mocks.saveMeetingTemplate,
  deleteMeetingTemplate: mocks.deleteMeetingTemplate,
  createMeetingDraftFromTemplate: mocks.createMeetingDraftFromTemplate,
}))

import { MeetingTemplatesPage } from './MeetingTemplatesPage'

const template = {
  id: 'template-1', owner_id: 'owner-1', name: 'Evaluasi DATA DEMO', initial_title: 'Rapat evaluasi DATA DEMO', version: 4,
  meeting_template_items: [
    { id: 'item-1', position: 1, agenda: 'Tinjau progres DATA DEMO', kind: 'NOTE' as const },
    { id: 'item-2', position: 2, agenda: 'Bahas hambatan DATA DEMO', kind: 'TASK' as const },
  ],
}

function renderPage() {
  return render(<MemoryRouter initialEntries={['/meeting-templates']}><Routes>
    <Route path="/meeting-templates" element={<MeetingTemplatesPage />} />
    <Route path="/meetings/:id" element={<NewMeetingRoute />} />
  </Routes></MemoryRouter>)
}

function NewMeetingRoute() {
  const { id } = useParams()
  return <p>Notula baru {id}</p>
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.listMeetingTemplates.mockResolvedValue([template])
  mocks.saveMeetingTemplate.mockImplementation(async (payload: { id?: string; name: string; initial_title: string | null }) => ({
    id: payload.id ?? 'template-new', owner_id: template.owner_id, name: payload.name, initial_title: payload.initial_title, version: 5,
  }))
  mocks.deleteMeetingTemplate.mockResolvedValue(undefined)
  mocks.createMeetingDraftFromTemplate.mockResolvedValue({ id: 'meeting-new' })
})
afterEach(() => vi.unstubAllGlobals())

describe('template agenda pribadi', () => {
  it('mengedit hanya struktur agenda dengan versi server dan menyediakan pembatalan perubahan', async () => {
    renderPage()
    expect(await screen.findByText('Evaluasi DATA DEMO')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const name = screen.getByLabelText('Nama template')
    fireEvent.change(name, { target: { value: 'Evaluasi bulanan DATA DEMO' } })
    expect(mocks.setDirty).toHaveBeenLastCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'Simpan template' }))

    await waitFor(() => expect(mocks.saveMeetingTemplate).toHaveBeenCalledWith({
      id: 'template-1',
      name: 'Evaluasi bulanan DATA DEMO',
      initial_title: 'Rapat evaluasi DATA DEMO',
      items: [
        { position: 1, agenda: 'Tinjau progres DATA DEMO', kind: 'NOTE' },
        { position: 2, agenda: 'Bahas hambatan DATA DEMO', kind: 'TASK' },
      ],
    }, 4))
    expect(await screen.findByText('Template tersimpan.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nama template')).toHaveValue('Evaluasi bulanan DATA DEMO')

    fireEvent.change(screen.getByLabelText('Nama template'), { target: { value: 'Perubahan belum disimpan' } })
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan perubahan' }))
    expect(screen.getByLabelText('Nama template')).toHaveValue('Evaluasi bulanan DATA DEMO')
  })

  it('membuat draf lewat RPC lalu membuka ID rapat baru', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Gunakan template' }))

    expect(await screen.findByText('Notula baru meeting-new')).toBeInTheDocument()
    expect(mocks.createMeetingDraftFromTemplate).toHaveBeenCalledWith('template-1')
  })

  it('menolak agenda kosong sebelum mengirim template ke server', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Template baru' }))
    fireEvent.change(screen.getByLabelText('Nama template'), { target: { value: 'Template DATA DEMO' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan template' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Isi agenda untuk setiap baris template.')
    expect(mocks.saveMeetingTemplate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Gunakan template' })).toBeDisabled()
  })

  it('menghapus template hanya setelah konfirmasi dan mempertahankan template saat batal', async () => {
    const confirm = vi.fn(() => false)
    vi.stubGlobal('confirm', confirm)
    renderPage()
    const deleteButton = await screen.findByRole('button', { name: 'Hapus template Evaluasi DATA DEMO' })

    fireEvent.click(deleteButton)
    expect(confirm).toHaveBeenCalledOnce()
    expect(mocks.deleteMeetingTemplate).not.toHaveBeenCalled()
    expect(screen.getByText('Evaluasi DATA DEMO')).toBeInTheDocument()

    confirm.mockReturnValue(true)
    fireEvent.click(deleteButton)
    await waitFor(() => expect(mocks.deleteMeetingTemplate).toHaveBeenCalledWith('template-1', 4))
    expect(await screen.findByText('Belum ada template agenda')).toBeInTheDocument()
  })
})
