import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, View } from '@react-three/drei'
import type { Group } from 'three'
import { Box, Coins, Gavel as GavelIcon, Layers, Medal as MedalIcon, PartyPopper as PopperIcon, Trophy as TrophyIcon, Volleyball } from 'lucide-react'
import { Court } from '../../components/3d/objects/Court'
import { CricketBall, CricketBat, Football, Paddle, PickleballBall, Shuttlecock } from '../../components/3d/objects/Equipment'
import { Medal, Podium, Trophy } from '../../components/3d/objects/Awards'
import { CardFan, CoinStack, Gavel, GroupPot, LeagueShield, ModuleBlock, PartyPopper } from '../../components/3d/objects/Tokens'
import { ConfettiBurst } from '../../components/3d/objects/Confetti'
import { NightLights } from '../../components/3d/Lighting'
import { useSceneMode } from '../../components/3d/perf/quality'
import { Fallback3D } from '../../components/3d/perf/Fallback3D'
import { Logo } from '../../components/ui/Misc'
import { Segmented } from '../../components/ui/Controls'
import { Button } from '../../components/ui/Button'
import { useUi } from '../../store/store'
import type { Quality } from '../../mock/types'
import type { LucideIcon } from 'lucide-react'

function Turntable({ children, speed = 0.4, y = 0 }: { children: ReactNode; speed?: number; y?: number }) {
  const ref = useRef<Group>(null)
  const { animate } = useSceneMode()
  useFrame((_, dt) => {
    if (ref.current && animate) ref.current.rotation.y += dt * speed
  })
  return (
    <group ref={ref} position-y={y}>
      {children}
    </group>
  )
}

function Fps() {
  const el = useRef<HTMLSpanElement | null>(null)
  const frames = useRef(0)
  const last = useRef(performance.now())
  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - last.current > 500) {
      const fps = Math.round((frames.current * 1000) / (now - last.current))
      if (!el.current) el.current = document.getElementById('fps-meter') as HTMLSpanElement
      if (el.current) el.current.textContent = `${fps} fps`
      frames.current = 0
      last.current = now
    }
  })
  return null
}

interface Item {
  name: string
  note: string
  icon: LucideIcon
  cam?: [number, number, number]
  node: ReactNode
}

