import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  THE_ATRIUM,
  THE_ATRIUM_CONFERENCE,
  THE_ATRIUM_POD_DESKS,
  THE_ATRIUM_WHITEBOARD_WEST,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Paper } from './Paper'
import { Television } from './Television'
import { Whiteboard } from './Whiteboard'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Two-zone room on the west side of the central corridor. South half
// is a small conference nook (table + wall TV); north half is a
// 4-desk pod. A whiteboard on the middle of the west wall breaks the
// zones. Non-explorable — sealed by glass on the corridor side.
export function TheAtrium() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, southZ, doorCenterZ, doorWidth } = THE_ATRIUM
  const centerX = (westX + eastX) / 2
  const centerZ = (northZ + southZ) / 2
  const width = eastX - westX
  const depth = southZ - northZ
  const doorLo = doorCenterZ - doorWidth / 2
  const doorHi = doorCenterZ + doorWidth / 2

  return (
    <>
      {/* floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[centerX, -0.05, centerZ]}>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* north wall */}
      <WallPanel
        position={[centerX, y, northZ]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* south wall */}
      <WallPanel
        position={[centerX, y, southZ]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* west wall (opaque perimeter) */}
      <WallPanel
        position={[westX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
      />
      {/* east wall — coplanar glass storefront, split around the
          corridor-side doorway. Auto-divisions so the mullions match
          the east-side storefronts. */}
      <WallPanel
        position={[eastX, y, (northZ + doorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, doorLo - northZ]}
        glass
      />
      <WallPanel
        position={[eastX, y, (doorHi + southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, southZ - doorHi]}
        glass
      />
      <DoorHeader
        position={[eastX, doorCenterZ]}
        width={doorWidth}
        spansX={false}
      />

      {/* South half — conference nook. */}
      <Desk
        position={THE_ATRIUM_CONFERENCE.table.center}
        size={THE_ATRIUM_CONFERENCE.table.size}
        topColor={COLORS.tableTop}
        legColor={COLORS.tableLegs}
      />
      {THE_ATRIUM_CONFERENCE.chairs.map((c, i) => (
        <Chair key={`atr-conf-chair-${i}`} position={[c[0], 0, c[1]]} rotationY={c[2]} />
      ))}
      <Paper
        position={[
          THE_ATRIUM_CONFERENCE.table.center[0] - 0.4,
          THE_ATRIUM_CONFERENCE.table.center[1] - 0.4,
        ]}
        deskTopY={THE_ATRIUM_CONFERENCE.table.size[1]}
        rotationY={0.35}
        color="#ede8dc"
      />
      <Paper
        position={[
          THE_ATRIUM_CONFERENCE.table.center[0] + 0.4,
          THE_ATRIUM_CONFERENCE.table.center[1] + 0.5,
        ]}
        deskTopY={THE_ATRIUM_CONFERENCE.table.size[1]}
        rotationY={-0.4}
        layer={1}
      />
      <Television
        wallAxis="z"
        wallCoord={THE_ATRIUM_CONFERENCE.tv.wallX}
        facing={THE_ATRIUM_CONFERENCE.tv.facing}
        centerAlong={THE_ATRIUM_CONFERENCE.tv.centerZ}
        centerY={THE_ATRIUM_CONFERENCE.tv.centerY}
        width={THE_ATRIUM_CONFERENCE.tv.width}
        height={THE_ATRIUM_CONFERENCE.tv.height}
        depth={THE_ATRIUM_CONFERENCE.tv.depth}
      />

      {/* Middle whiteboard on the west wall between the two zones. */}
      <Whiteboard
        wallX={THE_ATRIUM_WHITEBOARD_WEST.wallX}
        centerZ={THE_ATRIUM_WHITEBOARD_WEST.centerZ}
        centerY={THE_ATRIUM_WHITEBOARD_WEST.centerY}
        width={THE_ATRIUM_WHITEBOARD_WEST.width}
        height={THE_ATRIUM_WHITEBOARD_WEST.height}
        facing={THE_ATRIUM_WHITEBOARD_WEST.facing}
      />

      {/* North half — 4-desk pod. Laptops + monitors + papers. */}
      {THE_ATRIUM_POD_DESKS.map((d, i) => {
        const deskTopY = d.deskSize[1]
        // Small jitter so the pod doesn't read as a perfect grid.
        const j = (i % 2 === 0 ? 1 : -1) * 0.12
        return (
          <group key={`atr-pod-${i}`}>
            <Desk
              position={d.deskCenter}
              size={d.deskSize}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />
            <Chair position={[d.chair[0], 0, d.chair[1]]} rotationY={d.chair[2]} />
            <Laptop
              position={[
                d.deskCenter[0] + (d.screenFacing > 0 ? -0.3 : 0.3),
                d.deskCenter[1] + (i % 2 === 0 ? 0.15 : -0.15),
              ]}
              deskTopY={deskTopY}
              rotationY={d.screenFacing + j}
            />
            <Monitor
              position={[
                d.deskCenter[0] + (d.screenFacing > 0 ? -0.5 : 0.5),
                d.deskCenter[1] + (i % 2 === 0 ? -0.25 : 0.22),
              ]}
              deskTopY={deskTopY}
              rotationY={d.screenFacing - j * 0.6}
            />
            <Paper
              position={[d.deskCenter[0], d.deskCenter[1] + (i % 2 === 0 ? 0.4 : -0.4)]}
              deskTopY={deskTopY}
              rotationY={i % 2 === 0 ? -0.35 : 0.4}
              color="#ede8dc"
            />
          </group>
        )
      })}
    </>
  )
}
