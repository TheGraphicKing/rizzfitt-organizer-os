import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three'
import { T } from '../palette'

/** Instanced confetti quads with simple physics. Re-bursts when `trigger` changes. */
export function ConfettiBurst({ count = 160, trigger = 0, origin = [0, 0, 0] as [number, number, number], power = 1 }: { count?: number; trigger?: number; origin?: [number, number, number]; power?: number }) {
  const ref = useRef<InstancedMesh>(null)
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        p: [0, 0, 0],
        v: [0, 0, 0],
        r: [0, 0, 0],
        w: [Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3],
      })),
    [count],
  )
  useEffect(() => {
    parts.forEach((pt) => {
      const a = Math.random() * Math.PI * 2
      const up = 4 + Math.random() * 5
      const out = 1 + Math.random() * 3.5
      pt.p = [...origin]
      pt.v = [Math.cos(a) * out * power, up * power, Math.sin(a) * out * power]
      pt.r = [Math.random() * 6, Math.random() * 6, Math.random() * 6]
    })
  }, [trigger, parts, origin, power])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new Color()
    for (let i = 0; i < count; i++) m.setColorAt(i, c.set(T.cat(i)))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])
  const d = useMemo(() => new Object3D(), [])
  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    const step = Math.min(dt, 0.05)
    parts.forEach((pt, i) => {
      pt.v[1] -= 9.8 * step * 0.9
      pt.v[0] *= 0.985
      pt.v[2] *= 0.985
      pt.v[1] = Math.max(pt.v[1], -2.2)
      pt.p[0] += pt.v[0] * step
      pt.p[1] += pt.v[1] * step
      pt.p[2] += pt.v[2] * step
      pt.r[0] += pt.w[0] * step
      pt.r[1] += pt.w[1] * step
      d.position.set(pt.p[0], pt.p[1], pt.p[2])
      d.rotation.set(pt.r[0], pt.r[1], pt.r[2])
      d.scale.setScalar(pt.p[1] < -6 ? 0 : 1)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.12, 0.22]} />
      <meshStandardMaterial side={DoubleSide} roughness={0.5} />
    </instancedMesh>
  )
}
