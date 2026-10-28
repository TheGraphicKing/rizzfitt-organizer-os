import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { T } from './palette'

/**
 * Night Court lighting: warm key top-left, cool rim behind, orange floor bounce.
 * Environment is built from Lightformers (no HDR download).
 */
export function NightLights({ intensity = 1, shadows = true, shadowY = -1.2, shadowScale = 8, envResolution = 128 }: { intensity?: number; shadows?: boolean; shadowY?: number; shadowScale?: number; envResolution?: number }) {
  return (
    <>
      <ambientLight intensity={0.25 * intensity} />
      <directionalLight position={[-4, 6, 4]} intensity={1.6 * intensity} color={T.lightKey} />
      <directionalLight position={[3, 2, -5]} intensity={0.9 * intensity} color={T.lightRim} />
      <pointLight position={[0, -2, 2]} intensity={0.8 * intensity} color={T.brand} distance={10} />
      <Environment resolution={envResolution} frames={1}>
        <Lightformer form="rect" intensity={2.4} color={T.lightKeySoft} position={[-5, 5, 3]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color={T.lightRimSoft} position={[4, 2, -6]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} color={T.brand} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="ring" intensity={1} color={T.white} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={3} />
      </Environment>
      {shadows && <ContactShadows position={[0, shadowY, 0]} opacity={0.55} scale={shadowScale} blur={2.4} far={4} resolution={256} color={T.shadow} />}
    </>
  )
}
