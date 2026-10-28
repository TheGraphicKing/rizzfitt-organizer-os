import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { SpotIcon } from '../../ui/Display'

/** Crafted 2D fallback used when WebGL is off, unavailable or the scene errors. */
export function Fallback3D({ icon, children, className, glow = 'var(--brand-glow)' }: { icon?: LucideIcon; children?: ReactNode; className?: string; glow?: string }) {
  return (
    <div aria-hidden className={cn('relative flex h-full w-full items-center justify-center overflow-hidden', className)} style={{ background: `radial-gradient(60% 60% at 50% 45%, ${glow} 0%, transparent 70%)` }}>
      <div className="bg-courtlines absolute inset-0 opacity-70" />
      {children ?? (icon ? <SpotIcon icon={icon} size={96} /> : null)}
    </div>
  )
}
