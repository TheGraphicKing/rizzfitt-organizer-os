import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { Court } from '../objects/Court'
import { useSceneMode } from '../perf/quality'
import { T } from '../palette'
import type { CourtState } from '../../../store/selectors'

export interface CourtTile {
  court: number
  state: CourtState
  title: string
  a?: string
  b?: string
  games?: { a: number; b: number }
  points?: { a: number; b: number }
  server?: 'A' | 'B'
  lateMin?: number
}

const STEP_X = 3.6
const STEP_Z = 5.6

function layout(n: number, compact: boolean) {
  const cols = n <= 4 ? n : n <= 6 ? 3 : compact ? 4 : n <= 8 ? 4 : 5
  return { cols, rows: Math.ceil(n / cols) }
}

function Tile({ t, pos, selected, onSelect, compact }: { t: CourtTile; pos: [number, number, number]; selected: boolean; onSelect: (c: number) => void; compact: boolean }) {
  const slab = useRef<Mesh>(null)
  const g = useRef<Group>(null)
  const { animate } = useSceneMode()
  const live = t.state === 'live'
  const amber = t.state === 'late' || t.state === 'awaiting' || t.state === 'called'
  const accent = live ? T.brand : amber ? T.warning : T.surface3
  useFrame(({ clock }) => {
    const m = slab.current?.material as MeshStandardMaterial | undefined
    if (m) {
      const pulse = t.state === 'late' && animate ? 0.4 + Math.sin(clock.elapsedTime * 4) * 0.35 : live ? 0.55 : amber ? 0.3 : 0.02
      m.emissiveIntensity = pulse
    }
    if (g.current) g.current.position.y = MathUtils.lerp(g.current.position.y, selected ? 0.35 : live ? 0.12 : 0, 0.15)
  })
  return (
    <group ref={g} position={pos} onClick={(e) => (e.stopPropagation(), onSelect(t.court))} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      <mesh ref={slab} position={[0, -0.16, 0]}>
        <boxGeometry args={[2.7, 0.3, 5]} />
        <meshStandardMaterial color={T.surface2} emissive={accent} emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      <group scale={0.1} position={[0, 0.01, 0]}>
        <Court glowLines={live || selected} accent={live ? T.brand : T.warning} apron={false} showNet={!compact || live} floorColor={t.state === 'free' || t.state === 'paused' ? T.surface3 : undefined} kitchenColor={t.state === 'free' || t.state === 'paused' ? T.surface2 : undefined} />
      </group>
    </group>
  )
}

function CameraRig({ target, cols, rows }: { target: Vector3 | null; cols: number; rows: number }) {
  const { camera, size } = useThree()
  const look = useMemo(() => new Vector3(), [])
  const { animate } = useSceneMode()
  useFrame(() => {
    const to = target ?? new Vector3(0, 0, 0)
    look.lerp(to, animate ? 0.08 : 1)
    const fit = Math.min(size.width / (cols * STEP_X + 1.2), size.height / (rows * STEP_Z * 0.78 + 2.6)) * 0.92
    const z = target ? fit * 1.7 : fit
    camera.position.set(look.x + 3.5, 12, look.z + 10)
    camera.lookAt(look)
    if ('zoom' in camera) {
      camera.zoom = MathUtils.lerp(camera.zoom, z, animate ? 0.1 : 1)
      camera.updateProjectionMatrix()
    }
  })
  return null
}

