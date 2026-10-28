import { useMemo } from 'react'
import { DoubleSide, LatheGeometry, Vector2 } from 'three'
import { RoundedBox } from '@react-three/drei'
import { T } from '../palette'
import { textTexture } from '../textTexture'
import type { ObjectProps } from './Court'

const OUTER: [number, number][] = [
  [0, 0], [0.9, 0], [0.92, 0.08], [0.9, 0.26], [0.62, 0.32], [0.52, 0.46], [0.2, 0.62], [0.15, 0.95], [0.17, 1.15], [0.3, 1.28],
  [0.62, 1.42], [0.88, 1.7], [1.0, 2.1], [1.05, 2.55], [1.08, 2.8], [1.02, 2.84],
]
const INNER: [number, number][] = [[0.97, 2.78], [0.95, 2.5], [0.9, 2.1], [0.78, 1.75], [0.5, 1.56], [0, 1.52]]

function innerRadiusAt(y: number): number {
  const pts = [...INNER].reverse()
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    if (y >= y0 && y <= y1) return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0)
  }
  return pts[pts.length - 1][0]
}

/** Trophy (lathe cup, metallic gold, orange ribbon). `fill` 0..1 raises glowing orange liquid inside. */
export function Trophy({ fill = 0, accent, quality = 'high', shine = false }: ObjectProps & { fill?: number; shine?: boolean }) {
  const seg = quality === 'low' ? 24 : 56
  const cup = useMemo(() => new LatheGeometry([...OUTER, ...INNER].map(([x, y]) => new Vector2(x, y)), seg), [seg])
  const liquid = useMemo(() => {
    const f = Math.max(0, Math.min(1, fill))
    if (f <= 0.001) return null
    const top = 1.53 + f * (2.74 - 1.53)
    const pts = [...INNER].reverse().filter(([, y]) => y < top).map(([x, y]) => new Vector2(Math.max(0, x * 0.97), y + 0.01))
    pts.unshift(new Vector2(0, 1.53))
    pts.push(new Vector2(innerRadiusAt(top) * 0.97, top), new Vector2(0, top))
    return new LatheGeometry(pts, seg)
  }, [fill, seg])
  const glow = accent ?? T.brand
  return (
    <group>
      <mesh geometry={cup} castShadow>
        <meshPhysicalMaterial color={T.gold} metalness={1} roughness={shine ? 0.15 : 0.25} clearcoat={0.6} side={DoubleSide} envMapIntensity={shine ? 1.6 : 1.1} />
      </mesh>
      {liquid && (
        <mesh geometry={liquid}>
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={shine ? 2.4 : 1.3} toneMapped={false} />
        </mesh>
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.02, 2.15, 0]} rotation-z={s > 0 ? -Math.PI / 2 : Math.PI / 2}>
          <torusGeometry args={[0.36, 0.065, 10, 24, Math.PI]} />
          <meshPhysicalMaterial color={T.gold} metalness={1} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.98, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.2, 0.07, 10, 28]} />
        <meshStandardMaterial color={glow} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.16, 0.9]}>
        <boxGeometry args={[0.7, 0.14, 0.02]} />
        <meshStandardMaterial color={glow} roughness={0.4} />
      </mesh>
    </group>
  )
}

export function Medal({ tier = 1, ribbon = true }: { tier?: 1 | 2 | 3; ribbon?: boolean }) {
  const color = tier === 1 ? T.gold : tier === 2 ? T.silver : T.bronze
  const face = useMemo(() => textTexture(String(tier), { w: 128, h: 128, color: 'rgba(0,0,0,0.55)', size: 72 }), [tier])
  return (
    <group>
      {ribbon && (
        <group position={[0, 0.9, -0.02]}>
          <mesh position={[-0.18, 0, 0]} rotation-z={0.32}>
            <planeGeometry args={[0.28, 1.2]} />
            <meshStandardMaterial color={T.brand} side={DoubleSide} />
          </mesh>
          <mesh position={[0.18, 0, -0.01]} rotation-z={-0.32}>
            <planeGeometry args={[0.28, 1.2]} />
            <meshStandardMaterial color={T.cat(1)} side={DoubleSide} />
          </mesh>
        </group>
      )}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.56, 0.56, 0.12, 48]} />
        <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.3} clearcoat={0.6} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.03]}>
        <torusGeometry args={[0.47, 0.025, 8, 48]} />
        <meshPhysicalMaterial color={color} metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial map={face} transparent />
      </mesh>
    </group>
  )
}

/** Three stepped rounded boxes with 1, 2, 3 and optional name plates. */
export function Podium({ names, accent }: { names?: [string, string, string]; accent?: string }) {
  const steps: { place: 1 | 2 | 3; x: number; h: number }[] = [
    { place: 2, x: -1.55, h: 1.0 },
    { place: 1, x: 0, h: 1.45 },
    { place: 3, x: 1.55, h: 0.7 },
  ]
  const nums = useMemo(() => steps.map((s) => textTexture(String(s.place), { w: 128, h: 128, color: s.place === 1 ? (accent ?? T.brand) : T.textPrimary, size: 96 })), [accent])
  const plates = useMemo(() => (names ? names.map((n) => textTexture(n, { w: 512, h: 128, size: 40, bg: 'rgba(20,20,28,0.85)', radius: 24, color: T.textPrimary })) : null), [names])
  return (
    <group>
      {steps.map((s, i) => (
        <group key={s.place} position={[s.x, s.h / 2, 0]}>
          <RoundedBox args={[1.45, s.h, 1.3]} radius={0.12} smoothness={4} castShadow>
            <meshPhysicalMaterial color={T.surface3} roughness={0.35} clearcoat={1} clearcoatRoughness={0.25} />
          </RoundedBox>
          <mesh position={[0, s.h / 2 - 0.42, 0.66]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial map={nums[i]} transparent toneMapped={false} />
          </mesh>
          {s.place === 1 && (
            <mesh position={[0, s.h / 2 + 0.005, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.45, 0.52, 40]} />
              <meshStandardMaterial color={accent ?? T.brand} emissive={accent ?? T.brand} emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
          )}
          {plates && (
            <mesh position={[0, s.h / 2 + 0.55, 0.3]}>
              <planeGeometry args={[1.5, 0.375]} />
              <meshBasicMaterial map={plates[i]} transparent toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}
