import { useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin } from 'lucide-react'
import type { EventCategory, EventItem } from '../../mock/types'
import { useData } from '../../store/hooks'
import { categoriesOf } from '../../store/selectors'
import { MODULE_META } from '../../lib/modules'
import { MODULE_ICON } from '../workspace/WorkspaceLayout'
import { EventGlyph } from '../workspace/shared'
import { accentVars } from '../../lib/color'
import { fmtRange, inr } from '../../lib/format'
import { Segmented } from '../../components/ui/Controls'
import { useReducedMotion } from '../../theme/motion'
import { GROUND_PRESETS, SPORT_META } from '../../mock/constants'
import { cn } from '../../lib/cn'

type Tab = 'app' | 'page' | 'tv'

/** Cover art for the microsite hero, CSS only (Court, Neon, Clay). */
export function CoverThumb({ style, accent, name, className, tall, fill }: { style: EventItem['coverStyle']; accent: string; name: string; className?: string; tall?: boolean; fill?: boolean }) {
  const bg =
    style === 'neon'
      ? `radial-gradient(80% 90% at 70% 10%, ${accent}55, transparent 60%), linear-gradient(160deg, var(--bg-canvas), var(--surface-2))`
      : style === 'clay'
        ? `radial-gradient(70% 70% at 30% 20%, ${accent}66, transparent 70%), linear-gradient(160deg, var(--surface-3), var(--surface-1))`
        : `linear-gradient(180deg, transparent 40%, var(--bg-canvas)), linear-gradient(160deg, var(--court-surface), var(--court-apron))`
  return (
    <div className={cn('overflow-hidden', fill ? 'absolute inset-0' : cn('relative', tall ? 'h-40' : 'h-20'), className)} style={{ background: bg }} aria-hidden>
      {style === 'court' && (
        <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full opacity-70" preserveAspectRatio="none">
          <rect x="20" y="8" width="60" height="44" fill="none" stroke={accent} strokeWidth="1" />
          <line x1="50" y1="8" x2="50" y2="52" stroke="var(--court-line)" strokeWidth="1.4" />
          <line x1="40" y1="8" x2="40" y2="52" stroke={accent} strokeWidth="0.6" />
          <line x1="60" y1="8" x2="60" y2="52" stroke={accent} strokeWidth="0.6" />
        </svg>
      )}
      {style === 'neon' && <div className="absolute inset-x-6 bottom-3 h-[2px] rounded-full" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />}
      {style === 'clay' && <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full" style={{ background: accent, boxShadow: 'inset -6px -8px 14px rgba(0,0,0,0.35), inset 4px 4px 10px rgba(255,255,255,0.3)' }} />}
      {tall && <p className="absolute bottom-3 left-3 right-3 truncate text-[18px] font-bold text-fg">{name}</p>}
    </div>
  )
}

function Pulse({ k, children, className }: { k: string; children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div key={k} className={className} initial={reduced ? false : { boxShadow: '0 0 0 2px var(--event-accent)' }} animate={{ boxShadow: '0 0 0 0px transparent' }} transition={{ duration: 0.9 }}>
      {children}
    </motion.div>
  )
}

function AppPreview({ ev, cats }: { ev: EventItem; cats: EventCategory[] }) {
  return (
    <div className="flex h-full bg-base text-[11px]">
      <div className="w-[42%] shrink-0 border-r border-line-subtle bg-canvas p-2">
        <Pulse k={ev.name + ev.accent + ev.logo} className="mb-2 flex items-center gap-1.5 rounded-md bg-s1 p-1.5">
          <EventGlyph ev={ev} size={20} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-fg">{ev.name || 'Your event'}</span>
            <span className="flex items-center gap-1 text-[9px] text-fg3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Draft
            </span>
          </span>
        </Pulse>
        <Pulse k={ev.modules.join()} className="rounded-md">
          {ev.modules.map((m) => {
            const Icon = MODULE_ICON[m]
            return (
              <div key={m} className={cn('flex items-center gap-1.5 rounded-sm px-1.5 py-1', m === 'home' ? 'bg-s2 text-fg' : 'text-fg3')}>
                <Icon size={11} aria-hidden />
                <span className="truncate">{MODULE_META[m].label}</span>
              </div>
            )
          })}
        </Pulse>
      </div>
      <div className="flex-1 p-2.5">
        <p className="text-[12px] font-bold text-fg">{ev.name || 'Your event'} is almost ready</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {['Entries', 'Players', 'Collected', 'Spots left'].map((l, i) => (
            <div key={l} className="rounded-md bg-s1 p-1.5">
              <p className="text-[8px] uppercase tracking-wider text-fg4">{l}</p>
              <p className="text-[14px] font-bold text-fg tnum">{i === 3 ? cats.reduce((s, c) => s + c.cap, 0) : 0}</p>
            </div>
          ))}
        </div>
        <Pulse k={cats.map((c) => c.id).join()} className="mt-2 rounded-md bg-s1 p-1.5">
          {cats.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="truncate text-fg2">{c.label}</span>
            </div>
          ))}
        </Pulse>
      </div>
    </div>
  )
}

