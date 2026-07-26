import { Bush } from './Bush'

const BASE = import.meta.env.BASE_URL

const BUSH_URL = `${BASE}assets/props/Bush_Common_Flowers.glb`

// Deterministic pseudo-random so the same variant/rotation lands in the
// same spot on every load. Seeded per-bush by its integer index.
function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

// Row of bushes hugging the south face of the building. Z anchors are
// slightly south of each wall so bushes sit *in front of* the wall on
// grass, not clipping through it:
//   TheCommons south wall at Z=+18 → bushes at Z ≈ 18.7
//   Bakery south wall at Z=+20    → bushes at Z ≈ 20.7
// The stretch X ∈ [-13, -6.5] at Z=20.7 is skipped entirely — that's
// where the corridor door-apron sidewalk covers the ground.
const BUSH_ROW: { x: number; z: number }[] = [
  // TheCommons south wall (Z=+18, X ∈ [-19, -13]) — 4 bushes evenly spaced
  { x: -18, z: 18.7 },
  { x: -16.4, z: 18.7 },
  { x: -14.8, z: 18.7 },
  { x: -13.4, z: 18.7 },
  // Bakery south wall (Z=+20, X ∈ [-6, +10]) — sidewalk apron blocks the
  // western stretch; door at X ∈ [-8.5, -6.5] is skipped by starting at -6
  { x: -6.0, z: 20.7 },
  { x: -4.5, z: 20.7 },
  { x: -3.0, z: 20.7 },
  { x: -1.5, z: 20.7 },
  { x: 0.0, z: 20.7 },
  { x: 1.5, z: 20.7 },
  { x: 3.0, z: 20.7 },
  { x: 4.5, z: 20.7 },
  { x: 6.0, z: 20.7 },
  { x: 7.5, z: 20.7 },
  { x: 9.0, z: 20.7 },
]

export function SouthApronBushes() {
  return (
    <>
      {BUSH_ROW.map((slot, i) => {
        const rotationY = hash(i + 101) * Math.PI * 2
        const height = 0.8 + hash(i + 201) * 0.35
        return (
          <Bush
            key={`bush-${i}`}
            url={BUSH_URL}
            position={[slot.x, 0, slot.z]}
            rotationY={rotationY}
            height={height}
          />
        )
      })}
    </>
  )
}
