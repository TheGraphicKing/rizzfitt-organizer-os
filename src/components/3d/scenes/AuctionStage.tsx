import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { Coins } from 'lucide-react'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { CoinStack, Gavel } from '../objects/Tokens'
import { Fallback3D } from '../perf/Fallback3D'
import { useSceneMode } from '../perf/quality'

function Striker({ strikeKey }: { strikeKey: number }) {
  const g = useRef<Group>(null)
  const t = useRef(1)
  const { animate } = useSceneMode()
  useEffect(() => {
    if (strikeKey) t.current = 0
  }, [strikeKey])
  useFrame((_, dt) => {
    t.current = Math.min(1, t.current + dt * 2.2)
    const s = animate ? Math.sin(t.current * Math.PI) : 0
    if (g.current) g.current.rotation.z = s * 0.7
  })
  return (
    <group ref={g} position={[3.9, 0.1, 0]} scale={0.55}>
      <Gavel />
    </group>
  )
}

/** S10: each team's remaining budget as a coin stack that shrinks; gavel strikes on Sold. */
export default function AuctionStage({ teams, strikeKey, className }: { teams: { id: string; color: string; value: number }[]; strikeKey: number; className?: string }) {
  const n = teams.length
  return (
    <SceneCanvas className={className} camera={{ position: [0, 2.2, 7.5], fov: 34 }} fallback={<Fallback3D icon={Coins} />}>
      <NightLights shadowY={-0.9} shadowScale={12} />
      <group position={[-0.4, -0.9, 0]}>
        {teams.map((t, i) => (
          <Stack key={t.id} x={(i - (n - 1) / 2) * 1.25} value={t.value} color={t.color} />
        ))}
      </group>
      <Striker strikeKey={strikeKey} />
    </SceneCanvas>
  )
}

function Stack({ x, value, color }: { x: number; value: number; color: string }) {
  const shown = useRef(value)
  const g = useRef<Group>(null)
  const { animate } = useSceneMode()
  useFrame((_, dt) => {
    shown.current = animate ? MathUtils.damp(shown.current, value, 3, dt) : value
    if (g.current) g.current.scale.y = Math.max(0.02, shown.current)
  })
  return (
    <group position={[x, 0, 0]}>
      <group ref={g}>
        <CoinStack value={1} max={14} />
      </group>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}