/** Writes each tile's screen position into the DOM score bugs (no extra React roots). */
function Projector({ positions, bugs }: { positions: [number, number, number][]; bugs: MutableRefObject<(HTMLDivElement | null)[]> }) {
  const { camera, size } = useThree()
  const v = useMemo(() => new Vector3(), [])
  useFrame(() => {
    positions.forEach((p, i) => {
      const el = bugs.current[i]
      if (!el) return
      v.set(p[0], p[1] + 0.6, p[2]).project(camera)
      el.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`
      el.style.opacity = '1'
    })
  })
  return null
}

function Bug({ t, mini }: { t: CourtTile; mini?: boolean }) {
  const live = t.state === 'live'
  if (mini)
    return (
      <div className="glass flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-line-strong px-2 py-1 text-[11px] font-bold shadow-float">
        <span className="text-fg">Court {t.court}</span>
        <span className={live ? 'text-live' : t.state === 'free' ? 'text-fg3' : 'text-warning'}>
          {live ? `${t.points?.a ?? 0}-${t.points?.b ?? 0}` : t.state === 'late' ? `${t.lateMin} min late` : t.state === 'awaiting' ? 'Confirm' : t.state === 'free' ? 'Free' : t.state === 'called' ? 'Called' : 'Paused'}
        </span>
      </div>
    )
  return (
    <div className="glass w-[176px] rounded-md border border-line-strong px-2.5 py-2 text-left shadow-float">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-fg">Court {t.court}</span>
        {live ? (
          <span className="flex items-center gap-1 text-live"><span className="h-1.5 w-1.5 rounded-full bg-live" />LIVE</span>
        ) : t.state === 'late' ? (
          <span className="text-warning">{t.lateMin} min late</span>
        ) : t.state === 'awaiting' ? (
          <span className="text-warning">Confirm result</span>
        ) : t.state === 'called' ? (
          <span className="text-warning">Called</span>
        ) : t.state === 'paused' ? (
          <span className="text-fg3">Paused</span>
        ) : (
          <span className="text-fg3">Free · Call next</span>
        )}
      </div>
      {t.a && (
        <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
          {([['A', t.a, t.games?.a, t.points?.a], ['B', t.b, t.games?.b, t.points?.b]] as const).map(([s, n, g, p]) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.server === s ? 'bg-ball' : ''}`} />
              <span className="min-w-0 flex-1 truncate text-fg2">{n}</span>
              {g !== undefined && <span className="text-fg3 tnum">{g}</span>}
              {p !== undefined && live && <span className="w-5 rounded-sm bg-s3 text-center font-bold text-fg tnum">{p}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** S7: isometric field of the event's courts with glowing live tiles and score bugs. A DOM list beside it carries the same info. */
export default function CourtMap({ tiles, selected, onSelect, compact = false, className }: { tiles: CourtTile[]; selected: number | null; onSelect: (c: number) => void; compact?: boolean; className?: string }) {
  const { cols, rows } = layout(tiles.length, compact)
  const positions = tiles.map((_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    return [(c - (cols - 1) / 2) * STEP_X, 0, (r - (rows - 1) / 2) * STEP_Z] as [number, number, number]
  })
  const sel = selected ? tiles.findIndex((t) => t.court === selected) : -1
  const target = sel >= 0 ? new Vector3(...positions[sel]) : null
  const bugs = useRef<(HTMLDivElement | null)[]>([])
  return (
    <div className={className}>
    <SceneCanvas
      className="absolute inset-0"
      orthographic
      camera={{ position: [3.5, 12, 10], zoom: 30 }}
      fallback={
        <div className="grid h-full grid-cols-2 gap-2 p-3">
          {tiles.map((t) => (
            <button key={t.court} type="button" onClick={() => onSelect(t.court)} className={`rounded-md border p-3 text-left ${t.state === 'live' ? 'border-brand bg-brand-soft' : t.state === 'free' ? 'border-line bg-s1' : 'border-warning bg-warning-soft'}`}>
              <span className="font-semibold text-fg">Court {t.court}</span>
              <span className="block text-[12px] text-fg3">{t.title}</span>
            </button>
          ))}
        </div>
      }
    >
      <NightLights shadows={false} intensity={0.9} />
      <CameraRig target={target} cols={cols} rows={rows} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.32, 0]} onClick={() => onSelect(0)}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={T.surface1} roughness={1} />
      </mesh>
      {tiles.map((t, i) => (
        <Tile key={t.court} t={t} pos={positions[i]} selected={selected === t.court} onSelect={onSelect} compact={compact} />
      ))}
      <Projector positions={positions} bugs={bugs} />
    </SceneCanvas>
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {tiles.map((t, i) => (
        <div key={t.court} ref={(el) => { bugs.current[i] = el }} className="absolute left-0 top-0 opacity-0" >
          <Bug t={t} mini />
        </div>
      ))}
    </div>
    </div>
  )
}
