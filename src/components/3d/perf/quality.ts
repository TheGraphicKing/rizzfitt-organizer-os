import { useMemo } from 'react'
import { useUi } from '../../../store/store'
import { useReducedMotion } from '../../../theme/motion'

export type Tier = 'high' | 'medium' | 'low' | 'off'

let detected: Tier | null = null
let webgl: boolean | null = null

export function hasWebGL(): boolean {
  if (webgl !== null) return webgl
  try {
    const c = document.createElement('canvas')
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webgl = false
  }
  return webgl
}

/**
 * Local GPU tier heuristic. drei's useDetectGPU downloads benchmark data at runtime,
 * which breaks the no-network rule, so we read the renderer string and device hints instead.
 */
export function detectTier(): Tier {
  if (detected) return detected
  if (!hasWebGL()) return (detected = 'off')
  let renderer = ''
  try {
    const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    renderer = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
  } catch {
    /* ignore */
  }
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
  if (/swiftshader|llvmpipe|software/i.test(renderer)) detected = 'low'
  else if (mobile || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4) detected = 'medium'
  else detected = 'high'
  return detected
}

/** Quality from the Prototype switcher (Auto uses detection). */
export function useQuality(): Tier {
  const q = useUi((s) => s.quality)
  return useMemo(() => (q === 'auto' ? detectTier() : q === 'off' ? 'off' : q), [q])
}

/** Everything a scene needs to decide how hard to work. */
export function useSceneMode() {
  const tier = useQuality()
  const reduced = useReducedMotion()
  return { tier, reduced, animate: !reduced, post: tier === 'high' && !reduced }
}
