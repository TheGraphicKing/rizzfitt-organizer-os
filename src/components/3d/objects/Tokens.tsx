import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { DoubleSide, InstancedMesh, LatheGeometry, Object3D, Shape, Vector2, type Group } from 'three'
import { T } from '../palette'
import { textTexture } from '../textTexture'
import { ClayMaterial } from './Equipment'

/** Auction gavel: barrel head with bands, handle, and a sound block. */
export function Gavel({ strike = 0 }: { strike?: number }) {
  return (
    <group>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.3, 40]} />
        <ClayMaterial color={T.wood} roughness={0.5} />
      </mesh>
      <group rotation-z={0.5 - strike * 0.5} position={[0.2, -0.2, 0]}>
        <mesh rotation-z={Math.PI / 2} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1.3, 32]} />
          <ClayMaterial color={T.wood} roughness={0.45} />
        </mesh>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} rotation-z={Math.PI / 2} position={[x, 0.5, 0]}>
            <cylinderGeometry args={[0.315, 0.315, 0.1, 32]} />
            <meshPhysicalMaterial color={T.gold} metalness={1} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 1.7, 16]} />
          <ClayMaterial color={T.wood} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

/** Stack of coins whose height follows `value` (0..1 of max coins). */
export function CoinStack({ value = 1, max = 14, color }: { value?: number; max?: number; color?: string }) {
  const ref = useRef<InstancedMesh>(null)
  const count = Math.max(0, Math.round(value * max))
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new Object3D()
    for (let i = 0; i < max; i++) {
      d.position.set(Math.sin(i * 1.7) * 0.03, i < count ? i * 0.13 : -100, Math.cos(i * 1.3) * 0.03)
      d.rotation.y = i * 0.4
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [count, max])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, max]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 0.11, 32]} />
      <meshPhysicalMaterial color={color ?? T.gold} metalness={0.9} roughness={0.28} clearcoat={0.5} />
    </instancedMesh>
  )
}

/** Five rounded cards fanned from the bottom (draft picks). */
export function CardFan({ spread = 1 }: { spread?: number }) {
  const faces = useMemo(() => ['A', 'K', 'Q', 'J', '10'].map((t, i) => textTexture(t, { w: 128, h: 180, bg: i === 0 ? T.brand : T.textPrimary, color: i === 0 ? T.canvas : T.canvas, size: 64, radius: 14 })), [])
  return (
    <group>
      {faces.map((tex, i) => {
        const a = (i - 2) * 0.22 * spread
        return (
          <group key={i} rotation-z={-a} position={[0, -1, i * 0.02]}>
            <group position={[0, 1.15, 0]}>
              <RoundedBox args={[1.05, 1.5, 0.03]} radius={0.08} smoothness={3}>
                <meshPhysicalMaterial color={i === 0 ? T.brand : T.textPrimary} roughness={0.35} clearcoat={1} />
              </RoundedBox>
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[0.95, 1.36]} />
                <meshStandardMaterial map={tex} transparent />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/** Glass bowl with team tokens inside (draw animation). */
export function GroupPot({ tokens = 10, quality = 'high' }: { tokens?: number; quality?: 'high' | 'medium' | 'low' }) {
  const bowl = useMemo(() => {
    const pts: Vector2[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(new Vector2(Math.sin(t * Math.PI * 0.62) * 1.3 + 0.05, -Math.cos(t * Math.PI * 0.62) * 1.1 + 0.3))
    }
    return new LatheGeometry(pts, 48)
  }, [])
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = 0.5
  })
  return (
    <group>
      <mesh geometry={bowl}>
        {quality === 'high' ? (
          <meshPhysicalMaterial color={T.white} transmission={0.92} thickness={0.2} roughness={0.08} ior={1.3} side={DoubleSide} transparent />
        ) : (
          <meshPhysicalMaterial color={T.textPrimary} transparent opacity={0.18} roughness={0.1} side={DoubleSide} />
        )}
      </mesh>
      <group ref={ref}>
        {Array.from({ length: tokens }, (_, i) => {
          const a = i * 2.4
          const r = 0.25 + (i % 3) * 0.25
          return (
            <mesh key={i} position={[Math.cos(a) * r, -0.55 + (i % 4) * 0.12, Math.sin(a) * r]}>
              <sphereGeometry args={[0.16, 20, 16]} />
              <ClayMaterial color={T.cat(i)} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

/** Rounded block with a labelled top face (Building your app). */
export function ModuleBlock({ label, color, sub }: { label: string; color?: string; sub?: string }) {
  const tex = useMemo(() => textTexture(label, { w: 256, h: 256, bg: T.surface2, color: T.textPrimary, size: 34, sub, subColor: color ?? T.brand, stripe: color ?? T.brand, radius: 28 }), [label, color, sub])
  return (
    <group>
      <RoundedBox args={[1, 0.42, 1]} radius={0.09} smoothness={3} castShadow>
        <meshPhysicalMaterial color={T.surface3} roughness={0.35} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, 0.215, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.05, 0.505]}>
        <planeGeometry args={[0.9, 0.06]} />
        <meshStandardMaterial color={color ?? T.brand} emissive={color ?? T.brand} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** League shield token: rounded shield with a small table. */
export function LeagueShield() {
  const shape = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 1.3)
    s.lineTo(1, 1)
    s.lineTo(1, 0.1)
    s.quadraticCurveTo(0.9, -0.9, 0, -1.3)
    s.quadraticCurveTo(-0.9, -0.9, -1, 0.1)
    s.lineTo(-1, 1)
    s.lineTo(0, 1.3)
    return s
  }, [])
  const table = useMemo(() => textTexture('1  2  3\n4  5  6', { w: 256, h: 256, color: T.canvas, size: 54 }), [])
  return (
    <group>
      <mesh position={[0, 0, -0.15]}>
        <extrudeGeometry args={[shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 16 }]} />
        <meshPhysicalMaterial attach="material-0" color={T.cat(1)} roughness={0.35} clearcoat={1} />
        <meshPhysicalMaterial attach="material-1" color={T.silver} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0.24]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshStandardMaterial map={table} transparent />
      </mesh>
    </group>
  )
}

/** Party popper cluster: cone plus streamers and dots. */
export function PartyPopper() {
  return (
    <group rotation-z={-0.5}>
      <mesh position={[0, -0.3, 0]} rotation-z={Math.PI}>
        <coneGeometry args={[0.55, 1.5, 32]} />
        <ClayMaterial color={T.cat(4)} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 1.2 - 0.6
        return (
          <mesh key={i} position={[Math.sin(a) * (0.9 + (i % 3) * 0.25), 0.9 + Math.cos(a) * 0.6 + (i % 2) * 0.2, (i % 3) * 0.1 - 0.1]}>
            {i % 2 ? <sphereGeometry args={[0.1, 12, 10]} /> : <boxGeometry args={[0.08, 0.32, 0.04]} />}
            <ClayMaterial color={T.cat(i)} />
          </mesh>
        )
      })}
    </group>
  )
}
