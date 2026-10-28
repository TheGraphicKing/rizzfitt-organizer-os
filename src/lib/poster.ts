import { token } from '../components/3d/palette'
import type { EventItem } from '../mock/types'
import { fmtRange } from './format'
import { PUBLIC_HOST, BRAND_NAME } from './brand'

export type PosterTemplate = 'open' | 'schedule' | 'finals' | 'champions'
export const POSTER_HEADLINE: Record<PosterTemplate, string> = {
  open: 'Registrations open',
  schedule: 'Schedule is out',
  finals: 'Finals day',
  champions: 'Champions',
}
export const POSTER_SIZES = {
  post: { label: 'Instagram post', w: 1080, h: 1350 },
  story: { label: 'Story', w: 1080, h: 1920 },
  status: { label: 'WhatsApp status', w: 1080, h: 1920 },
  a4: { label: 'A4', w: 1240, h: 1754 },
} as const

/** 2D poster drawn on a canvas. Used by the share sheet and as the poster studio fallback. */
export function drawPoster(ev: EventItem, opts: { template?: PosterTemplate; headline?: string; sub?: string; w?: number; h?: number; bg?: HTMLCanvasElement | null } = {}): string {
  const w = opts.w ?? 1080
  const h = opts.h ?? 1350
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')!
  const family = getComputedStyle(document.body).fontFamily
  const accent = ev.accent
  x.fillStyle = token('--bg-canvas')
  x.fillRect(0, 0, w, h)
  if (opts.bg) x.drawImage(opts.bg, 0, 0, w, h * 0.62)
  else {
    const g = x.createRadialGradient(w * 0.7, h * 0.15, 20, w * 0.7, h * 0.15, w)
    g.addColorStop(0, accent + 'aa')
    g.addColorStop(1, 'transparent')
    x.fillStyle = g
    x.fillRect(0, 0, w, h)
    x.save()
    x.translate(w * 0.62, h * 0.32)
    x.rotate(-0.5)
    x.strokeStyle = accent
    x.lineWidth = 8
    x.fillStyle = token('--court-surface')
    x.fillRect(-180, -380, 360, 760)
    x.strokeRect(-180, -380, 360, 760)
    x.fillStyle = token('--court-kitchen')
    x.fillRect(-180, -110, 360, 220)
    x.strokeRect(-180, -110, 360, 220)
    x.beginPath()
    x.moveTo(0, -380)
    x.lineTo(0, -110)
    x.moveTo(0, 110)
    x.lineTo(0, 380)
    x.stroke()
    x.strokeStyle = token('--court-line')
    x.lineWidth = 10
    x.beginPath()
    x.moveTo(-210, 0)
    x.lineTo(210, 0)
    x.stroke()
    x.restore()
  }
  const fade = x.createLinearGradient(0, h * 0.4, 0, h)
  fade.addColorStop(0, 'transparent')
  fade.addColorStop(0.5, token('--bg-canvas'))
  x.fillStyle = fade
  x.fillRect(0, 0, w, h)
  const pad = w * 0.08
  x.fillStyle = accent
  x.font = `700 ${w * 0.04}px ${family}`
  x.fillText((opts.headline ?? POSTER_HEADLINE[opts.template ?? 'open']).toUpperCase(), pad, h * 0.66)
  x.fillStyle = token('--text-primary')
  x.font = `700 ${w * 0.1}px ${family}`
  const words = ev.name.split(' ')
  const lines: string[] = []
  let cur = ''
  words.forEach((wd) => {
    const t = cur ? cur + ' ' + wd : wd
    if (x.measureText(t).width > w - pad * 2) {
      lines.push(cur)
      cur = wd
    } else cur = t
  })
  lines.push(cur)
  lines.slice(0, 3).forEach((l, i) => x.fillText(l, pad, h * 0.66 + w * 0.11 * (i + 1)))
  const y = h * 0.66 + w * 0.11 * Math.min(3, lines.length) + w * 0.08
  x.fillStyle = token('--text-secondary')
  x.font = `500 ${w * 0.035}px ${family}`
  x.fillText(opts.sub ?? `${fmtRange(ev.startDate, ev.endDate)} · ${ev.venue.name || ev.venue.city}`, pad, y)
  x.fillStyle = accent
  x.fillRect(pad, h - pad - w * 0.09, w - pad * 2, w * 0.09)
  x.fillStyle = token('--on-brand')
  x.font = `700 ${w * 0.034}px ${family}`
  x.fillText(`${PUBLIC_HOST}${ev.slug}`, pad + w * 0.03, h - pad - w * 0.03)
  x.fillStyle = token('--text-tertiary')
  x.font = `600 ${w * 0.024}px ${family}`
  x.fillText(`Powered by ${BRAND_NAME}`, pad, pad)
  return c.toDataURL('image/png')
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
