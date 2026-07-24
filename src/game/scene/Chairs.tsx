import { CHAIR, COLORS, CONFERENCE_TABLE } from '../constants/gameConstants'

// Chairs are ghostable — visuals only, no RigidBody. The player can walk through them.
// Shape reads as an "L" from the side: thick seat + thin back at the rear edge.
// The chair's local +Z faces the table (rotated in world by `facing`).
export function Chairs() {
  const tableCenterY = CONFERENCE_TABLE.center[1]
  const tableHalfW = CONFERENCE_TABLE.size[0] / 2
  const tableHalfD = CONFERENCE_TABLE.size[2] / 2

  const { seat, back, leg } = CHAIR
  const seatCenterY = seat.topY - seat.thickness / 2
  const backZ = -seat.depth / 2 + back.depth / 2
  const backCenterY = back.topY - back.height / 2

  const legHeight = seat.topY - seat.thickness
  const legCenterY = legHeight / 2
  const legX = seat.width / 2 - leg.inset - leg.thickness / 2
  const legZ = seat.depth / 2 - leg.inset - leg.thickness / 2
  const legOffsets: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ]

  return (
    <>
      {CHAIR.positions.map(([x, z], i) => {
        const dx = x < -tableHalfW ? 1 : x > tableHalfW ? -1 : 0
        const dz = z < -tableHalfD ? 1 : z > tableHalfD ? -1 : 0
        const facing = Math.atan2(dx, dz)

        return (
          <group key={i} position={[x, tableCenterY, z]} rotation={[0, facing, 0]}>
            <mesh castShadow receiveShadow position={[0, seatCenterY, 0]}>
              <boxGeometry args={[seat.width, seat.thickness, seat.depth]} />
              <meshStandardMaterial color={COLORS.chair} roughness={0.7} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, backCenterY, backZ]}>
              <boxGeometry args={[back.width, back.height, back.depth]} />
              <meshStandardMaterial color={COLORS.chair} roughness={0.7} />
            </mesh>
            {legOffsets.map(([lx, lz], j) => (
              <mesh key={`leg-${j}`} castShadow position={[lx, legCenterY, lz]}>
                <boxGeometry args={[leg.thickness, legHeight, leg.thickness]} />
                <meshStandardMaterial color={COLORS.chair} roughness={0.7} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}
