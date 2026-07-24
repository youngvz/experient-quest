import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  EAST_CORRIDOR,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { DoorHeader, WallPanel } from './Walls'

// East-running corridor branching off the west corridor's north end. Runs
// parallel to the conference room's north wall. The south boundary is the
// conf room's north (glass) wall and the west boundary is the west
// corridor's east wall — neither is re-rendered here.
export function EastCorridor() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, southZ, northZ, eastDoorZ, eastDoorWidth } = EAST_CORRIDOR
  const centerX = (westX + eastX) / 2
  const centerZ = (northZ + southZ) / 2
  const width = eastX - westX
  const depth = southZ - northZ

  // East-wall segments split around the dead-end doorway.
  const doorLo = eastDoorZ - eastDoorWidth / 2
  const doorHi = eastDoorZ + eastDoorWidth / 2

  return (
    <>
      {/* floor slab */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[centerX, -0.05, centerZ]}>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* north wall — opaque, full length */}
      <WallPanel
        position={[centerX, y, northZ]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* east wall — split around dead-end doorway */}
      <WallPanel
        position={[eastX, y, (northZ + doorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, doorLo - northZ]}
      />
      <WallPanel
        position={[eastX, y, (doorHi + southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, southZ - doorHi]}
      />
      <DoorHeader
        position={[eastX, eastDoorZ]}
        width={eastDoorWidth}
        spansX={false}
      />
    </>
  )
}
