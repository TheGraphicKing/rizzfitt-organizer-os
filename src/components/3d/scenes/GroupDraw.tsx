import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group, type Mesh } from 'three'
import { Shuffle } from 'lucide-react'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { GroupPot } from '../objects/Tokens'
import { ClayMaterial } from '../objects/Equipment'
import { Fallback3D } from '../perf/Fallback3D'
import { useSceneMode } from '../perf/quality'
import { T } from '../palette'
import { textTexture } from '../textTexture'

interface Props {
  groups: { name: string; count: number }[]
  playKey: number
}

function Tokens({ groups, playKey }: Props) {
  const { animate } = useSceneMode()
  const start = useRef(0)
  const lastKey = useRef(-1)
  const n = groups.length
  const width = Math.min(11, n * 1.6)
  const tokens = useMemo(() => {
    const out: { g: number; k: number; i: number }[] = []
    let i = 0
    const max = Math.max(...groups.map((g) => g.count), 0)
    for (let k = 0; k < max; k++) groups.forEach((g, gi) => k < g.count && out.push({ g: gi, k, i: i++ }))
    return out
  }, [groups])
  const refs = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    if (lastKey.current !== playKey) {
      lastKey.current = playKey
      start.current = clock.elapsedTime
    }
    const t = animate ? clock.elapsedTime - start.current : 99
    tokens.forEach((tk, idx) => {
      const m = refs.current[idx]
      if (!m) return
      const delay = tk.i * (2.2 / Math.max(1, tokens.length))
      const k = MathUtils.clamp((t - delay) / 0.55, 0, 1)
      const x0 = 0
      const y0 = 1.7
      const x1 = n > 1 ? -width / 2 + (tk.g / (n - 1)) * width : 0
      const y1 = -1.25 + tk.k * 0.32
      m.position.set(MathUtils.lerp(x0, x1, k), MathUtils.lerp(y0, y1, k) + Math.sin(k * Math.PI) * 1.2, MathUtils.lerp(0, 0.3, k))
      m.rotation.set(k * 6, k * 4, 0)
      m.visible = t > delay - 0.05
    })
  })
  return (
    <group>
      {tokens.map((tk, idx) => (
        <mesh key={idx} ref={(el) => { refs.current[idx] = el }} visible={false}>
          <sphereGeometry args={[0.14, 18, 14]} />
          <ClayMaterial color={T.cat(tk.g)} />
        </mesh>
      ))}
      {groups.map((g, gi) => (
        <GroupLabel key={g.name} name={g.name} x={n > 1 ? -width / 2 + (gi / (n - 1)) * width : 0} color={T.cat(gi)} />
      ))}
    </group>
  )
}

function GroupLabel({ name, x, color }: { name: string; x: number; color: string }) {
  const tex = useMemo(() => textTexture(name, { w: 128, h: 128, bg: color, color: T.canvas, size: 72, radius: 24 }), [name, color])
  return (
    <mesh position={[x, -1.75, 0.3]}>
      <planeGeometry args={[0.42, 0.42]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function Pot() {
  const g = useRef<Group>(null)
  return (
    <group ref={g} position={[0, 1.55, -0.4]} scale={0.6}>
      <GroupPot tokens={8} quality="medium" />
    </group>
  )
}

/** S9: team tokens tumble out of a glass pot into group columns. */
export default function GroupDraw({ groups, playKey, className }: Props & { className?: string }) {
  return (
    <SceneCanvas className={className} camera={{ position: [0, 0.3, 7.5], fov: 40 }} fallback={<Fallback3D icon={Shuffle} />}>
      <NightLights shadows={false} />
      <Pot />
      <Tokens groups={groups} playKey={playKey} />
    </SceneCanvas>
  )
}
