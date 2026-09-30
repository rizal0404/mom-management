import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MeetingPrintDocument, PrintMeetingButton } from './MeetingPrintDocument'

const props = {
  title: 'Rapat DATA DEMO',
  startsAt: '2026-09-22T09:00',
  chairName: 'Pimpinan DATA DEMO',
  locationOrLink: 'Ruang DATA DEMO',
  people: [{ display_name_snapshot: 'Anggota DATA DEMO' }],
  items: [{ position: 2, agenda: 'Agenda kedua', discussion: 'Pembahasan', result: 'Hasil', kind: 'TASK' as const, draft_pic_id: 'pic', draft_start_date: '2026-09-23', draft_due_date: '2026-09-24' }, { position: 1, agenda: 'Agenda pertama', discussion: null, result: null, kind: 'DECISION' as const }],
  profiles: [{ id: 'pic', display_name: 'PIC DATA DEMO' }],
  status: 'DRAFT' as const,
}

describe('dokumen cetak notula', () => {
  it('menyajikan metadata, peserta, urutan agenda tersimpan, dan kesepakatan tindak lanjut', () => {
    const { container } = render(<MeetingPrintDocument {...props} />)

    expect(screen.getByRole('heading', { name: 'Rapat DATA DEMO' })).toBeInTheDocument()
    expect(screen.getByText('DRAF')).toBeInTheDocument()
    expect(screen.getByText('Anggota DATA DEMO')).toBeInTheDocument()
    expect(screen.getByText('PIC DATA DEMO')).toBeInTheDocument()
    const agenda = [...container.querySelectorAll('.meeting-print-document__agenda-item h3')].map((heading) => heading.textContent)
    expect(agenda).toEqual(['Agenda pertama', 'Agenda kedua'])
    expect(screen.getByText('Jadwal kesepakatan')).toBeInTheDocument()
  })

  it('menampilkan halaman pengarah alih-alih isi cetak saat draf kotor', () => {
    render(<MeetingPrintDocument {...props} dirty />)

    expect(screen.getByRole('heading', { name: 'Perubahan belum disimpan' })).toBeInTheDocument()
    expect(screen.getByText('Rapat DATA DEMO')).toBeInTheDocument()
    expect(document.querySelector('.meeting-print-document[data-dirty="true"]')).toBeInTheDocument()
  })

  it('mencetak rapat tanpa tindak lanjut dan tidak memberi label DRAF pada FINAL', () => {
    const { container } = render(<MeetingPrintDocument {...props} status="FINAL" items={[props.items[1]]} />)

    expect(screen.queryByText('DRAF')).not.toBeInTheDocument()
    expect(screen.getByText('Agenda pertama')).toBeInTheDocument()
    expect(container.querySelector('.meeting-print-document__agreement')).not.toBeInTheDocument()
  })

  it('meneruskan aksi Cetak / Simpan PDF ke handler halaman', () => {
    const onClick = vi.fn()
    render(<PrintMeetingButton onClick={onClick} />)

    screen.getByRole('button', { name: 'Cetak / Simpan PDF' }).click()
    expect(onClick).toHaveBeenCalledOnce()
  })
})
