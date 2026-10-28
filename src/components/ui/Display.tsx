import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { initials, num } from '../../lib/format'
import { useReducedMotion } from '../../theme/motion'
import { CONTACT_WHATSAPP } from '../../lib/brand'

/* ---------------------------------------------------------------- count up */

export function useCountUp(target: number, ms = 600): number {
  const reduced = useReducedMotion()
  const [v, setV] = useState(reduced ? target : 0)
  const from = useRef(0)
  useEffect(() => {
    if (reduced) {
      setV(target)
      return
    }
    const start = performance.now()
    const f = from.current
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(f + (target - f) * e))
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, reduced])
  return v
}

export function Sparkline({ values, className, color = 'var(--brand)' }: { values: number[]; className?: string; color?: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 120
  const h = 32
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / max) * (h - 4) - 2])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-8 w-[120px]', className)} aria-hidden preserveAspectRatio="none">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Stat tile: overline label, big tabular number, sub-line, optional sparkline. */
export function StatTile({
  label,
  value,
  format = num,
  sub,
  spark,
  icon,
  className,
  tone,
}: {
  label: string
  value: number
  format?: (n: number) => string
  sub?: ReactNode
  spark?: number[]
  icon?: ReactNode
  className?: string
  tone?: 'brand' | 'default'
}) {
  const v = useCountUp(value)
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="t-overline text-fg3">{label}</span>
        {icon}
      </div>
      <div className={cn('t-display-m tnum', tone === 'brand' ? 'text-brand-text' : 'text-fg')} aria-label={`${label}: ${format(value)}`}>
        {format(v)}
      </div>
      <div className="flex items-end justify-between gap-2">
        {sub && <span className="t-small text-fg3">{sub}</span>}
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  )
}

/* -------------------------------------------------------- avatar and crest */

export function Avatar({ name, color, size = 36, className }: { name: string; color?: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-on-brand', className)}
      style={{ width: size, height: size, background: color ?? 'var(--surface-3)', fontSize: size * 0.38, color: color ? 'var(--on-brand)' : 'var(--text-secondary)' }}
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({ names, colors }: { names: string[]; colors?: string[] }) {
  return (
    <span className="flex -space-x-2">
      {names.slice(0, 3).map((n, i) => (
        <Avatar key={i} name={n} color={colors?.[i]} size={30} className="ring-2 ring-[var(--surface-1)]" />
      ))}
    </span>
  )
}

/** Team crest: rounded shield with team initials. */
export function TeamCrest({ name, color, size = 40, short }: { name: string; color: string; size?: number; short?: string }) {
  const label = short ?? initials(name)
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size * 1.12 }} aria-hidden>
      <svg viewBox="0 0 40 45" className="absolute inset-0 h-full w-full">
        <path d="M20 1.5 L37 7 V21 C37 32 29.5 39.5 20 43.5 C10.5 39.5 3 32 3 21 V7 Z" fill={color} />
        <path d="M20 1.5 L37 7 V21 C37 32 29.5 39.5 20 43.5" fill="rgba(0,0,0,0.18)" />
      </svg>
      <span className="relative font-bold tracking-tight" style={{ fontSize: size * 0.3, color: 'var(--on-brand)' }}>
        {label.slice(0, 3)}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------- spot icons */

/**
 * Icon well (brand component): a #2B2B2B circle holding an orange outline icon. Never an orange well.
 * Wells stay small (36 to 56 px) so empty states and cards read calm.
 */
export function SpotIcon({ icon: Icon, size = 40, color = 'var(--brand)', className }: { icon: LucideIcon; size?: number; color?: string; float?: boolean; className?: string }) {
  const s = Math.min(56, Math.max(36, size))
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-control', className)} style={{ width: s, height: s }} aria-hidden>
      <Icon size={Math.round(s * 0.46)} strokeWidth={2} style={{ color }} />
    </span>
  )
}

/* ------------------------------------------------------------- empty state */

