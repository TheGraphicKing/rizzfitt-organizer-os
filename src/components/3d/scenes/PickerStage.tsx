import { useEffect, useReducer, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { CricketBall, CricketBat, Football, Paddle, PickleballBall, Shuttlecock } from '../objects/Equipment'
import { Medal, Trophy } from '../objects/Awards'
import { CardFan, CoinStack, Gavel, LeagueShield, PartyPopper } from '../objects/Tokens'
import { useSceneMode } from '../perf/quality'
import { T } from '../palette'

export type PickKind =
  | 'pickleball' | 'badminton' | 'cricket' | 'football' | 'multi' | 'circuit'
  | 'tournament' | 'league' | 'auction' | 'draft' | 'social'

function Model({ kind, pulse }: { kind: PickKind; pulse: number }) {
  // pulse: 0..1 progress of the signature move
  const s = Math.sin(pulse * Math.PI)
  switch (kind) {
    case 'pickleball':
      return (
        <group>
          <group rotation={[-0.3, 0.4, -0.25]} position={[-0.15, -0.55, 0]} scale={0.85}>
            <Paddle />
          </group>
          <group position={[0.3, 0.2 + s * 0.9, 0.25]} scale={0.17}>
            <PickleballBall />
          </group>
        </group>
      )
    case 'badminton':
      return (
        <group rotation-z={pulse * Math.PI * 2} position-y={s * 0.5 - 0.2} scale={0.55}>
          <Shuttlecock />
        </group>
      )
    case 'cricket':
      return (
        <group>
          <group rotation-z={0.4 - s * 1.1} scale={0.32} position={[-0.1, 0, 0]}>
            <CricketBat />
          </group>
          <group position={[0.42, -0.35 + s * 0.4, 0.2]} scale={0.5}>
            <CricketBall />
          </group>
        </group>
      )
    case 'football':
      return (
        <group rotation-y={pulse * Math.PI * 4} position-y={s * 0.4} scale={0.42}>
          <Football quality="medium" />
        </group>
      )
    case 'multi':
      return (
        <group rotation-y={pulse * Math.PI * 2}>
          <group position={[-0.3, 0.1, 0]} scale={0.2}>
            <PickleballBall quality="low" />
          </group>
          <group position={[0.25, 0.15, 0]} scale={0.24}>
            <Football quality="low" />
          </group>
          <group position={[0, -0.25, 0.2]} scale={0.32}>
            <CricketBall />
          </group>
        </group>
      )
    case 'circuit':
      return (
        <group rotation-y={pulse * Math.PI * 2} scale={0.75} position-y={-0.2}>
          <Medal tier={1} />
        </group>
      )
    case 'tournament':
      return (
        <group scale={0.36 * (1 + s * 0.15)} position-y={-0.55 + s * 0.15}>
          <Trophy fill={0.35 + s * 0.6} />
        </group>
      )
    case 'league':
      return (
        <group rotation-y={pulse * Math.PI * 2} scale={0.5}>
          <LeagueShield />
        </group>
      )
    case 'auction':
      return (
        <group scale={0.5} position-y={-0.1}>
          <Gavel strike={s} />
          <group position={[1.2, -1, 0.3]} scale={0.8}>
            <CoinStack value={0.6} max={8} />
          </group>
        </group>
      )
    case 'draft':
      return (
        <group scale={0.45} position-y={0.1}>
          <CardFan spread={1 + s * 0.6} />
        </group>
      )
    case 'social':
      return (
        <group scale={0.5 * (1 + s * 0.2)} position-y={-0.1}>
          <PartyPopper />
        </group>
      )
  }
}

function Slot({ kind, x, selected, hovered, disabled }: { kind: PickKind; x: number; selected: boolean; hovered: boolean; disabled: boolean }) {
  const g = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const pulse = useRef(1)
  const { animate } = useSceneMode()
  const [, force] = useForce()
  useEffect(() => {
    if (selected) pulse.current = animate ? 0 : 1
  }, [selected, animate])
  useFrame((state, dt) => {
    if (!g.current) return
    const lift = selected ? 0.25 : hovered ? 0.15 : 0
    g.current.position.y = MathUtils.lerp(g.current.position.y, lift, 0.12)
    if (animate) g.current.rotation.y = MathUtils.lerp(g.current.rotation.y, hovered || selected ? Math.sin(state.clock.elapsedTime * 1.2) * 0.4 : 0, 0.06)
    if (pulse.current < 1) {
      pulse.current = Math.min(1, pulse.current + dt * 1.1)
      force()
    }
    if (ring.current) {
      const m = ring.current.material as MeshStandardMaterial
      m.opacity = selected ? 0.4 + (1 - pulse.current) * 0.6 : 0
      ring.current.scale.setScalar(1 + (1 - pulse.current) * 0.5)
    }
  })
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[0.62, 0.7, 0.18, 40]} />
        <meshPhysicalMaterial color={T.surface3} roughness={0.35} clearcoat={1} emissive={selected ? T.brand : T.canvas} emissiveIntensity={selected ? 0.35 : 0} />
      </mesh>
      <mesh ref={ring} position={[0, -0.85, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.66, 0.74, 48]} />
        <meshStandardMaterial color={T.brand} emissive={T.brand} emissiveIntensity={2} transparent opacity={0} toneMapped={false} />
      </mesh>
      <group ref={g} scale={disabled ? 0.85 : 1}>
        <Model kind={kind} pulse={pulse.current} />
      </group>
    </group>
  )
}

function useForce() {
  return useReducer((x: number) => x + 1, 0)
}

/** S2 / S3: decorative stage above the real choice buttons. */
export default function PickerStage({ kinds, selected, hovered, disabled = [], className, fallback }: { kinds: PickKind[]; selected: number; hovered: number; disabled?: number[]; className?: string; fallback: ReactNode }) {
  const spacing = 1.75
  return (
    <SceneCanvas className={className} camera={{ position: [0, 0.9, 7.8], fov: 34 }} fallback={fallback}>
      <NightLights shadows={false} intensity={1.1} />
      <group position={[0, -0.1, 0]}>
        {kinds.map((k, i) => (
          <Slot key={k} kind={k} x={(i - (kinds.length - 1) / 2) * spacing} selected={i === selected} hovered={i === hovered} disabled={disabled.includes(i)} />
        ))}
      </group>
    </SceneCanvas>
  )
}
