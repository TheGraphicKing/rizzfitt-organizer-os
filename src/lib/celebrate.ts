import confetti from 'canvas-confetti'
import { token } from '../components/3d/palette'

/** DOM confetti in brand and categorical colours. Skipped under reduced motion. */
export function celebrate(opts: { y?: number; count?: number } = {}) {
  const reduced = document.documentElement.dataset.reducedMotion === 'true'
  if (reduced) return
  confetti({
    particleCount: opts.count ?? 140,
    spread: 80,
    origin: { y: opts.y ?? 0.6 },
    disableForReducedMotion: true,
    colors: ['--brand', '--cat-2', '--cat-3', '--cat-6', '--cat-5'].map(token),
  })
}
