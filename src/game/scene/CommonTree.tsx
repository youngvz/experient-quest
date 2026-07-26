import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import * as THREE from 'three'

const BASE = import.meta.env.BASE_URL
const TREE_URL = `${BASE}assets/props/CommonTree_1.glb`

useGLTF.preload(TREE_URL)

// Single instance of the CommonTree_1 GLB. Auto-fits to `targetHeight`
// off its own bounding box so callers don't need to know the source
// scale. Wrapped in a small trunk-cylinder collider so the player can't
// walk through it; the canopy is cosmetic.
export function CommonTree({
  position,
  rotationY = 0,
  targetHeight = 5.5,
}: {
  position: [number, number]
  rotationY?: number
  targetHeight?: number
}) {
  const [x, z] = position
  const gltf = useGLTF(TREE_URL)

  const fit = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().expandByObject(scene, true)
    const size = new THREE.Vector3()
    box.getSize(size)
    const scale = size.y > 0 ? targetHeight / size.y : 1
    // Plant the base of the bounding box on y=0.
    const yOffset = -box.min.y * scale
    return { scene, scale, yOffset }
  }, [gltf.scene, targetHeight])

  const trunkRadius = 0.28
  const trunkHalfHeight = targetHeight * 0.4

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        args={[trunkRadius, trunkHalfHeight, trunkRadius]}
        position={[x, trunkHalfHeight, z]}
      />
      <group
        position={[x, fit.yOffset, z]}
        rotation={[0, rotationY, 0]}
        scale={[fit.scale, fit.scale, fit.scale]}
      >
        <primitive object={fit.scene} />
      </group>
    </RigidBody>
  )
}
