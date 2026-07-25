import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  THE_ARCHIVE,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Laptop } from './Laptop'
import { Paper } from './Paper'
import { Whiteboard } from './Whiteboard'
import { Door } from './Door'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Small non-enterable storefront north of the north-east corridor,
// filling the wall gap east of TheStation (X ∈ [+14, +20], Z ∈ [-45, -39]).
// Closed glass door on the south (corridor-facing) wall — visible but
// blocking. West wall is coplanar with TheStation's east strip and is
// NOT re-rendered here.
export function TheArchive() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, southZ, doorCenterX, doorWidth } = THE_ARCHIVE
  const centerX = (westX + eastX) / 2
  const centerZ = (northZ + southZ) / 2
  const width = eastX - westX
  const depth = southZ - northZ
  const doorLo = doorCenterX - doorWidth / 2
  const doorHi = doorCenterX + doorWidth / 2

  return (
    <>
      {/* floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[centerX, -0.05, centerZ]}>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* north wall (opaque perimeter) */}
      <WallPanel
        position={[centerX, y, northZ]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* east wall (opaque perimeter) */}
      <WallPanel
        position={[eastX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
      />

      {/* south wall — glass storefront split around a closed corridor-side
          door. Same treatment as the west-side rooms' east walls. */}
      <WallPanel
        position={[(westX + doorLo) / 2, y, southZ]}
        size={[doorLo - westX, WALL_HEIGHT, WALL_THICKNESS]}
        glass
        divisions={1}
      />
      <WallPanel
        position={[(doorHi + eastX) / 2, y, southZ]}
        size={[eastX - doorHi, WALL_HEIGHT, WALL_THICKNESS]}
        glass
        divisions={1}
      />
      <DoorHeader position={[doorCenterX, southZ]} width={doorWidth} spansX />
      <Door
        position={[doorCenterX, southZ]}
        width={doorWidth}
        spansX
        blocking
      />

      {/* Desk with laptop + papers, chair on the north side facing south. */}
      <Desk
        position={THE_ARCHIVE.desk.center}
        size={THE_ARCHIVE.desk.size}
        topColor={COLORS.tableTop}
        legColor={COLORS.tableLegs}
      />
      <Chair
        position={[THE_ARCHIVE.chair[0], 0, THE_ARCHIVE.chair[1]]}
        rotationY={THE_ARCHIVE.chair[2]}
      />
      <Laptop
        position={[THE_ARCHIVE.desk.center[0], THE_ARCHIVE.desk.center[1] + 0.1]}
        deskTopY={THE_ARCHIVE.desk.size[1]}
        rotationY={0}
      />
      <Paper
        position={[THE_ARCHIVE.desk.center[0] - 0.35, THE_ARCHIVE.desk.center[1] - 0.15]}
        deskTopY={THE_ARCHIVE.desk.size[1]}
        rotationY={0.4}
        color="#ede8dc"
      />
      <Paper
        position={[THE_ARCHIVE.desk.center[0] + 0.4, THE_ARCHIVE.desk.center[1] + 0.2]}
        deskTopY={THE_ARCHIVE.desk.size[1]}
        rotationY={-0.3}
        layer={1}
      />

      {/* Whiteboard on the north wall, facing south into the room. */}
      <Whiteboard
        centerX={THE_ARCHIVE.whiteboard.centerX}
        centerY={THE_ARCHIVE.whiteboard.centerY}
        width={THE_ARCHIVE.whiteboard.width}
        height={THE_ARCHIVE.whiteboard.height}
        wallZ={THE_ARCHIVE.whiteboard.wallZ}
        facing={THE_ARCHIVE.whiteboard.facing}
      />
    </>
  )
}
