import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, IcosahedronGeometry, InstancedMesh, Object3D, Shape, Vector3, type Group } from 'three'
import { T } from '../palette'
import type { ObjectProps } from './Court'

/** Shared "clay gloss" look from design/07. */
export function ClayMaterial({ color, ...rest }: { color: string; roughness?: number; emissive?: string; emissiveIntensity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={1} clearcoatRoughness={0.2} {...rest} />
}

/** Pickleball: optic yellow sphere with 40 holes placed on a Fibonacci sphere. */
export function PickleballBall({ radius = 1, holes = 40, quality = 'high' }: ObjectProps & { radius?: number; holes?: number }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const dummy = new Object3D()
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < holes; i++) {
      const y = 1 - (i / (holes - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = golden * i
      const p = new Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(radius * 1.002)
      dummy.position.copy(p)
      dummy.lookAt(p.clone().multiplyScalar(2))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [holes, radius])
  const seg = quality === 'low' ? 24 : 40
  const holeColor = useMemo(() => new Color(T.ball).multiplyScalar(0.42), [])
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[radius, seg, seg]} />
        <meshPhysicalMaterial color={T.ball} roughness={0.5} clearcoat={0.4} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, holes]}>
        <circleGeometry args={[radius * 0.13, quality === 'low' ? 10 : 16]} />
        <meshStandardMaterial color={holeColor} roughness={0.8} side={DoubleSide} />
      </instancedMesh>
    </group>
  )
}

/** Paddle: rounded-rectangle carbon face with an orange edge guard and a wrapped handle. */
export function Paddle({ accent, quality = 'high' }: ObjectProps) {
  const geo = useMemo(() => {
    const w = 7.6
    const h = 10.4
    const r = 2.2
    const s = new Shape()
    s.moveTo(-w / 2 + r, 0)
    s.lineTo(w / 2 - r, 0)
    s.quadraticCurveTo(w / 2, 0, w / 2, r * 0.6)
    s.lineTo(w / 2, h - r)
    s.quadraticCurveTo(w / 2, h, w / 2 - r, h)
    s.lineTo(-w / 2 + r, h)
    s.quadraticCurveTo(-w / 2, h, -w / 2, h - r)
    s.lineTo(-w / 2, r * 0.6)
    s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0)
    return s
  }, [])
  const rings = quality === 'low' ? 4 : 9
  return (
    <group scale={0.1}>
      <mesh position={[0, 4.6, -0.25]} castShadow>
        <extrudeGeometry args={[geo, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.18, bevelSegments: quality === 'low' ? 1 : 3, curveSegments: quality === 'low' ? 6 : 16 }]} />
        {/* groups: 0 = faces, 1 = sides (edge guard) */}
        <meshPhysicalMaterial attach="material-0" color={T.carbon} roughness={0.32} clearcoat={1} clearcoatRoughness={0.15} />
        <meshPhysicalMaterial attach="material-1" color={accent ?? T.brand} roughness={0.4} clearcoat={0.8} />
      </mesh>
      {/* handle */}
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 5, 18]} />
        <meshStandardMaterial color={T.grip} roughness={0.85} />
      </mesh>
      {Array.from({ length: rings }, (_, i) => (
        <mesh key={i} position={[0, 0.2 + i * (4.6 / rings), 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.66, 0.06, 6, 20]} />
          <meshStandardMaterial color={T.carbon} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.4, 18]} />
        <meshStandardMaterial color={accent ?? T.brand} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Shuttlecock: cork hemisphere plus a cone of 16 feathers and two thread rings. */
export function Shuttlecock({ quality = 'high' }: ObjectProps) {
  const feathers = quality === 'low' ? 12 : 16
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation-x={Math.PI}>
        <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <ClayMaterial color={T.cork} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.14, 24]} />
        <meshStandardMaterial color={T.cork} roughness={0.7} />
      </mesh>
      {Array.from({ length: feathers }, (_, i) => {
        const a = (i / feathers) * Math.PI * 2
        return (
          <group key={i} rotation-y={a}>
            <mesh position={[0.62, 0.95, 0]} rotation-z={-0.32}>
              <planeGeometry args={[0.32, 1.7]} />
              <meshStandardMaterial color={T.feather} side={DoubleSide} roughness={0.6} transparent opacity={0.96} />
            </mesh>
          </group>
        )
      })}
      {[0.55, 1.05].map((y, i) => (
        <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.5 + i * 0.17, 0.025, 6, 32]} />
          <meshStandardMaterial color={T.brand} />
        </mesh>
      ))}
    </group>
  )
}

/** Cricket bat: extruded blade profile with shoulders and a toe, plus a grip. */
export function CricketBat() {
  const blade = useMemo(() => {
    const s = new Shape()
    s.moveTo(-0.53, 0)
    s.lineTo(0.53, 0)
    s.quadraticCurveTo(0.56, 0.05, 0.56, 0.2)
    s.lineTo(0.56, 2.7)
    s.quadraticCurveTo(0.5, 2.95, 0.18, 3.05)
    s.lineTo(-0.18, 3.05)
    s.quadraticCurveTo(-0.5, 2.95, -0.56, 2.7)
    s.lineTo(-0.56, 0.2)
    s.quadraticCurveTo(-0.56, 0.05, -0.53, 0)
    return s
  }, [])
  return (
    <group>
      <mesh position={[0, -1.6, -0.12]}>
        <extrudeGeometry args={[blade, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 12 }]} />
        <ClayMaterial color={T.wood} roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.12, 0.13, 1.25, 14]} />
        <meshStandardMaterial color={T.grip} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.45, 0.13]}>
        <boxGeometry args={[0.7, 0.18, 0.02]} />
        <meshStandardMaterial color={T.brand} />
      </mesh>
    </group>
  )
}

export function CricketBall() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.36, 32, 24]} />
        <ClayMaterial color={T.cricketRed} />
      </mesh>
      <mesh rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.36, 0.018, 6, 48]} />
        <meshStandardMaterial color={T.feather} />
      </mesh>
    </group>
  )
}

/** Football: white sphere with 12 dark pentagon patches at the icosahedron vertices. */
export function Football({ quality = 'high' }: ObjectProps) {
  const dirs = useMemo(() => {
    const g = new IcosahedronGeometry(1, 0)
    const pos = g.getAttribute('position')
    const seen: Vector3[] = []
    for (let i = 0; i < pos.count; i++) {
      const v = new Vector3().fromBufferAttribute(pos, i).normalize()
      if (!seen.some((s) => s.distanceTo(v) < 0.01)) seen.push(v)
    }
    return seen
  }, [])
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[1, quality === 'low' ? 2 : 3]} />
        <meshPhysicalMaterial color={T.feather} roughness={0.42} clearcoat={0.6} flatShading={quality !== 'low'} />
      </mesh>
      {dirs.map((d, i) => (
        <PentagonPatch key={i} dir={d} />
      ))}
    </group>
  )
}
function PentagonPatch({ dir }: { dir: Vector3 }) {
  const ref = useRef<Group>(null)
  useLayoutEffect(() => {
    ref.current?.lookAt(dir.clone().multiplyScalar(3))
  }, [dir])
  return (
    <group ref={ref} position={dir.clone().multiplyScalar(1.004)}>
      <mesh>
        <circleGeometry args={[0.38, 5]} />
        <meshStandardMaterial color={T.carbon} roughness={0.5} side={DoubleSide} />
      </mesh>
    </group>
  )
}
