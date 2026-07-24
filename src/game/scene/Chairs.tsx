import { CHAIR, COLORS, CONFERENCE_TABLE } from '../constants/gameConstants'

// A single ghostable chair. Local +Z is the chair's facing direction (toward
// whatever it's pulled up to). Used for both conference chairs and desks.
export function Chair({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const { seat, back, leg } = CHAIR
  const seatCenterY = seat.topY - seat.thickness / 2
  const backZ = -seat.depth / 2 + back.depth / 2
  const backCenterY = back.topY - back.height / 2

  const legHeight = seat.topY - seat.thickness
  const legCenterY = legHeight / 2
  const legX = seat.width / 2 - leg.inset - leg.thickness / 2
  const legZ = seat.depth / 2 - leg.inset - leg.thickness / 2

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, seatCenterY, 0]}>
        <boxGeometry args={[seat.width, seat.thickness, seat.depth]} />
        <meshStandardMaterial color={COLORS.chair} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, backCenterY, backZ]}>
        <boxGeometry args={[back.width, back.height, back.depth]} />
        <meshStandardMaterial color={COLORS.chair} roughness={0.7} />
      </mesh>
      {[
        [-legX, -legZ],
        [legX, -legZ],
        [-legX, legZ],
        [legX, legZ],
      ].map(([lx, lz], j) => (
        <mesh key={j} castShadow position={[lx, legCenterY, lz]}>
          <boxGeometry args={[leg.thickness, legHeight, leg.thickness]} />
          <meshStandardMaterial color={COLORS.chair} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// Chairs around the conference table.
export function Chairs() {
  const tableCenterY = CONFERENCE_TABLE.center[1]
  const tableHalfW = CONFERENCE_TABLE.size[0] / 2
  const tableHalfD = CONFERENCE_TABLE.size[2] / 2

  return (
    <>
      {CHAIR.positions.map(([x, z], i) => {
        const dx = x < -tableHalfW ? 1 : x > tableHalfW ? -1 : 0
        const dz = z < -tableHalfD ? 1 : z > tableHalfD ? -1 : 0
        const facing = Math.atan2(dx, dz)
        return <Chair key={i} position={[x, tableCenterY, z]} rotationY={facing} />
      })}
    </>
  )
}
