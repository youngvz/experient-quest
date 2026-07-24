import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  CORRIDOR_POCKET,
  EAST_CORRIDOR,
  THE_LAB,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Door } from './Door'
import { DoorHeader, WallPanel } from './wallPrimitives'

// East-running corridor branching off the central corridor's north end. Runs
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

      {/* north wall — this stretch (X: pocket.eastX .. eastX) is shared
          with TheLab's south boundary. Carve out an opening at
          THE_LAB.southDoorX so a door connects the two spaces. */}
      {(() => {
        const wallWestX = CORRIDOR_POCKET.eastX
        const doorLo = THE_LAB.southDoorX - THE_LAB.southDoorWidth / 2
        const doorHi = THE_LAB.southDoorX + THE_LAB.southDoorWidth / 2
        return (
          <>
            <WallPanel
              position={[(wallWestX + doorLo) / 2, y, northZ]}
              size={[doorLo - wallWestX, WALL_HEIGHT, WALL_THICKNESS]}
            />
            <WallPanel
              position={[(doorHi + eastX) / 2, y, northZ]}
              size={[eastX - doorHi, WALL_HEIGHT, WALL_THICKNESS]}
            />
            <DoorHeader
              position={[THE_LAB.southDoorX, northZ]}
              width={THE_LAB.southDoorWidth}
              spansX
            />
            {/* Open glass door standing in the doorway between TheLab
                (north) and the East Corridor (south). */}
            <Door
              position={[THE_LAB.southDoorX, northZ]}
              width={THE_LAB.southDoorWidth}
              spansX
              blocking={false}
              open
            />
          </>
        )
      })()}

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
