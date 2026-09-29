const witaFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Makassar',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export function formatWitaDateTimeInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = Object.fromEntries(witaFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function parseWitaDateTimeInput(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Waktu rapat tidak valid.')
  const date = new Date(`${value}:00+08:00`)
  if (Number.isNaN(date.getTime()) || formatWitaDateTimeInput(date.toISOString()) !== value) {
    throw new Error('Waktu rapat tidak valid.')
  }
  return date.toISOString()
}

export function formatWitaTimestamp(value: string): string {
  return `${new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar',
  }).format(new Date(value))} WITA`
}
