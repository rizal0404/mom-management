import { Link } from 'react-router'
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Home, Info, ListChecks, MapPin, UserRound, Users } from 'lucide-react'
import { EvidencePanel } from '../evidence/EvidencePanel'
import type { ActiveProfile, MeetingDraft } from './meetingService'
import { MeetingPrintDocument, PrintMeetingButton } from './MeetingPrintDocument'

type Participant = MeetingDraft['participants'][number]
type Item = MeetingDraft['items'][number]

type Props = {
  id?: string
  title: string
  startsAt: string
  chairName: string
  locationOrLink: string
  people: Participant[]
  items: Item[]
  profiles: ActiveProfile[]
  canUploadEvidence: boolean
  onPrint: () => void
}

const itemKindLabels: Record<Item['kind'], string> = {
  NOTE: 'Catatan',
  DECISION: 'Keputusan',
  TASK: 'Task',
  PENDING_MATTER: 'Pending matter',
}

const formatMeetingDate = (date: string) => new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`))

const formatShortMeetingDate = (date: string) => new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`))

function formatMeetingSchedule(start: string | null, due: string | null) {
  if (!start || !due) return 'Jadwal belum tersedia'
  if (start === due) return formatShortMeetingDate(start)
  return `${formatShortMeetingDate(start)} – ${formatShortMeetingDate(due)}`
}

function participantInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('id-ID')
}

export function FinalMeetingView({ id, title, startsAt, chairName, locationOrLink, people, items, profiles, canUploadEvidence, onPrint }: Props) {
  const [meetingDate, meetingTime] = startsAt.split('T')
  const timeLabel = meetingTime?.slice(0, 5).replace(':', '.')
  const attendees = people.filter((entry) => entry.display_name_snapshot.trim())

  return <section className="meeting-detail meeting-detail--final" aria-labelledby="meeting-detail-title">
    <MeetingPrintDocument title={title} startsAt={startsAt} chairName={chairName} locationOrLink={locationOrLink} people={people} items={items} profiles={profiles} status="FINAL" />
    <nav className="meeting-detail__breadcrumb" aria-label="Breadcrumb">
      <Link to="/meetings"><Home size={15} aria-hidden="true" /><span>Notula Rapat</span></Link>
      <ChevronRight size={14} aria-hidden="true" />
      <span aria-current="page">Detail Notula</span>
    </nav>

    <header className="meeting-detail__hero">
      <div>
        <div className="meeting-detail__title-row">
          <h2 id="meeting-detail-title">{title}</h2>
          <span className="meeting-detail__final-badge"><CheckCircle2 size={16} aria-hidden="true" /> Final</span>
        </div>
        <p>Dokumentasi pembahasan dan hasil rapat.</p>
      </div>
      <PrintMeetingButton onClick={onPrint} />
    </header>

    <section className="meeting-detail__summary" aria-label="Ringkasan rapat">
      <div className="meeting-detail__summary-item">
        <CalendarDays aria-hidden="true" />
        <div><span>Waktu Rapat</span><strong>{meetingDate ? formatMeetingDate(meetingDate) : 'Waktu belum dicantumkan'}</strong><p>{timeLabel ? `${timeLabel} WITA` : 'Jam belum dicantumkan'}</p></div>
      </div>
      <div className="meeting-detail__summary-item">
        <UserRound aria-hidden="true" />
        <div><span>Pimpinan Rapat</span><strong>{chairName || 'Belum dicantumkan'}</strong></div>
      </div>
      <div className="meeting-detail__summary-item">
        <MapPin aria-hidden="true" />
        <div><span>Lokasi</span><strong>{locationOrLink || 'Belum dicantumkan'}</strong></div>
      </div>
    </section>

    <section className="meeting-detail__participants editor-card" aria-labelledby="meeting-participants-title">
      <div className="meeting-detail__section-heading">
        <div className="meeting-detail__section-title"><Users size={20} aria-hidden="true" /><h3 id="meeting-participants-title">Peserta Rapat</h3></div>
        <span className="meeting-detail__count">{attendees.length} peserta</span>
      </div>
      {attendees.length ? <ul className="meeting-detail__participant-list">{attendees.map((entry, index) => <li key={entry.id ?? `${entry.display_name_snapshot}-${index}`}><span className={`meeting-detail__avatar meeting-detail__avatar--${index % 4}`} aria-hidden="true">{participantInitials(entry.display_name_snapshot)}</span><span>{entry.display_name_snapshot}</span></li>)}</ul> : <p className="meeting-detail__empty">Belum ada peserta yang dicatat.</p>}
    </section>

    <section className="meeting-detail__agenda editor-card" aria-labelledby="meeting-agenda-title">
      <div className="meeting-detail__section-heading meeting-detail__section-heading--stacked">
        <div className="meeting-detail__section-title"><ListChecks size={21} aria-hidden="true" /><h3 id="meeting-agenda-title">Agenda &amp; Hasil Rapat</h3></div>
        <p>{items.length} agenda pembahasan</p>
      </div>
      <div className="meeting-detail__agenda-list">{items.map((entry, index) => {
        const isActionable = entry.kind === 'TASK' || entry.kind === 'PENDING_MATTER'
        const picName = profiles.find((profile) => profile.id === entry.draft_pic_id)?.display_name
        return <article className="meeting-agenda-card" key={entry.id ?? index}>
          <div className="meeting-agenda-card__main">
            <span className="meeting-agenda-card__number">{String(index + 1).padStart(2, '0')}</span>
            <div className="meeting-agenda-card__body">
              <div className="meeting-agenda-card__title"><h4>{entry.agenda}</h4><span className={`meeting-agenda-card__kind meeting-agenda-card__kind--${entry.kind.toLowerCase()}`}>{itemKindLabels[entry.kind]}</span></div>
              <div className="meeting-agenda-card__content">
                <section><h5>Pembahasan</h5><p>{entry.discussion?.trim() || 'Tidak ada pembahasan yang dicatat.'}</p></section>
                <section><h5>Hasil Rapat</h5><p>{entry.result?.trim() || 'Tidak ada hasil yang dicatat.'}</p></section>
              </div>
            </div>
          </div>
          {isActionable && <div className="meeting-agenda-card__schedule">
            <span><UserRound size={17} aria-hidden="true" /><span>PIC: {picName || 'Belum tersedia'}</span></span>
            <span><CalendarDays size={17} aria-hidden="true" /><span>Jadwal: {formatMeetingSchedule(entry.draft_start_date ?? null, entry.draft_due_date ?? null)}</span></span>
          </div>}
        </article>
      })}</div>
    </section>

    <EvidencePanel key={id} kind="meetings" targetId={id} canUpload={canUploadEvidence} title="Lampiran & Evidence" description="Dokumen pendukung rapat beserta nama pengunggah dan waktu unggah." className="meeting-detail__evidence" />

    <aside className="meeting-detail__notice">
      <span className="meeting-detail__notice-icon"><Info size={18} aria-hidden="true" /></span>
      <p>Notula final bersifat tetap. Status dan riwayat tindak lanjut dapat dilihat pada modul Tindak Lanjut.</p>
      <Link to={id ? `/actions?meeting=${id}` : '/actions'}>Buka Tindak Lanjut <ArrowRight size={16} aria-hidden="true" /></Link>
    </aside>
  </section>
}
