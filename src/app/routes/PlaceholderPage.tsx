import { Link } from 'react-router'
import { ArrowRight, Construction } from 'lucide-react'

type PlaceholderPageProps = {
  eyebrow: string
  title: string
  description: string
  nextTask: string
  standalone?: boolean
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  nextTask,
  standalone = false,
}: PlaceholderPageProps) {
  const content = (
    <section className="placeholder-page" aria-labelledby="placeholder-title">
      <div className="placeholder-page__icon" aria-hidden="true">
        <Construction size={26} strokeWidth={1.8} />
      </div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="placeholder-title">{title}</h2>
      <p className="placeholder-page__description">{description}</p>
      <div className="placeholder-page__status">
        <span className="status-dot" aria-hidden="true" />
        MOM-001 scaffold aktif
      </div>
      <p className="placeholder-page__next">Task berikutnya: <strong>{nextTask}</strong></p>
      {!standalone && (
        <Link className="button button--primary" to="/">
          Kembali ke dashboard
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      )}
    </section>
  )

  if (standalone) {
    return <div className="standalone-page">{content}</div>
  }

  return content
}
