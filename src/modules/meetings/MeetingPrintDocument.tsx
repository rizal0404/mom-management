import { Printer } from 'lucide-react'
import type { ActiveProfile, MeetingDraft } from './meetingService'
import { formatWitaTimestamp, parseWitaDateTimeInput } from '../../lib/witaDateTime'

type Participant = MeetingDraft['participants'][number]
type Item = MeetingDraft['items'][number]

type MeetingPrintDocumentProps = {
  title: string
  startsAt: string
  chairName: string
  locationOrLink: string
  people: Participant[]
  items: Item[]
  profiles: ActiveProfile[]
  status: 'DRAFT' | 'FINAL'
  dirty?: boolean
}

const itemKindLabels: Record<Item['kind'], string> = {
  NOTE: 'Catatan',
  DECISION: 'Keputusan',
  TASK: 'Task',
  PENDING_MATTER: 'Pending matter',
}

function formatMeetingTime(value: string) {
  if (!value) return 'Waktu belum dicantumkan'
  try {
    return formatWitaTimestamp(parseWitaDateTimeInput(value))
  } catch {
    return 'Waktu belum dicantumkan'
  }
}

function formatSchedule(start: string | null | undefined, due: string | null | undefined) {
  if (!start || !due) return 'Jadwal belum tersedia'
  const format = (value: string) => new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
  if (start === due) return format(start)
  return `${format(start)} – ${format(due)}`
}

export function PrintMeetingButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <button className="button button--quiet meeting-print-button" type="button" onClick={onClick} disabled={disabled}>
    <Printer size={16} aria-hidden="true" /> Cetak / Simpan PDF
  </button>
}

export function MeetingPrintDocument(props: MeetingPrintDocumentProps) {
  const attendees = props.people.filter((entry) => entry.display_name_snapshot.trim())
  const items = props.items.map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.position ?? a.index + 1) - (b.entry.position ?? b.index + 1))
    .map(({ entry }) => entry)
    .filter((entry) => entry.agenda.trim())

  return <article className="meeting-print-document" data-dirty={props.dirty ? 'true' : 'false'} aria-label="Pratinjau cetak notula">
    <div className="meeting-print-document__blocked">
      <p className="meeting-print-document__eyebrow">MOM Task Management</p>
      <h1>Perubahan belum disimpan</h1>
      <p>Simpan draf atau batalkan perubahan sebelum mencetak. Isi yang belum disimpan tidak akan dicetak.</p>
    </div>
    <div className="meeting-print-document__content">
      <header className="meeting-print-document__header">
        <p className="meeting-print-document__eyebrow">Notula Rapat</p>
        <div className="meeting-print-document__title-row">
          <h1>{props.title || 'Notula tanpa judul'}</h1>
          {props.status === 'DRAFT' && <span className="meeting-print-document__draft">DRAF</span>}
        </div>
        <dl className="meeting-print-document__metadata">
          <div><dt>Waktu rapat</dt><dd>{formatMeetingTime(props.startsAt)}</dd></div>
          <div><dt>Pimpinan rapat</dt><dd>{props.chairName || 'Belum dicantumkan'}</dd></div>
          <div><dt>Lokasi atau tautan</dt><dd>{props.locationOrLink || 'Belum dicantumkan'}</dd></div>
        </dl>
      </header>

      <section className="meeting-print-document__section" aria-labelledby="meeting-print-participants">
        <h2 id="meeting-print-participants">Peserta rapat</h2>
        {attendees.length
          ? <ul className="meeting-print-document__participants">{attendees.map((entry, index) => <li key={entry.id ?? `${entry.display_name_snapshot}-${index}`}>{entry.display_name_snapshot}</li>)}</ul>
          : <p className="meeting-print-document__muted">Belum ada peserta yang dicatat.</p>}
      </section>

      <section className="meeting-print-document__section" aria-labelledby="meeting-print-agenda">
        <h2 id="meeting-print-agenda">Agenda, pembahasan, dan hasil rapat</h2>
        {items.length ? <ol className="meeting-print-document__agenda">{items.map((entry, index) => {
          const isActionable = entry.kind === 'TASK' || entry.kind === 'PENDING_MATTER'
          const picName = props.profiles.find((profile) => profile.id === entry.draft_pic_id)?.display_name
          return <li className="meeting-print-document__agenda-item" key={entry.id ?? index}>
            <header><span>{String(index + 1).padStart(2, '0')}</span><h3>{entry.agenda}</h3><span className="meeting-print-document__kind">{itemKindLabels[entry.kind]}</span></header>
            <section><h4>Pembahasan</h4><p>{entry.discussion?.trim() || 'Tidak ada pembahasan yang dicatat.'}</p></section>
            <section><h4>Hasil rapat</h4><p>{entry.result?.trim() || 'Tidak ada hasil yang dicatat.'}</p></section>
            {isActionable && <dl className="meeting-print-document__agreement">
              <div><dt>PIC kesepakatan</dt><dd>{picName || 'PIC tidak tersedia'}</dd></div>
              <div><dt>Jadwal kesepakatan</dt><dd>{formatSchedule(entry.draft_start_date, entry.draft_due_date)}</dd></div>
            </dl>}
          </li>
        })}</ol> : <p className="meeting-print-document__muted">Belum ada agenda tersimpan.</p>}
      </section>
      <footer className="meeting-print-document__footer">Dokumen ini dicetak dari data notula yang tersimpan di MOM Task Management.</footer>
    </div>
  </article>
}
