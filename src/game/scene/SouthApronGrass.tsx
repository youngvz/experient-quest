import { Instance, Instances, useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SOUTH_APRON } from '../constants/gameConstants'

const BASE = import.meta.env.BASE_URL

// Variant mix (probability weights). Total should sum to ~1. Short grass
// dominates; occasional tall commons add height without the yellow wispy
// silhouette. Grass_Wispy_Tall dropped — reads as sun-bleached in this
// palette.
const VARIANTS = [
  { url: `${BASE}assets/props/Grass_Common_Short.glb`, weight: 0.6, height: 0.22 },
  { url: `${BASE}assets/props/Grass_Wispy_Short.glb`, weight: 0.25, height: 0.28 },
  { url: `${BASE}assets/props/Grass_Common_Tall.glb`, weight: 0.15, height: 0.42 },
] as const

// Tint applied to every grass clump material — a subtle green pull that
// takes the warm-yellow edge off the Quaternius texture without flattening
// its highlights or crushing the per-blade variation.
const GRASS_TINT = new THREE.Color('#c8dab5')

for (const v of VARIANTS) useGLTF.preload(v.url)

type Patch = { westX: number; eastX: number; northZ: number; southZ: number }
type Placement = {
  x: number
  z: number
  rotationY: number
  scaleJitter: number
}

// Deterministic pseudo-random — grass positions don't jitter between reloads.
function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

function isOnSidewalk(x: number, z: number, sidewalks: readonly Patch[]): boolean {
  for (const s of sidewalks) {
    if (x >= s.westX && x <= s.eastX && z >= s.northZ && z <= s.southZ) return true
  }
  return false
}

// Bush centers (kept in sync with SouthApronBushes.tsx). Grass is thinned
// out inside this radius so clumps don't visibly clip into bush footprints.
const BUSH_CENTERS: [number, number][] = [
  [-18, 18.7], [-16.4, 18.7], [-14.8, 18.7], [-13.4, 18.7],
  [-6.0, 20.7], [-4.5, 20.7], [-3.0, 20.7], [-1.5, 20.7],
  [0.0, 20.7], [1.5, 20.7], [3.0, 20.7], [4.5, 20.7],
  [6.0, 20.7], [7.5, 20.7], [9.0, 20.7],
]
const BUSH_EXCLUDE_RADIUS = 0.35

// Distance from (x, z) to the nearest edge of any grass patch. Used to
// bias density toward patch borders so the ground reads as landscaped.
function distanceToPatchEdge(x: number, z: number, patches: readonly Patch[]): number {
  let best = Infinity
  for (const p of patches) {
    if (x >= p.westX && x <= p.eastX && z >= p.northZ && z <= p.southZ) {
      const d = Math.min(x - p.westX, p.eastX - x, z - p.northZ, p.southZ - z)
      if (d < best) best = d
    }
  }
  return best
}

// Distance to nearest bush center — used to boost density *near* bushes
// (except within the exclude radius), so grass gathers around them
// instead of an even sprinkle.
function distanceToNearestBush(x: number, z: number): number {
  let best = Infinity
  for (const [bx, bz] of BUSH_CENTERS) {
    const d = Math.hypot(x - bx, z - bz)
    if (d < best) best = d
  }
  return best
}

