import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { InfoTip } from './InfoTip'
import { helpFor } from '../../lib/help'

/* ------------------------------------------------------------------ toggle */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  className,
  hideLabel,
  info,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  id?: string
  className?: string
  hideLabel?: boolean
  info?: string
}) {
  const auto = useId()
  const iid = id ?? auto
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className={cn('flex flex-col gap-0.5', hideLabel && 'sr-only')}>
        <span className="flex items-center gap-1.5">
          <label htmlFor={iid} className="t-title text-fg">
            {label}
          </label>
          {(info ?? helpFor(label)) && <InfoTip text={(info ?? helpFor(label))!} label={typeof label === 'string' ? label : undefined} />}
        </span>
        {description && <span className="t-small text-fg3">{description}</span>}
      </div>
      <button
        id={iid}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-pill transition-colors duration-150 disabled:opacity-40',
          checked ? 'bg-brand' : 'bg-control',
        )}
      >
        <motion.span layout transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }} className={cn('block h-[24px] w-[24px] rounded-full bg-fg shadow', checked ? 'ml-[25px]' : 'ml-[3px]')} />
      </button>
    </div>
  )
}

/* ---------------------------------------------------------------- checkbox */

export function Checkbox({ checked, onChange, label, description, disabled, className, indeterminate, info }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean; className?: string; indeterminate?: boolean; info?: string }) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 disabled:opacity-40',
          checked || indeterminate ? 'border-brand bg-brand text-on-brand' : 'border-divider bg-control hover:border-fg3',
        )}
      >
        {indeterminate ? <span className="h-[2px] w-2.5 rounded bg-fg" /> : checked && <Check size={15} strokeWidth={3} aria-hidden />}
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <label htmlFor={id} className="cursor-pointer text-fg">
            {label}
          </label>
          {(info ?? helpFor(label)) && <InfoTip text={(info ?? helpFor(label))!} label={typeof label === 'string' ? label : undefined} />}
        </span>
        {description && <span className="t-small text-fg3">{description}</span>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- radio */

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; description?: ReactNode; disabled?: boolean }[]
  label: string
  className?: string
}) {
  const name = useId()
  return (
    <fieldset className={cn('flex flex-col gap-2', className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <label key={o.value} className={cn('flex cursor-pointer items-start gap-3 rounded-[12px] border px-4 py-3 transition-colors', value === o.value ? 'border-brand bg-brand-soft' : 'border-line bg-s2 hover:border-line-strong', o.disabled && 'opacity-40')}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} className="peer sr-only" />
          <span className={cn('mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:shadow-[var(--focus-ring)]', value === o.value ? 'border-brand' : 'border-divider')}>
            {value === o.value && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-fg">{o.label}</span>
            {o.description && <span className="t-small text-fg3 font-normal">{o.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

/* ------------------------------------------------------- segmented control */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
  block,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; disabled?: boolean }[]
  label: string
  size?: 'sm' | 'md'
  className?: string
  block?: boolean
}) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={label} className={cn('relative inline-flex rounded-[12px] bg-control p-1', block && 'flex w-full', className)}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const i = options.findIndex((x) => x.value === value)
              if (e.key === 'ArrowRight') onChange(options[(i + 1) % options.length].value)
              if (e.key === 'ArrowLeft') onChange(options[(i - 1 + options.length) % options.length].value)
            }}
            className={cn(
              'relative z-10 flex-1 whitespace-nowrap rounded-[9px] px-3 font-semibold transition-colors duration-150 disabled:opacity-40',
              size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-[14px]',
              active ? 'text-on-brand' : 'text-fg2 hover:text-fg',
            )}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 -z-10 rounded-[9px] bg-brand" transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- tabs */

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
  label = 'Sections',
}: {
  value: T
  onChange: (v: T) => void
  tabs: { value: T; label: ReactNode; count?: number; hidden?: boolean }[]
  className?: string
  label?: string
}) {
  const id = useId()
  const visible = tabs.filter((t) => !t.hidden)
  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line-subtle', className)}>
      {visible.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              const i = visible.findIndex((x) => x.value === value)
              if (e.key === 'ArrowRight') onChange(visible[(i + 1) % visible.length].value)
              if (e.key === 'ArrowLeft') onChange(visible[(i - 1 + visible.length) % visible.length].value)
            }}
            className={cn('relative flex h-11 shrink-0 items-center gap-2 px-3 text-[14px] font-semibold transition-colors', active ? 'text-fg' : 'text-fg3 hover:text-fg2')}
          >
            {t.label}
            {t.count !== undefined && <span className={cn('rounded-pill px-1.5 py-0.5 text-[12px] tnum', active ? 'bg-brand-soft text-brand-text' : 'bg-s2 text-fg3')}>{t.count}</span>}
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-brand" transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }} />}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------- chips */

export function FilterChip({ active, onClick, children, count, color, className, disabled }: { active: boolean; onClick: () => void; children: ReactNode; count?: number; color?: string; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-pill border px-3.5 text-[13px] font-normal transition-colors duration-150 disabled:opacity-40',
        active ? 'border-brand bg-brand-soft text-fg' : 'border-transparent bg-s2 text-fg2 hover:text-fg',
        className,
      )}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />}
      {children}
      {count !== undefined && <span className="tnum text-fg3">{count}</span>}
    </button>
  )
}

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'live' | 'hq'
const toneCls: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-s3 text-fg2',
  brand: 'bg-brand-soft text-brand-text',
  live: 'bg-danger-soft text-live',
  hq: 'bg-hq-soft text-hq-text',
}

/** Status chip: always an icon or a word, never colour alone. */
export function StatusChip({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-semibold whitespace-nowrap', toneCls[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

export function CategoryChip({ color, children, className }: { color: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 max-w-full items-center gap-2 rounded-[6px] bg-s2 px-2 text-[12px] font-semibold text-fg2', className)}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  )
}

export function LiveBadge({ label = 'LIVE', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-pill border border-live-solid bg-danger-soft px-2 py-0.5 text-[11px] font-bold tracking-[0.5px] text-live', className)}>
      <span className="animate-live h-1.5 w-1.5 rounded-full bg-live-solid" aria-hidden />
      {label}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[6px] bg-control px-1.5 py-0.5 text-[12px] font-semibold text-fg2">{children}</kbd>
}
