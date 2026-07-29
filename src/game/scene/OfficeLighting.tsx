import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { DirectionalLight } from 'three'
import { PLAYER_SPAWN } from '../constants/gameConstants'

// Offset from the player where the shadow-caster sits. A steep-ish angle
// keeps shadows readable without stretching them across the whole frustum.
const LIGHT_OFFSET: [number, number, number] = [6, 10, 4]
// How far the target lags behind the player before we snap. Small lerp
// avoids visible shadow-map jitter frame-to-frame; the tiny snap threshold
// still catches the player teleporting on respawn without a rubber-band.
const FOLLOW_LERP = 8

// Directional light + target that follow the player, so the 24×20 m
// shadow frustum always contains the area actually on-camera. Before this
// the frustum was fixed near the conference room — anything north of the
// corridor pocket rendered without shadows AND still ran through the
// shadow shader for the meshes that were inside, wasting fill.
function FollowShadowLight() {
  const lightRef = useRef<DirectionalLight | null>(null)
  useFrame((state, delta) => {
    const light = lightRef.current
    if (!light) return
    // three.js `Object3D.getWorldPosition` allocates; grab camera XZ via
    // scene traversal instead. The main camera is what the polar-orbit
    // controller in Player.tsx moves — its position tracks the player
    // (offset by CAMERA_DISTANCE), so following the camera gives us the
    // right area at zero coupling cost.
    const cam = state.camera
    // Aim ~2 m ahead of the camera on the ground plane. The camera sits
    // roughly south of the player looking north, so the target lands
    // near the player's feet.
    const targetX = cam.position.x
    const targetZ = cam.position.z - 4
    const t = 1 - Math.exp(-delta * FOLLOW_LERP)
    light.target.position.x += (targetX - light.target.position.x) * t
    light.target.position.z += (targetZ - light.target.position.z) * t
    light.target.updateMatrixWorld()
    light.position.set(
      light.target.position.x + LIGHT_OFFSET[0],
      LIGHT_OFFSET[1],
      light.target.position.z + LIGHT_OFFSET[2],
    )
  })
  return (
    <directionalLight
      ref={lightRef}
      position={[
        PLAYER_SPAWN[0] + LIGHT_OFFSET[0],
        LIGHT_OFFSET[1],
        PLAYER_SPAWN[2] + LIGHT_OFFSET[2],
      ]}
      intensity={0.6}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-12}
      shadow-camera-right={12}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
    />
  )
}

export function OfficeLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <FollowShadowLight />
      <hemisphereLight args={['#c9a680', '#1a1d24', 0.5]} />
    </>
  )
}
