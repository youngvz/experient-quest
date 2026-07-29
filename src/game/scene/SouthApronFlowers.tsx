import { Instance, Instances, useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SOUTH_APRON } from '../constants/gameConstants'

const BASE = import.meta.env.BASE_URL

// Flower variant mix. Singles read as scattered stems, Groups as small
// clusters — using more Singles keeps the ground feeling like a garden
// rather than a bouquet field.
const VARIANTS = [
  { url: `${BASE}assets/props/Flower_3_Single.glb`, weight: 0.4, height: 0.22 },
  { url: `${BASE}assets/props/Flower_4_Single.glb`, weight: 0.4, height: 0.22 },
  { url: `${BASE}assets/props/Flower_3_Group.glb`, weight: 0.1, height: 0.3 },
  { url: `${BASE}assets/props/Flower_4_Group.glb`, weight: 0.1, height: 0.3 },
] as const

for (const v of VARIANTS) useGLTF.preload(v.url)

type Patch = { westX: number; eastX: number; northZ: number; southZ: number }
type Placement = { x: number; z: number; rotationY: number; scaleJitter: number }

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

// Bush centers (keep in sync with SouthApronBushes.tsx) — flowers avoid
// this radius so they don't clip into bush footprints.
const BUSH_CENTERS: [number, number][] = [
  [-18, 18.7], [-16.4, 18.7], [-14.8, 18.7], [-13.4, 18.7],
  [-6.0, 20.7], [-4.5, 20.7], [-3.0, 20.7], [-1.5, 20.7],
  [0.0, 20.7], [1.5, 20.7], [3.0, 20.7], [4.5, 20.7],
  [6.0, 20.7], [7.5, 20.7], [9.0, 20.7],
]
const BUSH_EXCLUDE_RADIUS = 0.45

function distanceToNearestBush(x: number, z: number): number {
  let best = Infinity
  for (const [bx, bz] of BUSH_CENTERS) {
    const d = Math.hypot(x - bx, z - bz)
    if (d < best) best = d
  }
  return best
}

// Distance from (x, z) into any grass patch (0 at patch edge, grows inward).
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

// Estimated grass density at (x, z) — mirrors the boost components in
// SouthApronGrass so we can invert it and put flower beds where grass is
// sparse instead of where it's already dense. Keep the constants below in
// sync with SouthApronGrass.tsx.
function grassDensityScore(x: number, z: number): number {
  const edgeDist = distanceToPatchEdge(x, z, SOUTH_APRON.grass)
  const edgeBoost = Math.max(0, 1 - edgeDist / 1.2) * 0.35
  const bushDist = distanceToNearestBush(x, z)
  const bushBoost = Math.max(0, 1 - (bushDist - 0.35) / 1.5) * 0.25
  const cluster =
    (Math.sin(x * 0.9 + z * 0.6) + Math.sin(x * 1.5 - z * 1.1)) * 0.15
  return edgeBoost + bushBoost + cluster
}

// Bed cluster noise (separate frequency from grass cluster noise so peaks
// don't align). Used only to group flowers into beds *within* grass-sparse
// zones — not to gate placement globally.
function bedNoise(x: number, z: number): number {
  const a = Math.sin(x * 0.55 + z * 0.35 + 1.7)
  const b = Math.sin(x * 0.4 - z * 0.5 + 3.2)
  return (a + b) * 0.5 // ∈ [-1, 1]
}

function scatterFlowers(): Placement[][] {
  const buckets: Placement[][] = VARIANTS.map(() => [])
  const samplesPerMeter = 2.5
  let seed = 8001
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
        if (distanceToNearestBush(x, z) < BUSH_EXCLUDE_RADIUS) continue

        // Flip the grass-density boost into a *penalty*: the more grass
        // this spot would attract, the fewer flowers land here. Sparse
        // grass zones (patch interiors, far from bushes, cluster troughs)
        // become natural bed sites.
        const grassScore = grassDensityScore(x, z)
        const sparsity = Math.max(0, 0.5 - grassScore) // higher = more open
        // Bed noise gathers flowers into loose clusters within the open
        // zones — remaps ∈ [-1, 1] to [0, 1] and multiplies by sparsity.
        const bed = (bedNoise(x, z) + 1) * 0.5
        const keep = sparsity * bed * 1.4
        if (rk > keep) continue

        // Variant pick by weight.
        const w = rv * totalWeight
        let variantIdx = 0
        while (variantIdx < cumWeights.length - 1 && w > cumWeights[variantIdx]) variantIdx++

        buckets[variantIdx].push({
          x,
          z,
          rotationY: rr * Math.PI * 2,
          scaleJitter: 0.85 + rs * 0.3,
        })
      }
    }
  }
  return buckets
}

// Flower GLBs contain multiple meshes (petals + leaves, sometimes stems),
// each with its own material and texture. Render one <Instances> block per
// child mesh, all sharing the same placements, so the full flower stacks
// at every scatter position.
function FlowerVariant({
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
    const parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = []
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      // Multi-material meshes rely on BufferGeometry.groups; splitting them
      // into per-material Instances would require geometry surgery. In
      // practice the Quaternius flower GLBs give us one mesh per material
      // via GLTFLoader, so treat any multi-material mesh as one entry
      // using its first material and let the default group render.
      parts.push({ geometry: mesh.geometry, material: mats[0] })
    })
    const box = new THREE.Box3().expandByObject(gltf.scene, true)
    const size = new THREE.Vector3()
    box.getSize(size)
    const scale = size.y > 0 ? targetHeight / size.y : 1
    const baseOffsetY = -box.min.y * scale
    return { parts, scale, baseOffsetY }
  }, [gltf.scene, targetHeight])

  if (fit.parts.length === 0 || placements.length === 0) return null

  return (
    <>
      {fit.parts.map((part, partIdx) => (
        <Instances
          key={partIdx}
          limit={placements.length}
          range={placements.length}
          geometry={part.geometry}
          material={part.material}
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
      ))}
    </>
  )
}

export function SouthApronFlowers() {
  const buckets = useMemo(() => scatterFlowers(), [])
  return (
    <>
      {VARIANTS.map((v, i) => (
        <FlowerVariant
          key={v.url}
          url={v.url}
          targetHeight={v.height}
          placements={buckets[i]}
        />
      ))}
    </>
  )
}