export function PagePreview({ ev, cats }: { ev: EventItem; cats: EventCategory[] }) {
  return (
    <div className="h-full overflow-hidden text-[11px]" style={{ background: 'var(--event-ground)' }}>
      <Pulse k={ev.coverStyle + ev.accent + ev.name}>
        <CoverThumb style={ev.coverStyle} accent={ev.accent} name={ev.name || 'Your event'} tall />
      </Pulse>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-fg3">
          <CalendarDays size={11} aria-hidden /> {fmtRange(ev.startDate, ev.endDate)}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-fg3">
          <MapPin size={11} aria-hidden /> <span className="truncate">{ev.venue.name || 'Venue'}</span>
        </div>
        <span className="mt-2 inline-block rounded-pill bg-accent-soft px-2 py-0.5 text-[9px] font-bold text-accent">REGISTRATIONS OPEN SOON</span>
        <Pulse k={cats.map((c) => c.price + c.label).join() + (ev.social?.pricePerPerson ?? '')} className="mt-2 rounded-md">
          {ev.type === 'social' ? (
            <div className="rounded-md bg-s1 p-2">
              <p className="font-semibold text-fg">Entry</p>
              <p className="text-fg3">{inr(ev.social?.pricePerPerson ?? 0)} per person</p>
            </div>
          ) : (
            cats.slice(0, 4).map((c) => (
              <div key={c.id} className="mb-1.5 flex items-center justify-between rounded-md bg-s1 p-2">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-fg">{c.label}</span>
                  <span className="text-[9px] text-fg3">{c.cap} spots</span>
                </span>
                <span className="font-bold text-fg tnum">{inr(c.price)}</span>
              </div>
            ))
          )}
        </Pulse>
        <div className="mt-2 rounded-md bg-accent py-2 text-center font-bold text-on-accent">Register</div>
      </div>
    </div>
  )
}

function TvPreview({ ev }: { ev: EventItem }) {
  const t = ev.settings.tv
  return (
    <div className="flex h-full flex-col bg-canvas text-fg">
      {t.template === 'arena' && <div className="h-3 w-full bg-accent" />}
      <div className={cn('m-2 flex flex-1 items-center justify-around rounded-md', t.template === 'glass' && 'border border-line-strong bg-s2/50')}>
        <div className="text-center">
          <p className="text-[9px] text-fg3">Team A</p>
          <p className="text-[36px] font-bold leading-none tnum">6</p>
        </div>
        <span className="text-[10px] text-fg4">{SPORT_META[ev.sport].courtWordOne} 1</span>
        <div className="text-center">
          <p className="text-[9px] text-fg3">Team B</p>
          <p className="text-[36px] font-bold leading-none text-accent tnum">4</p>
        </div>
      </div>
      {t.showSponsors && <div className="h-4 w-full bg-s2 text-center text-[8px] leading-4 text-fg3">Sponsors</div>}
    </div>
  )
}