export function Lab3d() {
  const { tier, reduced } = useSceneMode()
  const ui = useUi()
  const [burst, setBurst] = useState(0)
  const container = useRef<HTMLDivElement>(null!)
  const q = tier === 'off' ? 'low' : tier
  const items: Item[] = [
    { name: 'Pickleball court', note: '20 x 44 ft, kitchen 7 ft, net 36 to 34 in', icon: Box, cam: [0, 3.2, 4.2], node: <group scale={0.085}><Court glowLines /></group> },
    { name: 'Badminton court', note: 'Same footprint, badminton lines', icon: Box, cam: [0, 3.2, 4.2], node: <group scale={0.085}><Court sport="badminton" /></group> },
    { name: 'Pickleball', note: '40 holes on a Fibonacci sphere', icon: Volleyball, node: <Turntable><PickleballBall quality={q} /></Turntable> },
    { name: 'Paddle', note: 'Carbon face, orange edge guard, wrapped grip', icon: Volleyball, node: <Turntable y={-0.9}><group scale={1.4} rotation-x={-0.15}><Paddle quality={q} /></group></Turntable> },
    { name: 'Shuttlecock', note: 'Cork base, 16 feathers', icon: Volleyball, node: <Turntable y={-0.6}><Shuttlecock quality={q} /></Turntable> },
    { name: 'Cricket bat and ball', note: 'Blade profile with shoulders, seam', icon: Volleyball, node: <Turntable><group scale={0.7}><CricketBat /></group><group position={[1, -0.9, 0]}><CricketBall /></group></Turntable> },
    { name: 'Football', note: 'Twelve pentagon panels', icon: Volleyball, node: <Turntable><Football quality={q} /></Turntable> },
    { name: 'Trophy (fill 60%)', note: 'Lathe cup, orange liquid fill', icon: TrophyIcon, cam: [0, 1.6, 5], node: <Turntable y={-1.4}><Trophy fill={0.6} quality={q} /></Turntable> },
    { name: 'Podium', note: 'Steps 1, 2, 3 with name plates', icon: MedalIcon, cam: [0, 2.2, 5.5], node: <group position-y={-0.9}><Podium names={['Arjun and Vikram', 'Rohit and Sameer', 'Kiran and Teja']} /></group> },
    { name: 'Medals', note: 'Gold, silver, bronze', icon: MedalIcon, node: <Turntable speed={0.6}><group position={[-1.2, 0, 0]}><Medal tier={2} /></group><Medal tier={1} /><group position={[1.2, 0, 0]}><Medal tier={3} /></group></Turntable> },
    { name: 'Gavel', note: 'Auction strikes', icon: GavelIcon, node: <Turntable><Gavel /></Turntable> },
    { name: 'Coin stacks', note: 'Height follows the remaining budget', icon: Coins, cam: [0, 1.8, 4.2], node: <group position-y={-1}>{[1, 0.7, 0.4, 0.15].map((v, i) => <group key={i} position={[(i - 1.5) * 1.2, 0, 0]}><CoinStack value={v} color={undefined} /></group>)}</group> },
    { name: 'Card fan', note: 'Draft picks', icon: Layers, node: <group position-y={-0.3}><CardFan /></group> },
    { name: 'Group pot', note: 'Glass bowl with team tokens', icon: Box, node: <GroupPot quality={q} /> },
    { name: 'Module blocks', note: 'Building your app', icon: Box, cam: [2.5, 2.6, 3.4], node: <group>{['Home', 'Registrations', 'Schedule', 'Match day'].map((l, i) => <group key={l} position={[(i % 2) * 1.15 - 0.55, Math.floor(i / 2) * 0.45 - 0.4, 0]}><ModuleBlock label={l} color={undefined} /></group>)}</group> },
    { name: 'Event-type tokens', note: 'League shield, party popper', icon: PopperIcon, node: <Turntable><group position={[-0.9, 0, 0]} scale={0.6}><LeagueShield /></group><group position={[0.9, -0.2, 0]} scale={0.6}><PartyPopper /></group></Turntable> },
    { name: 'Confetti burst', note: 'Instanced quads with physics', icon: PopperIcon, cam: [0, 1, 7], node: <ConfettiBurst trigger={burst} origin={[0, -1, 0]} /> },
  ]
  return (
    <div ref={container} className="relative min-h-dvh bg-base">
      <header className="glass sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-line-subtle px-6 py-3">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <h1 className="t-h3 text-fg">3D kit</h1>
        <span className="rounded-pill bg-s2 px-3 py-1 text-[13px] font-semibold text-fg2 tnum">
          <span id="fps-meter">... fps</span> · {tier} {reduced ? '· reduced motion' : ''}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Segmented<Quality>
            label="Quality"
            size="sm"
            value={ui.quality}
            onChange={(v) => ui.set({ quality: v })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
              { value: 'off', label: 'Off' },
            ]}
          />
          <Segmented<'on' | 'off'> label="Reduced motion" size="sm" value={reduced ? 'on' : 'off'} onChange={(v) => ui.set({ reducedMotion: v === 'on' })} options={[{ value: 'off', label: 'Motion' }, { value: 'on', label: 'Reduced' }]} />
          <Button size="sm" variant="secondary" onClick={() => setBurst((b) => b + 1)}>
            Burst confetti
          </Button>
        </div>
      </header>
      <main id="main" className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => (
          <figure key={it.name} className="card overflow-hidden p-0">
            <div className="relative h-[240px]">
              {tier === 'off' ? (
                <Fallback3D icon={it.icon} />
              ) : (
                <View className="absolute inset-0">
                  <PerspectiveCamera makeDefault position={it.cam ?? [0, 0.6, 4]} fov={35} onUpdate={(c) => c.lookAt(0, 0, 0)} />
                  <NightLights shadows={false} />
                  {it.node}
                </View>
              )}
            </div>
            <figcaption className="border-t border-line-subtle px-4 py-3">
              <p className="font-semibold text-fg">{it.name}</p>
              <p className="t-small text-fg3">{it.note}</p>
            </figcaption>
          </figure>
        ))}
      </main>
      {tier !== 'off' && (
        <Canvas
          eventSource={container}
          className="!fixed inset-0 !pointer-events-none"
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
          dpr={[1, tier === 'high' ? 1.75 : 1.25]}
          frameloop={reduced ? 'demand' : 'always'}
          gl={{ antialias: tier !== 'low', alpha: true }}
        >
          <View.Port />
          <Fps />
        </Canvas>
      )}
    </div>
  )
}
