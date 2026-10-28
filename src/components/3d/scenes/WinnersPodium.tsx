import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { Medal as MedalIcon } from 'lucide-react'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { Medal, Podium } from '../objects/Awards'
import { ConfettiBurst } from '../objects/Confetti'
import { Fallback3D } from '../perf/Fallback3D'
import { useSceneMode } from '../perf/quality'

function Rig({ names, accent }: { names: [string, string, string]; accent?: string }) {
  const g = useRef<Group>(null)
  const { animate } = useSceneMode()
  const t0 = useRef<number | null>(null)
  useFrame(({ clock, pointer }) => {
    if (!g.current) return
    if (t0.current === null) t0.current = clock.elapsedTime
    const k = animate ? MathUtils.clamp((clock.elapsedTime - t0.current) / 0.7, 0, 1) : 1
    // plates flip in when the category changes (the scene remounts per category)
    g.current.rotation.x = (1 - k) * -0.9
    if (animate) g.current.rotation.y = MathUtils.lerp(g.current.rotation.y, pointer.x * 0.25, 0.05)
  })
  return (
    <group ref={g} position={[0, -1.1, 0]}>
      <Podium names={names} accent={accent} />
      {([[-1.55, 1.25, 2], [0, 1.7, 1], [1.55, 0.95, 3]] as const).map(([x, y, t]) => (
        <group key={t} position={[x, y + 0.75, 0.6]} scale={0.32}>
          <Medal tier={t} ribbon={false} />
        </group>
      ))}
    </group>
  )
}

/** S11: podium with winner names on glass plates and confetti on first view. */
export default function WinnersPodium({ names, accent, className, burst }: { names: [string, string, string]; accent?: string; className?: string; burst: number }) {
  const { animate } = useSceneMode()
  return (
    <SceneCanvas className={className} camera={{ position: [0, 1.4, 7], fov: 34 }} fallback={<Fallback3D icon={MedalIcon} />}>
      <NightLights shadowY={-1.12} />
      <Rig names={names} accent={accent} />
      {animate && <ConfettiBurst trigger={burst} origin={[0, 1.5, 0]} count={140} />}
    </SceneCanvas>
  )
}
