import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

interface BushProps {
  url: string
  position: [number, number, number]
  // Rotation around Y (radians).
  rotationY?: number
  // Auto-fit target height. Bushes vary; ~0.8–1.1 m reads well against the
  // 3 m walls without dominating the sightline.
  height?: number
}

// Static outdoor decor: loads a bush GLB, auto-fits to a target height, and
// plants it on the floor. No physics collider — bushes are passive decoration
// so the player can brush through the edges if the placement is slightly off.
// Mirrors the Employee auto-fit approach (Box3.expandByObject with precise=true
// so Meshopt-quantized POSITION accessors decode correctly).
export function Bush({ url, position, rotationY = 0, height = 0.9 }: BushProps) {
  const gltf = useGLTF(url)

  const fit = useMemo(() => {
    const clone = SkeletonUtils.clone(gltf.scene)
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = true
    })
    clone.updateWorldMatrix(true, true)

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
    // Sit the bush's base on the floor.
    const offsetY = hasMesh ? -box.min.y * scale : 0
    return { object: clone, scale, offsetY }
  }, [gltf.scene, height])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group position={[0, fit.offsetY, 0]} scale={fit.scale}>
        <primitive object={fit.object} />
      </group>
    </group>
  )
}

const BASE = import.meta.env.BASE_URL
useGLTF.preload(`${BASE}assets/props/Bush_Common_Flowers.glb`)
