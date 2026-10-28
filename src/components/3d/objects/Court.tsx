import { useMemo } from 'react'
import { Shape, ShapeGeometry } from 'three'
import { T } from '../palette'

export interface ObjectProps {
  accent?: string
  highlight?: boolean
  interactive?: boolean
  quality?: 'high' | 'medium' | 'low'
}

/**
 * Pickleball court in feet: 20 x 44, kitchen 7 ft each side of the net,
 * net 36 in at the posts and 34 in at the centre. Badminton uses the same footprint
 * (20 x 44 doubles court) with its own line layout and a green floor.
 */
export function Court({
  sport = 'pickleball',
  glowLines = false,
  lineGlow = 1,
  accent,
  showNet = true,
  apron = true,
  floorColor,
  kitchenColor,
}: ObjectProps & { sport?: 'pickleball' | 'badminton'; glowLines?: boolean; lineGlow?: number; showNet?: boolean; apron?: boolean; floorColor?: string; kitchenColor?: string }) {
  const W = 20
  const L = 44
  const lw = 0.25
  const glow = accent ?? T.brand
  const lineMat = glowLines ? (
    <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.8 * lineGlow} toneMapped={false} />
  ) : (
    <meshStandardMaterial color={T.courtLine} roughness={0.6} />
  )
  const lines: [number, number, number, number][] = useMemo(() => {
    // [x, z, width(x), length(z)]
    const out: [number, number, number, number][] = [
      [0, -L / 2, W + lw, lw],
      [0, L / 2, W + lw, lw],
      [-W / 2, 0, lw, L],
      [W / 2, 0, lw, L],
    ]
    if (sport === 'pickleball') {
      out.push([0, -7, W, lw], [0, 7, W, lw], [0, -(7 + (L / 2 - 7) / 2), lw, L / 2 - 7], [0, 7 + (L / 2 - 7) / 2, lw, L / 2 - 7])
    } else {
      // Badminton: short service lines at 6.5 ft, doubles long service 2.5 ft inside baseline, singles sidelines 1.5 ft in.
      out.push([0, -6.5, W, lw], [0, 6.5, W, lw], [0, -(L / 2 - 2.5), W, lw], [0, L / 2 - 2.5, W, lw])
      out.push([-W / 2 + 1.5, 0, lw, L], [W / 2 - 1.5, 0, lw, L])
      out.push([0, -(6.5 + (L / 2 - 6.5) / 2), lw, L / 2 - 6.5], [0, 6.5 + (L / 2 - 6.5) / 2, lw, L / 2 - 6.5])
    }
    return out
  }, [sport])
  const netGeo = useMemo(() => {
    // Net sags from 36 in at the posts to 34 in in the middle.
    const half = W / 2 + 1
    const s = new Shape()
    s.moveTo(-half, 0)
    s.lineTo(-half, 3)
    s.quadraticCurveTo(0, 2.66, half, 3)
    s.lineTo(half, 0)
    s.lineTo(-half, 0)
    return new ShapeGeometry(s, 16)
  }, [])
  const floor = floorColor ?? (sport === 'badminton' ? T.badminton : T.courtSurface)
  return (
    <group>
      {apron && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[W + 20, L + 24]} />
          <meshStandardMaterial color={T.courtApron} roughness={0.9} />
        </mesh>
      )}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={floor} roughness={0.75} />
      </mesh>
      {sport === 'pickleball' && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
          <planeGeometry args={[W, 14]} />
          <meshStandardMaterial color={kitchenColor ?? T.courtKitchen} roughness={0.75} />
        </mesh>
      )}
      {lines.map(([x, z, w, l], i) => (
        <mesh key={i} position={[x, 0.02, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[w, l]} />
          {lineMat}
        </mesh>
      ))}
      {showNet && (
        <group>
          <mesh geometry={netGeo} position={[0, 0, 0]}>
            <meshStandardMaterial color={T.carbon} transparent opacity={0.72} side={2} roughness={0.9} />
          </mesh>
          {/* white tape along the top */}
          <mesh position={[0, 2.86, 0]}>
            <boxGeometry args={[W + 2, 0.22, 0.12]} />
            <meshStandardMaterial color={T.courtLine} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * (W / 2 + 1), 1.55, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 3.1, 12]} />
              <meshStandardMaterial color={T.carbon} metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
