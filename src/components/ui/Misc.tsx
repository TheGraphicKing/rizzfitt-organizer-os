import { useMemo, useState, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, ChevronLeft, ChevronRight, Copy, FileSpreadsheet, Mail, MessageCircle, Phone, Upload } from 'lucide-react'
import { cn } from '../../lib/cn'
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_WHATSAPP } from '../../lib/brand'
import { MARK_PATHS, MARK_VIEWBOX, WORDMARK_PATHS } from '../../lib/logoPaths'
import { toast, Drawer } from './Overlay'
import { Button } from './Button'
import { fakeDelay } from '../../store/store'
import { LiveBadge } from './Controls'

/* ------------------------------------------------------------------- logo */

/**
 * Official lockup placed from the master SVG paths (never retyped). Approved colourways only:
 * primary = orange mark + white wordmark (dark grounds), white = all white (orange or blue grounds),
 * ink = orange mark + ink wordmark (light grounds). Minimum width 120 px for the lockup, 20 px for the mark.
 */
export function Logo({ size = 'md', className, tone = 'primary', markOnly }: { size?: 'sm' | 'md' | 'lg'; className?: string; tone?: 'primary' | 'white' | 'ink'; markOnly?: boolean; mono?: boolean }) {
  const h = size === 'sm' ? 24 : size === 'md' ? 28 : 40
  const mark = tone === 'white' ? 'var(--text-primary)' : 'var(--brand)'
  const word = tone === 'ink' ? 'var(--ink)' : 'var(--text-primary)'
  if (markOnly)
    return (
      <svg viewBox={MARK_VIEWBOX} height={Math.max(20, h)} className={className} role="img" aria-label={BRAND_NAME}>
        <g fill={mark} dangerouslySetInnerHTML={{ __html: MARK_PATHS }} />
      </svg>
    )
  return (
    <svg viewBox="0 0 172 34" height={h} width={(h * 172) / 34} className={cn('shrink-0', className)} role="img" aria-label={BRAND_NAME}>
      <g fill={mark} dangerouslySetInnerHTML={{ __html: MARK_PATHS }} />
      <g fill={word} transform="translate(37.532 0)" dangerouslySetInnerHTML={{ __html: WORDMARK_PATHS }} />
    </svg>
  )
}

/* -------------------------------------------------------------------- QR */

export function QR({ value, size = 140, className, label }: { value: string; size?: number; className?: string; label?: string }) {
  return (
    <figure className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="rounded-[12px] bg-fg p-2.5">
        <QRCodeSVG value={value} size={size} bgColor="transparent" fgColor="var(--ink)" level="M" aria-label={label ?? `QR code for ${value}`} role="img" />
      </div>
      {label && <figcaption className="t-small text-fg3">{label}</figcaption>}
    </figure>
  )
}

/* --------------------------------------------------------------- copy link */

export function CopyButton({ text, label = 'Copy link', className, variant = 'secondary', size = 'md' }: { text: string; label?: string; className?: string; variant?: 'secondary' | 'ghost' | 'primary'; size?: 'sm' | 'md' }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      icon={done ? <Check size={16} className="text-success" aria-hidden /> : <Copy size={16} aria-hidden />}
      onClick={async () => {
        try {
          await navigator.clipboard?.writeText(text)
        } catch {
          /* clipboard blocked in some browsers: still confirm */
        }
        setDone(true)
        toast.success('Link copied')
        setTimeout(() => setDone(false), 1200)
      }}
    >
      {done ? 'Copied' : label}
    </Button>
  )
}

/* ---------------------------------------------------------------- scorebug */

