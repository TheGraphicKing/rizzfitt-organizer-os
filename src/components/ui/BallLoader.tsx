import { cn } from '../../lib/cn'

/** S16: bouncing pickleball loader. CSS only. */
export function BallLoader({ size = 14, tone = 'ball', label = 'Loading', className }: { size?: number; tone?: 'ball' | 'dark'; label?: string; className?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex flex-col items-center', className)}>
      <span
        className="ball-dot block rounded-full"
        style={{
          width: size,
          height: size,
          background: tone === 'ball' ? 'var(--ball)' : 'var(--text-primary)',
          backgroundImage:
            tone === 'ball'
              ? 'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.25) 1.2px, transparent 1.6px), radial-gradient(circle at 70% 55%, rgba(0,0,0,0.25) 1.2px, transparent 1.6px), radial-gradient(circle at 40% 75%, rgba(0,0,0,0.25) 1.2px, transparent 1.6px)'
              : undefined,
        }}
      />
      <span className="mt-[2px] block h-[2px] rounded-full opacity-40" style={{ width: size * 0.8, background: tone === 'ball' ? 'var(--ball)' : 'var(--text-primary)' }} />
    </span>
  )
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <BallLoader size={22} label={label} />
    </div>
  )
}