/** S4: the organizer's app and public page as real DOM in a phone or laptop, tilted toward the pointer. */
export function LivePreview({ ev, className }: { ev: EventItem; className?: string }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const [tab, setTab] = useState<Tab>('page')
  const [device, setDevice] = useState<'phone' | 'laptop'>('phone')
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: -8, y: 10 })
  const tvOn = ev.settings.tv.enabled && ev.type !== 'social'
  const cur: Tab = tab === 'tv' && !tvOn ? 'page' : tab
  const content = cur === 'app' ? <AppPreview ev={ev} cats={cats} /> : cur === 'page' ? <PagePreview ev={ev} cats={cats} /> : <TvPreview ev={ev} />
  return (
    <div className={cn('flex flex-col items-center gap-5', className)} style={accentVars(ev.accent, ev.ground) as React.CSSProperties}>
      <div className="flex flex-wrap justify-center gap-2">
        <Segmented<Tab>
          label="Preview"
          size="sm"
          value={cur}
          onChange={setTab}
          options={[{ value: 'app', label: 'Your app' }, { value: 'page', label: 'Event page' }, ...(tvOn ? [{ value: 'tv' as Tab, label: 'Court TV' }] : [])]}
        />
        {cur !== 'tv' && <Segmented label="Device" size="sm" value={device} onChange={setDevice} options={[{ value: 'phone', label: 'Phone' }, { value: 'laptop', label: 'Laptop' }]} />}
      </div>
      <div
        ref={ref}
        className="flex w-full flex-1 items-center justify-center"
        style={{ perspective: 1200 }}
        onPointerMove={(e) => {
          if (reduced) return
          const r = ref.current!.getBoundingClientRect()
          setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -14, y: ((e.clientX - r.left) / r.width - 0.5) * 18 })
        }}
        onPointerLeave={() => setTilt({ x: -8, y: 10 })}
        aria-label={`Live preview: ${cur === 'app' ? 'your app' : cur === 'page' ? 'event page' : 'court TV'}`}
        role="img"
      >
        <div
          className="transition-transform duration-300 ease-standard"
          style={{ transform: reduced ? 'none' : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: 'preserve-3d' }}
        >
          {cur === 'tv' ? (
            <div className="w-[340px] overflow-hidden rounded-md border-[6px] border-s3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),0_0_60px_-10px_var(--event-accent-glow)]" style={{ aspectRatio: '16/9' }}>
              {content}
            </div>
          ) : device === 'phone' ? (
            <div className="relative h-[480px] w-[236px] overflow-hidden rounded-[34px] border-[7px] border-s3 bg-canvas shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),0_0_60px_-10px_var(--event-accent-glow)]">
              <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-s3" />
              <div className="h-full overflow-hidden pt-6">{content}</div>
            </div>
          ) : (
            <div>
              <div className="h-[230px] w-[380px] overflow-hidden rounded-t-lg border-[6px] border-b-0 border-s3 bg-canvas shadow-[0_0_60px_-10px_var(--event-accent-glow)]">{content}</div>
              <div className="mx-auto h-3 w-[420px] -translate-x-[20px] rounded-b-lg bg-s3" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Page ground choice (Court Black or Charcoal). Orange stays the action colour. */
export function GroundPicker({ value, onChange }: { value: 'black' | 'charcoal'; onChange: (v: 'black' | 'charcoal') => void }) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Page ground">
      {GROUND_PRESETS.map((g) => (
        <button key={g.value} type="button" role="radio" aria-checked={value === g.value} onClick={() => onChange(g.value)} className={cn('flex items-center gap-3 rounded-[12px] border p-3 text-left', value === g.value ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong')}>
          <span className="h-10 w-10 shrink-0 rounded-[8px] border border-line" style={{ background: g.hex }} aria-hidden />
          <span>
            <span className="block t-title text-fg">{g.name}</span>
            <span className="t-small text-fg3">{g.line}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
