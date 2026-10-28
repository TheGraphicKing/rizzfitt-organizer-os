import { useId, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { FilterChip } from '../../components/ui/Controls'
import { InfoTip } from '../../components/ui/InfoTip'
import { helpFor } from '../../lib/help'

/** One question in a setup step: title, plain-words help, the control. */
export function Q({ title, help, children, className, id, right, info }: { title: ReactNode; help?: ReactNode; children: ReactNode; className?: string; id?: string; right?: ReactNode; info?: string }) {
  const tip = info ?? helpFor(title)
  return (
    <section id={id} className={cn('scroll-mt-28 border-t border-line-subtle pt-7 first:border-0 first:pt-0', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 t-h3 text-fg">
            {title}
            {tip && <InfoTip text={tip} label={typeof title === 'string' ? title : undefined} />}
          </h2>
          {help && <p className="mt-1 text-fg3">{help}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export function StepTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="t-display-l text-fg">{title}</h1>
      {sub && <p className="mt-2 t-body-l text-fg2">{sub}</p>}
    </div>
  )
}

export function NumberStepper({ value, onChange, min = 0, max = 99, label, suffix, size = 'md' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; suffix?: string; size?: 'sm' | 'md' }) {
  const id = useId()
  const btn = cn('flex items-center justify-center rounded-full bg-control text-fg hover:bg-divider disabled:opacity-35', size === 'md' ? 'h-11 w-11' : 'h-9 w-9')
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-labelledby={id}>
      <span id={id} className="sr-only">
        {label}
      </span>
      <button type="button" className={btn} aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={16} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ''))
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
        }}
        className={cn('rounded-[12px] border border-transparent bg-control text-center font-bold text-fg tnum focus:border-brand focus:outline-none', size === 'md' ? 'h-11 w-16 text-[18px]' : 'h-9 w-12 text-[15px]')}
      />
      <button type="button" className={btn} aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus size={16} />
      </button>
      {suffix && <span className="text-fg3">{suffix}</span>}
    </div>
  )
}

export function ChipMulti({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <FilterChip key={o} active={value.includes(o)} onClick={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])}>
          {o}
        </FilterChip>
      ))}
    </div>
  )
}

/** Small explanatory callout. */
export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'brand' | 'warning' }) {
  return <p className={cn('rounded-[12px] px-3.5 py-2.5 t-small font-medium', tone === 'info' ? 'bg-info-soft text-info' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-brand-soft text-brand-text')}>{children}</p>
}
