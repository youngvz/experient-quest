import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  HALLWAY,
  HALLWAY_SOUTH_DOOR,
  HALLWAY_WEST_DOOR,
  ROOM_DEPTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { DoorHeader, WallPanel } from './Walls'

// A rectangular corridor attached to the conference room's south doorway.
// North side is intentionally open — the conference room's front wall (with
// its doorway) is the shared boundary. West wall is glass to match the room.
export function Hallway() {
  const y = WALL_HEIGHT / 2
  const halfW = HALLWAY.width / 2
  const northZ = ROOM_DEPTH / 2
  const southZ = northZ + HALLWAY.depth
  const centerZ = (northZ + southZ) / 2
  const westX = HALLWAY.centerX - halfW
  const eastX = HALLWAY.centerX + halfW

  // West wall — glass, split around HALLWAY_WEST_DOOR.
  const wDoorLo = HALLWAY_WEST_DOOR.centerZ - HALLWAY_WEST_DOOR.width / 2
  const wDoorHi = HALLWAY_WEST_DOOR.centerZ + HALLWAY_WEST_DOOR.width / 2
  const wNorthDepth = wDoorLo - northZ
  const wSouthDepth = southZ - wDoorHi
  const wNorthCenterZ = (northZ + wDoorLo) / 2
  const wSouthCenterZ = (wDoorHi + southZ) / 2

  // South wall — opaque, split around HALLWAY_SOUTH_DOOR.
  const sDoorLo = HALLWAY_SOUTH_DOOR.centerX - HALLWAY_SOUTH_DOOR.width / 2
  const sDoorHi = HALLWAY_SOUTH_DOOR.centerX + HALLWAY_SOUTH_DOOR.width / 2
  const sWestWidth = sDoorLo - westX
  const sEastWidth = eastX - sDoorHi
  const sWestCenterX = (westX + sDoorLo) / 2
  const sEastCenterX = (sDoorHi + eastX) / 2

  return (
    <>
      {/* floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[HALLWAY.centerX, -0.05, centerZ]}>
          <boxGeometry args={[HALLWAY.width, 0.1, HALLWAY.depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* west wall — glass, split around the west doorway */}
      <WallPanel
        position={[westX, y, wNorthCenterZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, wNorthDepth]}
        glass
      />
      <WallPanel
        position={[westX, y, wSouthCenterZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, wSouthDepth]}
        glass
      />
      {/* east wall — opaque */}
      <WallPanel
        position={[eastX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, HALLWAY.depth]}
      />
      {/* south wall — opaque, split around the south doorway */}
      <WallPanel
        position={[sWestCenterX, y, southZ]}
        size={[sWestWidth, WALL_HEIGHT, WALL_THICKNESS]}
      />
      <WallPanel
        position={[sEastCenterX, y, southZ]}
        size={[sEastWidth, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* header lintels over the two hallway doorways */}
      <DoorHeader
        position={[westX, HALLWAY_WEST_DOOR.centerZ]}
        width={HALLWAY_WEST_DOOR.width}
        spansX={false}
      />
      <DoorHeader
        position={[HALLWAY_SOUTH_DOOR.centerX, southZ]}
        width={HALLWAY_SOUTH_DOOR.width}
        spansX
      />
    </>
  )
}
