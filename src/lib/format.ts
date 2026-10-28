/** Formatters. All dates and times render in IST. Copy never uses em or en dashes. */
const TZ = 'Asia/Kolkata'

/** ₹1,37,300 style Indian digit grouping. */
export function inr(amount: number, opts: { decimals?: boolean } = {}): string {
  const n = Math.round(amount * (opts.decimals ? 100 : 1)) / (opts.decimals ? 100 : 1)
  const neg = n < 0
  const [intPart, dec] = Math.abs(n).toFixed(opts.decimals ? 2 : 0).split('.')
  let out: string
  if (intPart.length <= 3) out = intPart
  else {
    const last3 = intPart.slice(-3)
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    out = `${rest},${last3}`
  }
  return `${neg ? '-' : ''}₹${out}${dec ? '.' + dec : ''}`
}

/** Plain number with Indian grouping. */
export function num(n: number): string {
  return inr(n).replace('₹', '')
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short' })
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })

/** "17 Oct 2026" */
export function fmtDate(iso: string | number | Date): string {
  return dateFmt.format(new Date(iso)).replace(/Sept/, 'Sep')
}
/** "17 Oct" */
export function fmtDayMonth(iso: string | number | Date): string {
  return dayMonthFmt.format(new Date(iso)).replace(/Sept/, 'Sep')
}
export function fmtWeekday(iso: string | number | Date): string {
  return weekdayFmt.format(new Date(iso))
}
/** "4:30 pm" */
export function fmtTime(iso: string | number | Date): string {
  return timeFmt.format(new Date(iso)).replace('AM', 'am').replace('PM', 'pm')
}
/** "17 Oct 2026, 4:30 pm" */
export function fmtDateTime(iso: string | number | Date): string {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`
}
/** "17 to 18 Oct 2026" or "17 Oct 2026" */
export function fmtRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  if (fmtDate(s) === fmtDate(e)) return fmtDate(s)
  const sameMonth = fmtDate(s).split(' ').slice(1).join(' ') === fmtDate(e).split(' ').slice(1).join(' ')
  if (sameMonth) return `${s.toLocaleString('en-GB', { timeZone: TZ, day: 'numeric' })} to ${fmtDate(e)}`
  return `${fmtDayMonth(s)} to ${fmtDate(e)}`
}

/** "+91 90000 10001" */
export function fmtPhone(mobile: string): string {
  const d = mobile.replace(/\D/g, '').slice(-10)
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
}
/** "+91 90000 1xx01" style mask for lists */
export function maskPhone(mobile: string): string {
  const d = mobile.replace(/\D/g, '').slice(-10)
  return `+91 ${d.slice(0, 5)} ${d.slice(5, 6)}xx${d.slice(8)}`
}
export function maskEmail(email: string): string {
  const [u, dom] = email.split('@')
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(2, u.length - 2))}@${dom}`
}

export function plural(n: number, one: string, many?: string): string {
  return `${num(n)} ${n === 1 ? one : (many ?? one + 's')}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function minutesBetween(a: string | number | Date, b: string | number | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000)
}

/** Relative "5 min ago" style, against the demo clock. */
export function ago(iso: string, now: number): string {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  return fmtDayMonth(iso)
}
