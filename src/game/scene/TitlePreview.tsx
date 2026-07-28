import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from 'three'

// Cinematic dolly-in from south of the building. Bakery center is
// (0, 0, 13.5); we sit outside the south glass and drift toward it so
// both the storefront and the outdoor apron read as one shot. Ease is
// applied per-frame so the movement never fully settles — reads alive.
const CAMERA_START: [number, number, number] = [-9, 7.5, 25]
const CAMERA_END: [number, number, number] = [-4.5, 4.8, 19]
const LOOK_TARGET: [number, number, number] = [0, 1.2, 13.5]
const DOLLY_DURATION_S = 14

// Coarse-pointer devices (phones / small tablets) start at a wider FOV
// so the same shot fits the whole storefront on portrait viewports —
// otherwise the title reads as an extreme close-up on the bakery glass.
const FOV_DEFAULT = 45
const FOV_COARSE = 62

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(pointer: coarse)').matches ?? false
}

function easeOutCubic(t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  const inv = 1 - clamped
  return 1 - inv * inv * inv
}

function CinematicCamera() {
  const ref = useRef<ThreePerspectiveCamera>(null)
  const elapsed = useRef(0)
  const target = useRef(new Vector3(...LOOK_TARGET))
  const fov = isCoarsePointer() ? FOV_COARSE : FOV_DEFAULT

  useFrame((_, delta) => {
    const cam = ref.current
    if (!cam) return
    elapsed.current += delta
    const t = easeOutCubic(elapsed.current / DOLLY_DURATION_S)
    cam.position.set(
      CAMERA_START[0] + (CAMERA_END[0] - CAMERA_START[0]) * t,
      CAMERA_START[1] + (CAMERA_END[1] - CAMERA_START[1]) * t,
      CAMERA_START[2] + (CAMERA_END[2] - CAMERA_START[2]) * t,
    )
    cam.lookAt(target.current)
  })

  return (
    <PerspectiveCamera
      ref={ref}
      makeDefault
      position={CAMERA_START}
      fov={fov}
      near={0.1}
      far={200}
    />
  )
}

// Camera-only overlay for the title phase. The real world geometry
// (bakery, conference, apron, NPCs) is mounted by OfficeScene from the
// first frame — this component just installs a cinematic camera and
// supplemental fill lights so the shot reads bright and clean.
// OfficeWorld reads phase internally to keep Physics paused, Player
// unmounted, and non-visible NPC preloads deferred during the title.
export function TitlePreview() {
  return (
    <>
      {/* Title-only fill lights on top of OfficeLighting so the bakery
          interior and the exterior apron read properly through the south
          glass. Gameplay lighting stays untouched — during 'playing' this
          component unmounts and these lights go with it. */}
      <ambientLight intensity={1.4} />
      <directionalLight position={[-6, 14, 22]} intensity={1.2} />
      <directionalLight position={[6, 10, -4]} intensity={0.5} />
      <CinematicCamera />
    </>
  )
}