// Scatter placements across the grass patches with clustering + edge weight.
// Returns one bucket per VARIANTS entry so each bucket can render as its
// own <Instances> block.
function scatterGrass(): Placement[][] {
  const buckets: Placement[][] = VARIANTS.map(() => [])
  const samplesPerMeter = 3.25 // ~10.5 candidates per m²
  let seed = 4001
  const cumWeights: number[] = []
  {
    let cum = 0
    for (const v of VARIANTS) {
      cum += v.weight
      cumWeights.push(cum)
    }
  }
  const totalWeight = cumWeights[cumWeights.length - 1]

  for (const patch of SOUTH_APRON.grass) {
    const width = patch.eastX - patch.westX
    const depth = patch.southZ - patch.northZ
    const cols = Math.round(width * samplesPerMeter)
    const rows = Math.round(depth * samplesPerMeter)
    const cellW = width / cols
    const cellD = depth / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rx = hash(seed++)
        const rz = hash(seed++)
        const rr = hash(seed++)
        const rs = hash(seed++)
        const rk = hash(seed++)
        const rv = hash(seed++)
        const x = patch.westX + (c + 0.15 + rx * 0.7) * cellW
        const z = patch.northZ + (r + 0.15 + rz * 0.7) * cellD

        if (isOnSidewalk(x, z, SOUTH_APRON.sidewalk)) continue
        const bushDist = distanceToNearestBush(x, z)
        if (bushDist < BUSH_EXCLUDE_RADIUS) continue

        // Base keep rate — moderate density everywhere.
        let keep = 0.48
        // Boost near patch edges (within 1.2 m).
        const edgeDist = distanceToPatchEdge(x, z, SOUTH_APRON.grass)
        keep += Math.max(0, 1 - edgeDist / 1.2) * 0.35
        // Boost near bushes (within 1.5 m, outside the exclude radius).
        keep += Math.max(0, 1 - (bushDist - BUSH_EXCLUDE_RADIUS) / 1.5) * 0.25
        // Low-frequency cluster noise so clumps still group naturally.
        const cluster = (Math.sin(x * 0.9 + z * 0.6) + Math.sin(x * 1.5 - z * 1.1)) * 0.15
        keep += cluster
        if (rk > keep) continue

        // Pick a variant by weight.
        const w = rv * totalWeight
        let variantIdx = 0
        while (variantIdx < cumWeights.length - 1 && w > cumWeights[variantIdx]) variantIdx++

        buckets[variantIdx].push({
          x,
          z,
          rotationY: rr * Math.PI * 2,
          scaleJitter: 0.85 + rs * 0.3, // 0.85–1.15
        })
      }
    }
  }
  return buckets
}

// Instance a single grass GLB variant. Extracts the first mesh's geometry
// and material from the GLB (Quaternius grass files are single-mesh). Auto-
// fits to `targetHeight`, base flush with y=0.
function GrassVariant({
  url,
  targetHeight,
  placements,
}: {
  url: string
  targetHeight: number
  placements: Placement[]
}) {
  const gltf = useGLTF(url)

  const fit = useMemo(() => {
    let geometry: THREE.BufferGeometry | undefined
    let material: THREE.Material | undefined
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || geometry) return
      geometry = mesh.geometry
      const srcMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      // Clone so the .color mutation doesn't retint the cached GLB material
      // (which is shared across every consumer of useGLTF for this URL).
      const cloned = srcMat.clone() as THREE.MeshStandardMaterial
      if (cloned.color) cloned.color.multiply(GRASS_TINT)
      material = cloned
    })
    const box = new THREE.Box3().expandByObject(gltf.scene, true)
    const size = new THREE.Vector3()
    box.getSize(size)
    const scale = size.y > 0 ? targetHeight / size.y : 1
    const baseOffsetY = -box.min.y * scale
    return { geometry, material, scale, baseOffsetY }
  }, [gltf.scene, targetHeight])

  if (!fit.geometry || !fit.material || placements.length === 0) return null

  return (
    <Instances
      limit={placements.length}
      range={placements.length}
      geometry={fit.geometry}
      material={fit.material}
      castShadow
      receiveShadow
    >
      {placements.map((p, i) => {
        const s = fit.scale * p.scaleJitter
        return (
          <Instance
            key={i}
            position={[p.x, fit.baseOffsetY, p.z]}
            rotation={[0, p.rotationY, 0]}
            scale={[s, s, s]}
          />
        )
      })}
    </Instances>
  )
}

export function SouthApronGrass() {
  const buckets = useMemo(() => scatterGrass(), [])
  return (
    <>
      {VARIANTS.map((v, i) => (
        <GrassVariant
          key={v.url}
          url={v.url}
          targetHeight={v.height}
          placements={buckets[i]}
        />
      ))}
    </>
  )
}