export function EmptyState({
  icon,
  title,
  help,
  action,
  className,
  compact,
  onTalk,
}: {
  icon: LucideIcon
  title: string
  help: string
  action?: ReactNode
  className?: string
  compact?: boolean
  onTalk?: () => void
}) {
  return (
    <div className={cn('bg-courtlines flex flex-col items-center justify-center rounded-lg px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      <SpotIcon icon={icon} size={compact ? 56 : 80} />
      <h3 className="mt-5 t-h3 text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-fg2">{help}</p>
      {action && <div className="mt-5">{action}</div>}
      <button type="button" onClick={onTalk} className="mt-4 t-small text-fg3 underline-offset-4 hover:text-fg2 hover:underline">
        Want us to set this up? Talk to Rizzfitt
        <span className="sr-only"> on WhatsApp {CONTACT_WHATSAPP}</span>
      </button>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

/* -------------------------------------------------------- choice card */

export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  media,
  disabled,
  disabledReason,
  className,
  layout = 'stack',
  badge,
}: {
  selected: boolean
  onSelect: () => void
  title: ReactNode
  description?: ReactNode
  media?: ReactNode
  disabled?: boolean
  disabledReason?: string
  className?: string
  layout?: 'stack' | 'row'
  badge?: ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      whileTap={reduced || disabled ? undefined : { scale: 0.98 }}
      className={cn(
        'group relative flex w-full rounded-[16px] border p-4 text-left transition-[border-color,background] duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        layout === 'stack' ? 'flex-col items-start gap-3' : 'items-center gap-4',
        selected ? 'border-brand bg-brand-soft' : 'border-line bg-s2 hover:border-line-strong',
        className,
      )}
    >
      {media}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="t-title text-fg">{title}</span>
        {description && <span className="t-small font-normal text-fg3">{disabled && disabledReason ? disabledReason : description}</span>}
      </span>
      {badge && <span className="absolute left-3 top-3">{badge}</span>}
      <motion.span
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-on-brand"
        aria-hidden
      >
        <Check size={14} strokeWidth={3} />
      </motion.span>
    </motion.button>
  )
}

/* ---------------------------------------------------------------- stepper */

/** Wizard stepper (brand "Steps"): 6 px dots, the active step is a 28 px orange bar. */
export function Stepper({ steps, current, onJump, maxReached }: { steps: string[]; current: number; onJump?: (i: number) => void; maxReached: number }) {
  return (
    <nav aria-label="Setup progress" className="w-full">
      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={cn('h-1.5 rounded-pill transition-[width,background] duration-250', i === current ? 'w-7 bg-brand' : i < current ? 'w-1.5 bg-fg2' : 'w-1.5 bg-divider')} />
        ))}
      </div>
      <ol className="mt-2 hidden grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-1 md:grid" style={{ ['--n' as string]: steps.length }}>
        {steps.map((s, i) => (
          <li key={s} className="text-center">
            <button
              type="button"
              disabled={!onJump || i > maxReached}
              onClick={() => onJump?.(i)}
              aria-current={i === current ? 'step' : undefined}
              className={cn('inline-flex items-center gap-1 rounded px-1 text-[12px] font-semibold transition-colors disabled:cursor-default', i === current ? 'text-fg' : i < current ? 'text-fg2 hover:text-fg' : 'text-fg4')}
            >
              {i < current && <Check size={12} strokeWidth={3} className="text-success" aria-hidden />}
              {s}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-1 text-center t-small text-fg3 md:hidden">
        Step {current + 1} of {steps.length}: <span className="text-fg">{steps[current]}</span>
      </p>
    </nav>
  )
}

/* -------------------------------------------------------------- progress */

export function ProgressBar({ value, max, className, color = 'var(--brand)', markers }: { value: number; max: number; className?: string; color?: string; markers?: number[] }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-s3', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-standard" style={{ width: `${pct}%`, background: color }} />
      {markers?.map((m) => (
        <span key={m} className="absolute top-0 h-full w-[2px] bg-fg/50" style={{ left: `${(m / max) * 100}%` }} />
      ))}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line-subtle', className)} />
}

export function SectionTitle({ overline, title, sub, action, className }: { overline?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {overline && <p className="t-overline text-brand-text">{overline}</p>}
        <h2 className="t-h2 text-fg">{title}</h2>
        {sub && <p className="mt-1 text-fg2">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
