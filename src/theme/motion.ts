import { useEffect, useState } from 'react'
import { useUi } from '../store/store'

export const DUR = { micro: 0.12, small: 0.2, medium: 0.32, large: 0.48 }
export const EASE = {
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  emphasized: [0.3, 0, 0, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
}
export const SPRING = {
  ui: { type: 'spring' as const, stiffness: 380, damping: 30 },
  playful: { type: 'spring' as const, stiffness: 260, damping: 18 },
}

function useOsReducedMotion(): boolean {
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setV(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return v
}

/** OS preference, overridden by the Prototype switcher. */
export function useReducedMotion(): boolean {
  const os = useOsReducedMotion()
  const override = useUi((s) => s.reducedMotion)
  return override ?? os
}
