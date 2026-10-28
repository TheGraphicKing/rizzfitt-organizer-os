import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { Blocks } from 'lucide-react'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { ModuleBlock } from '../objects/Tokens'
import { ConfettiBurst } from '../objects/Confetti'
import { Fallback3D } from '../perf/Fallback3D'
import { useSceneMode } from '../perf/quality'
import { T } from '../palette'

interface Props {
  labels: string[]
  title: string
  accent: string
  progress: React.MutableRefObject<number>
  done: boolean
}

function Block({ i, n, label, progress, color }: { i: number; n: number; label: string; progress: React.MutableRefObject<number>; color: string }) {
  const ref = useRef<Group>(null)
  const cols = Math.ceil(Math.sqrt(n))
  const target = useMemo(() => [((i % cols) - (cols - 1) / 2) * 1.12, Math.floor(i / cols) * 0.0, (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * 1.12] as const, [i, n, cols])
  const start = useMemo(() => {
    const a = (i / n) * Math.PI * 2 + 0.6
    return [Math.cos(a) * 9, 6 + (i % 3) * 2, Math.sin(a) * 9] as const
  }, [i, n])
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const t0 = (i / n) * 0.75
    const k = MathUtils.clamp((progress.current - t0) / 0.18, 0, 1)
    const e = 1 - Math.pow(1 - k, 3)
    const bounce = k > 0.85 ? Math.sin((k - 0.85) / 0.15 * Math.PI) * 0.12 : 0
    g.position.set(MathUtils.lerp(start[0], target[0], e), MathUtils.lerp(start[1], target[1], e) + bounce, MathUtils.lerp(start[2], target[2], e))
    g.rotation.y = (1 - e) * 3
    g.rotation.x = (1 - e) * 1.5
    g.visible = k > 0
  })
  return (
    <group ref={ref} visible={false}>
      <ModuleBlock label={label} color={color} />
    </group>
  )
}

function Crown({ progress, title, accent }: { progress: React.MutableRefObject<number>; title: string; accent: string }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const k = MathUtils.clamp((progress.current - 0.88) / 0.12, 0, 1)
    g.visible = k > 0
    g.position.y = MathUtils.lerp(4, 0.7, 1 - Math.pow(1 - k, 3))
    g.scale.setScalar(1.6 + k * 0.2)
  })
  return (
    <group ref={ref} visible={false}>
      <ModuleBlock label={title} color={accent} sub="Ready" />
    </group>
  )
}

function Rig({ labels, title, accent, progress, done }: Props) {
  const root = useRef<Group>(null)
  const { animate } = useSceneMode()
  useFrame((_, dt) => {
    if (root.current && animate) root.current.rotation.y += dt * 0.15
  })
  return (
    <>
      <NightLights shadowY={-0.3} shadowScale={10} />
      <group ref={root}>
        {labels.map((l, i) => (
          <Block key={l} i={i} n={labels.length} label={l} progress={progress} color={i % 2 ? T.cat(1) : T.brand} />
        ))}
        <Crown progress={progress} title={title} accent={accent} />
      </group>
      {done && animate && <ConfettiBurst trigger={1} origin={[0, 1, 0]} power={1.1} />}
    </>
  )
}

/** S5: module blocks fly in and snap into an isometric grid; event block lands on top; confetti. */
export default function BuildingApp(props: Props & { className?: string }) {
  return (
    <SceneCanvas className={props.className} orthographic camera={{ position: [8, 8, 8], zoom: 62 }} fallback={<Fallback3D icon={Blocks} />}>
      <Rig {...props} />
    </SceneCanvas>
  )
}
