import { useAnimations, useGLTF } from '@react-three/drei'
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { PLAYER_HEIGHT, PLAYER_RADIUS } from '../constants/gameConstants'

interface EmployeeProps {
  url: string
  position: [number, number, number]
  // Rotation around Y (radians). 0 = facing +Z (south).
  rotationY?: number
  // Auto-fit target height. Defaults to PLAYER_HEIGHT so NPCs match the player.
  height?: number
  // Which animation clip to loop. First matching regex wins; falls back to
  // the first clip in the GLB if none match. Defaults to idle/stand/breath.
  clipPatterns?: RegExp[]
}

// Static NPC: loads a GLB, autofits its height, plays the first idle-like
// animation clip if one exists, and stands as a fixed collider so the player
// bumps into them instead of walking through.
const DEFAULT_CLIP_PATTERNS: RegExp[] = [/idle/i, /stand/i, /breath/i]

export function Employee({
  url,
  position,
  rotationY = 0,
  height = PLAYER_HEIGHT,
  clipPatterns = DEFAULT_CLIP_PATTERNS,
}: EmployeeProps) {
  const gltf = useGLTF(url)

  const fit = useMemo(() => {
    // SkeletonUtils.clone rebinds skinned meshes so multiple Employee
    // instances of the same GLB don't share a skeleton.
    const clone = SkeletonUtils.clone(gltf.scene)
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = false
        // See Player.tsx — SkinnedMesh's frustum culling can drop
        // outlying meshes (hair, hands) mid-animation.
        if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) mesh.frustumCulled = false
      }
    })
    clone.updateWorldMatrix(true, true)

    // Walk each mesh with Box3.expandByObject(precise=true) — reads
    // vertices via BufferAttribute.getX/Y/Z (so KHR_mesh_quantization /
    // EXT_meshopt_compression's normalized int16 POSITION accessors
    // decode correctly) and, on SkinnedMesh, applies bone transforms so
    // the AABB reflects the skinned mesh's real world-space extent
    // instead of the [-1, +1] pre-skinning quantization envelope.
    const box = new THREE.Box3()
    const meshBox = new THREE.Box3()
    let hasMesh = false
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry) return
      meshBox.makeEmpty().expandByObject(mesh, true)
      if (meshBox.isEmpty()) return
      if (hasMesh) box.union(meshBox)
      else {
        box.copy(meshBox)
        hasMesh = true
      }
    })

    const size = new THREE.Vector3()
    box.getSize(size)
    const scale = hasMesh && size.y > 0 ? height / size.y : 1
    // Sit the model on the floor (RigidBody origin is at capsule center = height/2).
    const offsetY = hasMesh ? -box.min.y * scale - height / 2 : 0
    return { object: clone, scale, offsetY }
  }, [gltf.scene, height])

  const { actions, names } = useAnimations(gltf.animations, fit.object)
  useEffect(() => {
    if (names.length === 0) return
    let picked: string | undefined
    for (const re of clipPatterns) {
      picked = names.find((n) => re.test(n))
      if (picked) break
    }
    const clipName = picked ?? names[0]
    const clip = clipName ? actions[clipName] : null
    clip?.reset().setEffectiveWeight(1).play()
    return () => {
      clip?.stop()
    }
  }, [actions, names, clipPatterns])

  // Lift the RigidBody so the capsule's bottom (local y = -height/2) sits on
  // the floor. Callers pass a floor-level y — same convention as the
  // presentation-stop positions.
  const rbPosition: [number, number, number] = [
    position[0],
    position[1] + height / 2 + 0.05,
    position[2],
  ]

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={rbPosition}
      rotation={[0, rotationY, 0]}
    >
      <CapsuleCollider
        args={[Math.max(0.05, height / 2 - PLAYER_RADIUS), PLAYER_RADIUS]}
      />
      <primitive
        object={fit.object}
        scale={fit.scale}
        position={[0, fit.offsetY, 0]}
      />
    </RigidBody>
  )
}
