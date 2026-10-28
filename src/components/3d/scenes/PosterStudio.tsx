import { forwardRef, useImperativeHandle, useRef } from 'react'
import { OrbitControls, Float } from '@react-three/drei'
import { Image } from 'lucide-react'
import type { WebGLRenderer } from 'three'
import SceneCanvas from '../perf/SceneCanvas'
import { NightLights } from '../Lighting'
import { Court } from '../objects/Court'
import { Paddle, PickleballBall } from '../objects/Equipment'
import { Trophy } from '../objects/Awards'
import { Fallback3D } from '../perf/Fallback3D'
import type { PosterTemplate } from '../../../lib/poster'

export interface PosterStudioHandle {
  /** Current frame as a canvas, for PNG export. */
  capture: () => HTMLCanvasElement | null
}

/** S14: a rotatable 3D scene behind the poster text. preserveDrawingBuffer keeps frames exportable. */
const PosterStudio = forwardRef<PosterStudioHandle, { template: PosterTemplate; accent: string; className?: string }>(function PosterStudio({ template, accent, className }, ref) {
  const gl = useRef<WebGLRenderer | null>(null)
  useImperativeHandle(ref, () => ({ capture: () => gl.current?.domElement ?? null }))
  return (
    <SceneCanvas className={className} camera={{ position: [3.4, 3, 4.4], fov: 34 }} gl={{ preserveDrawingBuffer: true }} onCreated={(s) => (gl.current = s.gl)} fallback={<Fallback3D icon={Image} />}>
      <NightLights shadows={false} intensity={1.1} />
      <group scale={0.1}>
        <Court glowLines accent={accent} />
      </group>
      {template === 'champions' ? (
        <group position={[0, 0.2, 0]} scale={0.45}><Trophy fill={1} accent={accent} shine /></group>
      ) : (
        <Float speed={0} floatIntensity={0.4}>
          <group position={[-0.7, 0.3, 0.7]} rotation={[-0.4, 0.6, -0.4]} scale={1.25}><Paddle accent={accent} /></group>
          <group position={[0.4, 0.95, 0.4]} scale={0.12}><PickleballBall /></group>
        </Float>
      )}
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.4} maxPolarAngle={1.35} />
    </SceneCanvas>
  )
})
export default PosterStudio
