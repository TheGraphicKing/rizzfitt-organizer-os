import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { InfoTip } from './InfoTip'
import { helpFor } from '../../lib/help'

export function Card({ className, children, as: As = 'div', ...rest }: HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' | 'article' }) {
  return (
    <As className={cn('card', !/(^|\s)p-\d/.test(className ?? '') && 'p-4 sm:p-5', className)} {...rest}>
      {children}
    </As>
  )
}

export function CardHeader({ title, subtitle, action, className, icon, info }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string; icon?: ReactNode; info?: string }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 t-h3 text-fg">
            {title}
            {(info ?? helpFor(title)) && <InfoTip text={(info ?? helpFor(title))!} label={typeof title === 'string' ? title : undefined} />}
          </h3>
          {subtitle && <p className="mt-0.5 t-small text-fg3 font-normal">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/** Clickable card (formerly tilted). Brand: flat card, hairline border brightens on hover, no tilt or sheen. */
export function TiltCard({ className, children, onClick, as = 'div', ...rest }: HTMLAttributes<HTMLDivElement> & { max?: number; as?: 'div' | 'button' }) {
  const Comp = as as 'div'
  return (
    <Comp onClick={onClick} className={cn('card group relative overflow-hidden transition-colors duration-150 hover:border-line-strong', !/(^|\s)p-\d/.test(className ?? '') && 'p-4', className)} {...rest}>
      {children}
    </Comp>
  )
}
