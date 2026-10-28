import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group } from 'three'
import SceneCanvas from '../perf/SceneCanvas'
import { Paddle, PickleballBall } from '../objects/Equipment'
import { NightLights } from '../Lighting'
import { useSceneMode } from '../perf/quality'
import { Fallback3D } from '../perf/Fallback3D'
import { Volleyball } from 'lucide-react'

function Bounce() {
  const ball = useRef<Group>(null)
  const { animate } = useSceneMode()
  useFrame(({ clock }) => {
    const t = animate ? Math.min(clock.elapsedTime, 1.43) : 0.4 // one bounce on entry, then rest (brand: no loops)
    if (ball.current) {
      ball.current.position.y = 0.9 + Math.abs(Math.sin(t * 2.2)) * 0.9
      ball.current.rotation.x = t * 1.5
    }
  })
  return (
    <group ref={ball} position={[0.15, 1, 0.5]} scale={0.32}>
      <PickleballBall />
    </group>
  )
}

/** Small floating paddle and ball (sign-in, M-02). Decorative. */
export default function PaddleBall({ className }: { className?: string }) {
  return (
    <SceneCanvas className={className} camera={{ position: [0, 0.6, 5], fov: 32 }} fallback={<Fallback3D icon={Volleyball} />}>
      <NightLights shadowY={-1.6} />
      <Float speed={0} rotationIntensity={0.4} floatIntensity={0.6}>
        <group rotation={[-0.25, 0.5, -0.3]} position={[0, -1.4, 0]} scale={2.1}>
          <Paddle />
        </group>
      </Float>
      <Bounce />
    </SceneCanvas>
  )
}
