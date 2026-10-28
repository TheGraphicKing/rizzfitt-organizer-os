import type { ReactNode } from 'react'
import { Circle, Crown, Shield, Star, Zap, Volleyball } from 'lucide-react'
import type { EventItem } from '../../mock/types'
import { SAMPLE_LOGOS } from '../../mock/constants'
import { cn } from '../../lib/cn'
import { initials } from '../../lib/format'
import { helpFor } from '../../lib/help'
import { InfoTip } from '../../components/ui/InfoTip'

const GLYPH = { circle: Circle, shield: Shield, paddle: Volleyball, star: Star, crown: Crown, bolt: Zap }

/** Event logo: one of the sample logos picked in setup, or initials on the accent. */
export function EventGlyph({ ev, size = 40, className }: { ev: Pick<EventItem, 'logo' | 'name' | 'accent'>; size?: number; className?: string }) {
  const logo = ev.logo !== null && ev.logo !== undefined ? SAMPLE_LOGOS[ev.logo] : null
  if (logo) {
    const Icon = GLYPH[logo.glyph]
    return (
      <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-[30%]', className)} style={{ width: size, height: size, background: logo.color, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
        <Icon size={size * 0.5} strokeWidth={2.4} style={{ color: 'rgba(10,10,10,0.85)' }} fill="rgba(10,10,10,0.15)" />
      </span>
    )
  }
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-[30%] font-bold', className)} style={{ width: size, height: size, background: ev.accent, color: 'var(--event-accent-on)', fontSize: size * 0.36 }}>
      {initials(ev.name)}
    </span>
  )
}

/** Page header pattern: H1, one-line subtitle, primary action on the right. */
export function PageHeader({ title, subtitle, actions, className, overline, info }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string; overline?: ReactNode; info?: string }) {
  const tip = info ?? helpFor(title)
  return (
    <div className={cn('mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {overline && <div className="mb-1 t-overline text-brand-text">{overline}</div>}
        <h1 className="flex items-center gap-2 t-h1 text-fg">
          {title}
          {tip && <InfoTip text={tip} label={typeof title === 'string' ? title : undefined} />}
        </h1>
        {subtitle && <p className="mt-1 text-fg2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
