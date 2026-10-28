import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { MathUtils, type Group } from 'three'
import { Trophy as TrophyIcon } from 'lucide-react'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { Trophy } from '../objects/Awards'
import { Fallback3D } from '../perf/Fallback3D'
import { useSceneMode } from '../perf/quality'

function Spin({ fill, accent }: { fill: number; accent?: string }) {
  const g = useRef<Group>(null)
  const cur = useRef(0)
  const { animate } = useSceneMode()
  const [shown, setShown] = useState(animate ? 0 : fill)
  useEffect(() => {
    if (!animate) setShown(fill)
  }, [fill, animate])
  useFrame((state, dt) => {
    cur.current = animate ? MathUtils.damp(cur.current, fill, 2.5, dt) : fill
    // Rebuild the liquid in 2% steps only.
    const s = Math.round(cur.current * 50) / 50
    if (s !== shown) setShown(s)
    if (g.current && animate) g.current.rotation.y = MathUtils.damp(g.current.rotation.y, state.pointer.x * 0.4, 4, dt)
  })
  return (
    <group ref={g} position-y={-1.45}>
      <Trophy fill={shown} accent={accent} shine={fill >= 1} />
    </group>
  )
}

/** S6: trophy that fills with glowing orange as the go-live checklist completes. The checklist beside it is the text equivalent. */
export default function GoLiveTrophy({ fill, accent, className }: { fill: number; accent?: string; className?: string }) {
  return (
    <SceneCanvas className={className} camera={{ position: [0, 0.6, 6.4], fov: 32 }} fallback={<Fallback3D icon={TrophyIcon} />}>
      <NightLights shadowY={-1.5} />
      <Float speed={0} floatIntensity={0.25} rotationIntensity={0}>
        <Spin fill={fill} accent={accent} />
      </Float>
    </SceneCanvas>
  )
}
