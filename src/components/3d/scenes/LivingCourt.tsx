import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { CanvasTexture, MathUtils, SRGBColorSpace, Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import SceneCanvas from '../perf/SceneCanvas'
import { Court } from '../objects/Court'
import { Paddle, PickleballBall } from '../objects/Equipment'
import { NightLights } from '../Lighting'
import { useSceneMode } from '../perf/quality'
import { Fallback3D } from '../perf/Fallback3D'
import { T } from '../palette'

const S = 0.1 // feet to scene units

/** Glowing bracket lines laid flat over the court footprint (8 teams to a winner). */
function Bracket({ accent, opacity }: { accent: string; opacity: React.MutableRefObject<number> }) {
  const group = useRef<Group>(null)
  const segs = useMemo(() => {
    const out: [number, number, number, number][] = [] // x, z, w, l
    const rounds = 3
    let ys = Array.from({ length: 8 }, (_, i) => -1.75 + i * 0.5)
    for (let r = 0; r < rounds; r++) {
      const x0 = -0.95 + r * 0.6
      const next: number[] = []
      for (let i = 0; i < ys.length; i += 2) {
        const a = ys[i]
        const b = ys[i + 1]
        out.push([x0 + 0.15, a, 0.3, 0.025], [x0 + 0.15, b, 0.3, 0.025], [x0 + 0.3, (a + b) / 2, 0.025, b - a + 0.025])
        next.push((a + b) / 2)
      }
      ys = next
    }
    out.push([0.95 - 0.05, ys[0], 0.4, 0.03])
    return out
  }, [])
  useFrame(() => {
    const g = group.current
    if (!g) return
    g.visible = opacity.current > 0.01
    g.children.forEach((c) => (((c as Mesh).material as MeshStandardMaterial).opacity = opacity.current))
    g.position.y = 0.05 + opacity.current * 0.25
  })
  return (
    <group ref={group}>
      {segs.map(([x, z, w, l], i) => (
        <mesh key={i} position={[x, 0, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[w, l]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.2} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function dashboardTexture(accent: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 640
  const x = c.getContext('2d')!
  const family = getComputedStyle(document.body).fontFamily
  x.fillStyle = T.surface2
  x.beginPath()
  x.roundRect(0, 0, 1024, 640, 48)
  x.fill()
  x.fillStyle = T.textPrimary
  x.font = `700 44px ${family}`
  x.fillText('Coimbatore Open 2026', 56, 96)
  x.fillStyle = T.live
  x.beginPath()
  x.arc(64, 140, 9, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = 'rgba(255,255,255,0.6)'
  x.font = `600 26px ${family}`
  x.fillText('LIVE   Finals day   186 of 213 done', 84, 149)
  const tiles: [string, string][] = [['ENTRIES', '96'], ['PLAYERS', '152'], ['COLLECTED', '₹1,20,200']]
  tiles.forEach(([l, v], i) => {
    const tx = 56 + i * 312
    x.fillStyle = T.surface3
    x.beginPath()
    x.roundRect(tx, 196, 288, 160, 28)
    x.fill()
    x.fillStyle = 'rgba(255,255,255,0.55)'
    x.font = `600 22px ${family}`
    x.fillText(l, tx + 28, 244)
    x.fillStyle = i === 2 ? accent : T.textPrimary
    x.font = `700 56px ${family}`
    x.fillText(v, tx + 28, 318)
  })
  const bars = [0.4, 0.7, 0.55, 0.9, 0.65, 0.8, 1]
  bars.forEach((b, i) => {
    x.fillStyle = i === bars.length - 1 ? accent : 'rgba(255,255,255,0.18)'
    x.beginPath()
    x.roundRect(56 + i * 132, 580 - b * 180, 96, b * 180, 14)
    x.fill()
  })
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

function Rally({ animate, accent }: { animate: boolean; accent: string }) {
  const ball = useRef<Group>(null)
  const pA = useRef<Group>(null)
  const pB = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 1.3
    const period = 1.6
    const phase = (t % period) / period
    const leg = Math.floor(t / period) % 2
    const dir = leg === 0 ? 1 : -1
    const z = MathUtils.lerp(-16.5, 16.5, phase) * dir
    const x = Math.sin(t * 0.9) * 5
    const y = 1.2 + Math.sin(Math.PI * phase) * 7
    ball.current?.position.set(x * S, y * S, z * S)
    if (ball.current) ball.current.rotation.x += 0.15
    const swing = (end: number) => Math.max(0, 1 - Math.abs(phase - end) * 6)
    if (pA.current) {
      pA.current.position.x = MathUtils.lerp(pA.current.position.x, (dir > 0 ? x : x * 0.6) * S, 0.08)
      pA.current.rotation.x = -0.4 - swing(dir > 0 ? 0 : 1) * 0.9
    }
    if (pB.current) {
      pB.current.position.x = MathUtils.lerp(pB.current.position.x, (dir < 0 ? x : x * 0.6) * S, 0.08)
      pB.current.rotation.x = 0.4 + swing(dir > 0 ? 1 : 0) * 0.9
    }
  })
  return (
    <group>
      <group ref={ball} scale={0.07}>
        <PickleballBall />
      </group>
      <group ref={pA} position={[0, 0.25, -1.85]} scale={1.1}>
        <Paddle accent={accent} />
      </group>
      <group ref={pB} position={[0, 0.25, 1.85]} rotation-y={Math.PI} scale={1.1}>
        <Paddle accent={accent} />
      </group>
    </group>
  )
}

function Story({ progress, accent, lite }: { progress: React.MutableRefObject<number>; accent: string; lite?: boolean }) {
  const { animate, post, tier } = useSceneMode()
  const { camera, pointer } = useThree()
  const root = useRef<Group>(null)
  const courtRef = useRef<Group>(null)
  const dash = useRef<Mesh>(null)
  const rally = useRef<Group>(null)
  const bracketOpacity = useRef(0)
  const [hover, setHover] = useState(false)
  const dashTex = useMemo(() => dashboardTexture(accent), [accent])
  const from = useMemo(() => new Vector3(3.6, 2.5, 4.2), [])
  const top = useMemo(() => new Vector3(0, 6.2, 0.01), [])
  const tmp = useMemo(() => new Vector3(), [])
  useFrame((_, dt) => {
    const p = animate ? progress.current : 0
    // camera: angled view to top-down by p = 0.45
    const k = MathUtils.smoothstep(p, 0.05, 0.45)
    tmp.copy(from).lerp(top, k)
    camera.position.lerp(tmp, animate ? 0.12 : 1)
    camera.lookAt(0, 0, 0)
    if (root.current && animate) {
      root.current.rotation.y = MathUtils.lerp(root.current.rotation.y, pointer.x * 0.12, 0.05)
      root.current.rotation.x = MathUtils.lerp(root.current.rotation.x, -pointer.y * 0.05, 0.05)
    }
    // lines become a bracket
    const b = MathUtils.smoothstep(p, 0.42, 0.6) * (1 - MathUtils.smoothstep(p, 0.75, 0.88))
    bracketOpacity.current = b
    if (courtRef.current) {
      const fade = 1 - MathUtils.smoothstep(p, 0.42, 0.58)
      courtRef.current.scale.setScalar(S * (0.85 + fade * 0.15))
      courtRef.current.position.y = -(1 - fade) * 0.6
      courtRef.current.visible = fade > 0.02
    }
    if (rally.current) rally.current.visible = p < 0.5
    // then a dashboard card
    if (dash.current) {
      const d = MathUtils.smoothstep(p, 0.78, 0.95)
      dash.current.visible = d > 0.01
      ;(dash.current.material as MeshStandardMaterial).opacity = d
      dash.current.position.y = 0.3 + d * 0.9
      dash.current.rotation.x = -Math.PI / 2 + d * 0.25
    }
    void dt
  })
  return (
    <>
      <NightLights shadows={false} intensity={0.9} />
      <group ref={root}>
        <group ref={courtRef} scale={S}>
          <group onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
            <Court glowLines accent={accent} lineGlow={hover ? 1.6 : 1} />
          </group>
        </group>
        <group ref={rally}>
          <Rally animate={animate} accent={accent} />
        </group>
        <Bracket accent={accent} opacity={bracketOpacity} />
        <mesh ref={dash} visible={false} position={[0, 0.3, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[3.2, 2]} />
          <meshStandardMaterial map={dashTex} transparent toneMapped={false} />
        </mesh>
        {!lite && (
          <Float speed={animate ? 1.2 : 0} floatIntensity={0.4} rotationIntensity={0.2}>
            <group position={[-2.2, 0.9, -1.2]} scale={0.09}>
              <PickleballBall quality={tier === 'high' ? 'high' : 'low'} />
            </group>
          </Float>
        )}
      </group>
      {post && !lite && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      )}
    </>
  )
}

/** S1 Living court (and S15 microsite hero with `lite`). Decorative: text lives in the DOM. */
export default function LivingCourt({ progress, accent, lite, className }: { progress?: React.MutableRefObject<number>; accent?: string; lite?: boolean; className?: string }) {
  const local = useRef(0)
  const color = accent ?? T.brand
  return (
    <SceneCanvas
      className={className}
      camera={{ position: [3.6, 2.5, 4.2], fov: 34 }}
      fallback={
        <Fallback3D glow="var(--event-accent-glow)">
          <svg viewBox="0 0 200 440" className="h-[70%] -rotate-[28deg] opacity-80" aria-hidden>
            <rect x="10" y="10" width="180" height="420" rx="4" fill="var(--court-surface)" stroke={color} strokeWidth="4" />
            <rect x="10" y="150" width="180" height="140" fill="var(--court-kitchen)" stroke={color} strokeWidth="4" />
            <line x1="100" y1="10" x2="100" y2="150" stroke={color} strokeWidth="4" />
            <line x1="100" y1="290" x2="100" y2="430" stroke={color} strokeWidth="4" />
            <line x1="0" y1="220" x2="200" y2="220" stroke="var(--court-line)" strokeWidth="6" />
          </svg>
        </Fallback3D>
      }
    >
      <Story progress={progress ?? local} accent={color} lite={lite} />
    </SceneCanvas>
  )
}
