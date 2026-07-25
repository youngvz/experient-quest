import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import type { Group, Material, Mesh } from 'three'

interface FadeInProps {
  children: ReactNode
  // Fade duration in seconds. 0.35s reads as smooth without noticeably
  // delaying the arrival of props the player is walking toward.
  duration?: number
}

// Wraps a scene subtree and ramps every material's opacity from 0 → 1
// over `duration` seconds after mount. Used to soften the visual pop
// when a lazily-loaded room chunk finishes parsing and mounts into
// view. Once the fade completes we restore each material's original
// `transparent` flag so we don't pay the transparent-sort cost forever.
//
// Assumes the subtree's meshes use materials with an `opacity` property
// (all our meshStandardMaterial / meshBasicMaterial props qualify).
// Glass panels are already transparent — this just briefly lowers their
// opacity further, which reads fine.
export function FadeIn({ children, duration = 0.35 }: FadeInProps) {
  const groupRef = useRef<Group>(null)
  const elapsed = useRef(0)
  const done = useRef(false)
  // Captured on the first frame: [material, originalOpacity, originalTransparent]
  const captured = useRef<Array<[Material, number, boolean]> | null>(null)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || done.current) return

    if (captured.current === null) {
      const list: Array<[Material, number, boolean]> = []
      const seen = new Set<Material>()
      group.traverse((obj) => {
        const mesh = obj as Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) {
          if (!m || seen.has(m)) continue
          seen.add(m)
          list.push([m, m.opacity, m.transparent])
          m.transparent = true
          m.opacity = 0
          m.depthWrite = false
        }
      })
      captured.current = list
    }

    elapsed.current += delta
    const t = Math.min(1, elapsed.current / duration)
    for (const entry of captured.current) {
      const [mat, originalOpacity] = entry
      mat.opacity = originalOpacity * t
    }

    if (t >= 1) {
      for (const entry of captured.current) {
        const [mat, originalOpacity, originalTransparent] = entry
        mat.opacity = originalOpacity
        mat.transparent = originalTransparent
        mat.depthWrite = !originalTransparent
      }
      captured.current = null
      done.current = true
    }
  })

  return <group ref={groupRef}>{children}</group>
}
