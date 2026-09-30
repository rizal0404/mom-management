export function getWitaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function millisecondsUntilNextWitaDay(now = new Date()) {
  const nextWitaMidnight = new Date(`${addDays(getWitaDate(now), 1)}T00:00:00+08:00`).getTime()
  return Math.max(0, nextWitaMidnight - now.getTime())
}
