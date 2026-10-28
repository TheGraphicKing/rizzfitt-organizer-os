import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { cn } from '../../../lib/cn'
import { hasWebGL, useSceneMode } from './quality'

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('3D scene fell back to 2D:', err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Keep the caller's absolute/fixed positioning; default to relative. */
function pos(className?: string): string {
  return /\b(absolute|fixed|sticky)\b/.test(className ?? '') ? '' : 'relative'
}

function useOnScreen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return on
}

function useTabVisible(): boolean {
  const [v, setV] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const fn = () => setV(!document.hidden)
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [])
  return v
}

/**
 * Wrapper used by every scene: quality-based dpr, PerformanceMonitor step-down,
 * pauses off screen or in a hidden tab, renders a still under reduced motion,
 * fades in after the page text, and falls back to 2D on any failure.
 */
export default function SceneCanvas({
  children,
  fallback,
  className,
  camera,
  orthographic,
  frameloop = 'always',
  shadows,
  label,
  style,
  onCreated,
  gl,
}: {
  children: ReactNode
  fallback: ReactNode
  className?: string
  camera?: CanvasProps['camera']
  orthographic?: boolean
  frameloop?: 'always' | 'demand'
  shadows?: boolean
  /** Text equivalent, used when the canvas is not decorative. */
  label?: string
  style?: React.CSSProperties
  onCreated?: CanvasProps['onCreated']
  gl?: CanvasProps['gl']
}) {
  const { tier, reduced } = useSceneMode()
  const ref = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(ref)
  const visible = useTabVisible()
  const [ready, setReady] = useState(false)
  const [dprCap, setDprCap] = useState(tier === 'high' ? 1.75 : tier === 'medium' ? 1.25 : 1)
  if (tier === 'off' || !hasWebGL()) {
    return (
      <div ref={ref} className={cn(pos(className), className)} style={style} aria-hidden={!label} role={label ? 'img' : undefined} aria-label={label}>
        {fallback}
      </div>
    )
  }
  const loop = !onScreen || !visible ? 'never' : reduced ? 'demand' : frameloop
  return (
    <div ref={ref} className={cn(pos(className), 'overflow-hidden', className)} style={style} aria-hidden={!label} role={label ? 'img' : undefined} aria-label={label}>
      <SceneBoundary fallback={fallback}>
        <Canvas
          orthographic={orthographic}
          camera={camera}
          shadows={shadows}
          frameloop={loop}
          dpr={[1, dprCap]}
          gl={{ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false, ...(typeof gl === 'object' ? gl : {}) }}
          onCreated={(state) => {
            state.gl.localClippingEnabled = true
            onCreated?.(state)
            requestAnimationFrame(() => setReady(true))
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: ready ? 1 : 0, transition: 'opacity 600ms cubic-bezier(0.2,0,0,1)', touchAction: 'pan-y' }}
          tabIndex={-1}
        >
          <PerformanceMonitor onDecline={() => setDprCap((d) => Math.max(1, d - 0.25))} onIncline={() => setDprCap((d) => Math.min(tier === 'high' ? 1.75 : 1.25, d + 0.25))} flipflops={3} />
          {children}
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
