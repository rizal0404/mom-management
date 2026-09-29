import { useEffect, useState } from 'react'
import { ArrowRight, CalendarClock, CheckCircle2, CircleAlert, ClipboardList, ListTodo } from 'lucide-react'
import { Link } from 'react-router'

import { getDashboardData, type DashboardData } from './dashboardService'

const formatDate = (date: string | null) => date
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Makassar' }).format(new Date(date))
  : 'Tanggal belum diisi'

const actionStatusLabel: Record<string, string> = {
  OPEN: 'Belum mulai', IN_PROGRESS: 'Dikerjakan', BLOCKED: 'Terhambat', DONE: 'Selesai', CANCELLED: 'Dibatalkan',
}

type SummaryCardProps = {
  icon: typeof ListTodo
  label: string
  value: string
  detail: string
  tone: 'primary' | 'danger' | 'warning' | 'success'
  to: string
}

function SummaryCard({ icon: Icon, label, value, detail, tone, to }: SummaryCardProps) {
  return <Link className={`summary-card summary-card--${tone}`} to={to}>
    <span className="summary-card__icon" aria-hidden="true"><Icon size={21} strokeWidth={2} /></span>
    <span className="summary-card__content"><span className="summary-card__label">{label}</span><strong>{value}</strong><small>{detail}</small></span>
    <ArrowRight className="summary-card__arrow" aria-hidden="true" size={18} />
  </Link>
}

function DashboardSkeleton() {
  return <section className="dashboard-page" aria-busy="true" aria-label="Memuat dashboard">
    <div className="dashboard-hero dashboard-skeleton"><span /><span /><span /></div>
    <div className="summary-grid">{Array.from({ length: 4 }, (_, index) => <div className="summary-card dashboard-skeleton" key={index}><span /><span /></div>)}</div>
    <div className="dashboard-columns"><div className="dashboard-panel dashboard-skeleton" /><div className="dashboard-panel dashboard-skeleton" /></div>
  </section>
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true); setError(null)
    void getDashboardData().then(setData).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }
  useEffect(() => {
    let active = true
    void getDashboardData().then((nextData) => { if (active) setData(nextData) }).catch((reason: Error) => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error || !data) return <section className="empty-state dashboard-error" role="alert"><CircleAlert size={28} aria-hidden="true" /><h2>Ringkasan kerja</h2><p>Dashboard tidak dapat dimuat. {error ?? 'Coba lagi untuk memuat ringkasan terbaru.'}</p><button className="button button--primary" type="button" onClick={load}>Coba lagi</button></section>

  const { metrics } = data
  return <section className="dashboard-page" aria-labelledby="dashboard-title">
    <header className="dashboard-hero">
      <div><p className="eyebrow">Ruang kerja</p><h2 id="dashboard-title">Ringkasan kerja</h2><p>Prioritaskan tindak lanjut dan notula yang perlu perhatian hari ini.</p></div>
      <Link className="button button--primary dashboard-hero__action" to="/meetings/new"><ClipboardList size={18} aria-hidden="true" /> Buat rapat</Link>
    </header>

    <div className="summary-grid" aria-label="Ringkasan tindak lanjut">
      <SummaryCard icon={ListTodo} label="Tindak lanjut aktif" value={String(metrics.active)} detail="Open, dikerjakan, atau terhambat" tone="primary" to="/actions?active=true" />
      <SummaryCard icon={CircleAlert} label="Terlambat" value={String(metrics.overdue)} detail="Deadline sebelum hari ini (WITA)" tone="danger" to="/actions?active=true&overdue=true" />
      <SummaryCard icon={CalendarClock} label="Deadline dekat" value={String(metrics.dueSoon)} detail="Hari ini sampai 7 hari ke depan" tone="warning" to={`/actions?active=true&from=${data.today}&to=${data.dueSoonEnd}`} />
      <SummaryCard icon={CheckCircle2} label="Penyelesaian" value={metrics.completionPercentage === null ? '—' : `${metrics.completionPercentage}%`} detail={metrics.completionPercentage === null ? 'Belum ada tindak lanjut' : 'Selesai dari semua kecuali dibatalkan'} tone="success" to="/actions?status=DONE" />
    </div>

    <div className="dashboard-columns">
      <section className="dashboard-panel" aria-labelledby="urgent-actions-title">
        <div className="dashboard-panel__heading"><div><p className="eyebrow">Perlu perhatian</p><h3 id="urgent-actions-title">Tindak lanjut aktif</h3></div><Link className="text-link" to="/actions?active=true">Lihat tracker <ArrowRight size={15} aria-hidden="true" /></Link></div>
        {data.urgentActions.length === 0 ? <div className="dashboard-panel__empty"><ListTodo aria-hidden="true" size={24} /><p>Belum ada tindak lanjut aktif.</p><Link className="text-link" to="/meetings/new">Buat notula baru</Link></div> : <ul className="dashboard-list">{data.urgentActions.map((action) => <li key={action.id}><Link to={`/actions/${action.id}`}><span className={`kind-dot kind-dot--${action.kind.toLowerCase()}`} aria-hidden="true" /><span className="dashboard-list__copy"><strong>{action.title}</strong><small>{action.pic_name} · Deadline {formatDate(action.due_date)}</small></span><span className={`status-badge status-badge--${action.status.toLowerCase()}`}>{actionStatusLabel[action.status]}</span></Link></li>)}</ul>}
      </section>
      <section className="dashboard-panel" aria-labelledby="recent-meetings-title">
        <div className="dashboard-panel__heading"><div><p className="eyebrow">Notula</p><h3 id="recent-meetings-title">Rapat terbaru</h3></div><Link className="text-link" to="/meetings">Lihat semua <ArrowRight size={15} aria-hidden="true" /></Link></div>
        {data.recentMeetings.length === 0 ? <div className="dashboard-panel__empty"><ClipboardList aria-hidden="true" size={24} /><p>Belum ada notula yang dapat diakses.</p><Link className="text-link" to="/meetings/new">Buat rapat</Link></div> : <ul className="dashboard-list dashboard-list--meetings">{data.recentMeetings.map((meeting) => <li key={meeting.id}><Link to={`/meetings/${meeting.id}`}><span className="meeting-date" aria-hidden="true"><strong>{meeting.starts_at ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', timeZone: 'Asia/Makassar' }).format(new Date(meeting.starts_at)) : '—'}</strong><small>{meeting.starts_at ? new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Makassar' }).format(new Date(meeting.starts_at)) : ''}</small></span><span className="dashboard-list__copy"><strong>{meeting.title}</strong><small>{formatDate(meeting.starts_at)}</small></span><span className={`meeting-status meeting-status--${meeting.status.toLowerCase()}`}>{meeting.status === 'FINAL' ? 'Final' : 'Draf'}</span></Link></li>)}</ul>}
      </section>
    </div>
  </section>
}
