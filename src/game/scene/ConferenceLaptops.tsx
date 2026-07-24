import { CONFERENCE_TABLE } from '../constants/gameConstants'
import { Laptop } from './Laptop'

// A handful of laptops on the north side of the conference table — the side
// closest to the whiteboard. Positions are picked to look like a partial
// meeting-in-progress rather than one laptop per seat.
export function ConferenceLaptops() {
  const tableTopY = CONFERENCE_TABLE.size[1]
  // Chairs sit at Z = ±2.55. Laptops rest on the table edge in front of the
  // sitter, screen facing them:
  //   north side (chair faces +Z, sitter looks south) → laptop at Z ≈ -1.5, rot ≈ PI
  //   south side (chair faces -Z, sitter looks north) → laptop at Z ≈ +1.5, rot ≈ 0
  const placements: { x: number; z: number; rot: number }[] = [
    // north side — 2 laptops
    { x: -2.2, z: -1.45, rot: Math.PI + 0.15 },
    { x: 3.4, z: -1.35, rot: Math.PI - 0.2 },
    // south side — 4 laptops
    { x: -4.0, z: 1.5, rot: 0.1 },
    { x: -1.6, z: 1.4, rot: -0.18 },
    { x: 1.3, z: 1.55, rot: 0.22 },
    { x: 3.8, z: 1.4, rot: -0.12 },
  ]

  return (
    <>
      {placements.map((p, i) => (
        <Laptop
          key={i}
          position={[p.x, p.z]}
          deskTopY={tableTopY}
          rotationY={p.rot}
          scale={1.25}
        />
      ))}
    </>
  )
}
