export function getCurrentWeekStart() {
  const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }) + 'T00:00:00Z')
  const mondayOffset = (today.getUTCDay() + 6) % 7
  today.setUTCDate(today.getUTCDate() - mondayOffset)
  return today.toISOString().slice(0, 10)
}
