import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from 'three'

// Slow 360° interior pan. Camera sits at a fixed point in the middle of
// the bakery's open floor at eye height; only the look-target orbits
// around a small horizontal circle around that same point, so the shot
// reads as "standing still and turning your head" — no parallax, no
// wall clipping. Full revolution takes ORBIT_PERIOD_S; well under the
// ~30°/s VR-comfort threshold, so it should never feel disorienting.
const CAMERA_POSITION: [number, number, number] = [0, 1.65, 13.5]
const ORBIT_PERIOD_S = 45
// Radius the look-target sweeps around the camera. Small — just enough
// to give the gaze a defined focal distance instead of a mathematically
// pure yaw pivot.
const LOOK_RADIUS = 4
// Start facing roughly toward the west desk cluster so the first frame
// isn't staring at a blank wall.
const START_ANGLE = Math.PI * 1.15

// Coarse-pointer devices (phones / small tablets) use a wider FOV so
// the pan captures more of the room per glance on portrait viewports.
const FOV_DEFAULT = 55
const FOV_COARSE = 72

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(pointer: coarse)').matches ?? false
}

function CinematicCamera() {
  const ref = useRef<ThreePerspectiveCamera>(null)
  const elapsed = useRef(0)
  const target = useRef(new Vector3())
  const fov = isCoarsePointer() ? FOV_COARSE : FOV_DEFAULT

  useFrame((_, delta) => {
    const cam = ref.current
    if (!cam) return
    elapsed.current += delta
    const angle =
      START_ANGLE + (elapsed.current / ORBIT_PERIOD_S) * Math.PI * 2
    target.current.set(
      CAMERA_POSITION[0] + Math.sin(angle) * LOOK_RADIUS,
      CAMERA_POSITION[1],
      CAMERA_POSITION[2] + Math.cos(angle) * LOOK_RADIUS,
    )
    cam.lookAt(target.current)
  })

  return (
    <PerspectiveCamera
      ref={ref}
      makeDefault
      position={CAMERA_POSITION}
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