export function ScoreBug({
  a,
  b,
  games,
  current,
  server,
  live,
  title,
  className,
  compact,
}: {
  a: string
  b: string
  games: { a: number; b: number }
  current?: { a: number; b: number }
  server?: 'A' | 'B'
  live?: boolean
  title?: string
  className?: string
  compact?: boolean
}) {
  const row = (name: string, g: number, p: number | undefined, serving: boolean) => (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', serving ? 'bg-brand' : 'bg-transparent')} aria-label={serving ? 'Serving' : undefined} />
      <span className={cn('min-w-0 flex-1 truncate font-semibold text-fg', compact ? 'text-[13px]' : 'text-[14px]')}>{name}</span>
      <span className="w-5 text-center text-[13px] font-semibold text-fg3 tnum">{g}</span>
      {p !== undefined && <span className={cn('w-8 rounded-[6px] bg-s3 text-center font-bold text-fg tnum', compact ? 'text-[14px]' : 'text-[16px]')}>{p}</span>}
    </div>
  )
  return (
    <div className={cn('rounded-[12px] border border-line bg-s2 px-3 py-2', className)}>
      {(title || live) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {title && <span className="truncate t-small text-fg3">{title}</span>}
          {live && <LiveBadge />}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {row(a, games.a, current?.a, server === 'A')}
        {row(b, games.b, current?.b, server === 'B')}
      </div>
    </div>
  )
}

/* ------------------------------------------------------- date range picker */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function DateRangePicker({ start, end, onChange, label = 'Dates' }: { start: string; end: string; onChange: (s: string, e: string) => void; label?: string }) {
  const s = new Date(start)
  const [view, setView] = useState({ y: s.getFullYear(), m: s.getMonth() })
  const [picking, setPicking] = useState<'start' | 'end'>('start')
  const days = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const offset = (first.getDay() + 6) % 7
    const count = new Date(view.y, view.m + 1, 0).getDate()
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.y, view.m, i + 1))]
  }, [view])
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const sk = start.slice(0, 10)
  const ek = end.slice(0, 10)
  const pick = (d: Date) => {
    const k = key(d)
    if (picking === 'start') {
      onChange(k, k)
      setPicking('end')
    } else {
      if (k < sk) onChange(k, sk)
      else onChange(sk, k)
      setPicking('start')
    }
  }
  return (
    <div className="rounded-[16px] border border-line bg-s2 p-3" role="group" aria-label={label}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-s2" onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}>
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-fg" aria-live="polite">
          {MONTHS[view.m]} {view.y}
        </span>
        <button type="button" aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-s2" onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="t-overline text-fg4" aria-hidden>
            {d}
          </span>
        ))}
        {days.map((d, i) => {
          if (!d) return <span key={i} />
          const k = key(d)
          const inRange = k >= sk && k <= ek
          const edge = k === sk || k === ek
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(d)}
              aria-pressed={inRange}
              aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}`}
              className={cn('h-10 rounded-md text-[14px] font-semibold tnum transition-colors', edge ? 'bg-brand text-on-brand' : inRange ? 'bg-brand-soft text-fg' : 'text-fg2 hover:bg-s2')}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <p className="mt-2 t-small text-fg3">{picking === 'start' ? 'Pick the first day' : 'Pick the last day (or the same day for a one-day event)'}</p>
    </div>
  )
}

/* ------------------------------------------------------------ file dropzone */

export function FileDropzone({ label, hint, samples, onPick, accept = '.xlsx, .csv' }: { label: string; hint: string; samples: string[]; onPick: (name: string) => void; accept?: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const pick = async (name: string) => {
    setBusy(name)
    await fakeDelay()
    setBusy(null)
    onPick(name)
  }
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f) pick(f.name)
      }}
      className={cn('flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors', drag ? 'border-brand bg-brand-soft' : 'border-line')}
    >
      <Upload size={28} className="text-fg3" aria-hidden />
      <p className="font-semibold text-fg">{label}</p>
      <p className="t-small text-fg3">{hint}</p>
      <label className="cursor-pointer">
        <span className="inline-flex h-11 items-center rounded-pill bg-control px-4 font-semibold text-fg hover:bg-divider">Choose a file</span>
        <input type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0].name)} />
      </label>
      {samples.length > 0 && (
        <div className="mt-1 flex w-full flex-col gap-2">
          <p className="t-overline text-fg4">Or use a sample file</p>
          {samples.map((s) => (
            <Button key={s} variant="ghost" size="sm" loading={busy === s} icon={<FileSpreadsheet size={16} />} onClick={() => pick(s)}>
              {s}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ contact sheet */

export function ContactSheet({ open, onClose, context }: { open: boolean; onClose: () => void; context?: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <Drawer open={open} onClose={onClose} title="Have Rizzfitt set this up" subtitle={context ?? 'Our team can do it for you, usually the same day.'}>
      <div className="flex flex-col gap-3">
        <a href={`https://wa.me/${CONTACT_WHATSAPP.replace(/\D/g, '')}`} onClick={(e) => { e.preventDefault(); toast.info('Opening WhatsApp is simulated in this prototype') }} className="card flex items-center gap-4 p-4 hover:bg-s2">
          <MessageCircle className="text-success" aria-hidden />
          <span>
            <span className="block font-semibold text-fg">WhatsApp us</span>
            <span className="t-small text-fg3">{CONTACT_WHATSAPP}</span>
          </span>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} onClick={(e) => { e.preventDefault(); toast.info('Email is simulated in this prototype') }} className="card flex items-center gap-4 p-4 hover:bg-s2">
          <Mail className="text-info" aria-hidden />
          <span>
            <span className="block font-semibold text-fg">Email</span>
            <span className="t-small text-fg3">{CONTACT_EMAIL}</span>
          </span>
        </a>
        <Button
          variant="secondary"
          size="lg"
          loading={busy}
          icon={<Phone size={18} />}
          onClick={async () => {
            setBusy(true)
            await fakeDelay()
            setBusy(false)
            onClose()
            toast.success('Call back requested', { body: 'Someone from Rizzfitt will call you within a working day.' })
          }}
        >
          Request a call back
        </Button>
      </div>
    </Drawer>
  )
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-[260px] -translate-x-1/2 rounded-[8px] border border-line bg-s2 px-2.5 py-1.5 text-[12px] font-medium text-fg shadow-float group-hover/tt:block group-focus-within/tt:block">
        {text}
      </span>
    </span>
  )
}

/** Download a generated text file (CSV etc.). */
export function downloadText(filename: string, text: string, mime = 'text/csv') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}
