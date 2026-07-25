import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  THE_GARAGE,
  THE_GARAGE_CONFERENCE_CHAIRS,
  THE_GARAGE_CONFERENCE_TABLE,
  THE_GARAGE_CONFERENCE_TV,
  THE_GARAGE_TABLES,
  THE_GARAGE_WHITEBOARD,
  THE_STATION,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Door } from './Door'
import { Television } from './Television'
import { Whiteboard } from './Whiteboard'
import { DoorHeader, WallPanel } from './wallPrimitives'

// The Garage — large open floor east of the central corridor's north
// stretch, plus an enclosed conference sub-room on its north side. Both
// share their west wall coplanar with the corridor east wall (glass,
// owned by CentralCorridor.tsx) so the corridor's storefront reads
// uninterrupted along the whole complex.
//
// The Garage renders:
//   - floor slab (main room)
//   - south / east / north perimeter walls (opaque)
//   - conference sub-room in full: floor, opaque perimeter walls (east
//     + north), and the shared south wall split around the sub-room's
//     doorway (which IS The Garage's north wall)
//
// The Garage does NOT render:
//   - west wall of the main floor (X=-10, Z ∈ [southZ, northZ]) — glass
//     storefront owned by CentralCorridor.tsx, including the entry door
//   - west wall of the conference sub-room — same, along its own Z-span
//     (also carries a corridor-side doorway at Z=-94)
//   - south wall X ∈ [-10, +10] — coplanar with TheStation's north wall,
//     owned by TheStation.tsx. Only the X ∈ [+10, +14] slice is drawn
//     here.
export function TheGarage() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, southZ, northZ, conference } = THE_GARAGE
  const centerX = (westX + eastX) / 2
  const centerZ = (northZ + southZ) / 2
  const width = eastX - westX
  const depth = southZ - northZ

  const confCenterX = (conference.westX + conference.eastX) / 2
  const confCenterZ = (conference.northZ + conference.southZ) / 2
  const confWidth = conference.eastX - conference.westX
  const confDepth = conference.southZ - conference.northZ

  const confDoorLo = conference.doorCenterX - conference.doorWidth / 2
  const confDoorHi = conference.doorCenterX + conference.doorWidth / 2

  return (
    <>
      {/* floor — main garage */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[centerX, -0.05, centerZ]}>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* floor — conference sub-room */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[confCenterX, -0.05, confCenterZ]}>
          <boxGeometry args={[confWidth, 0.1, confDepth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* south wall — only the slice east of TheStation's north wall
          (X ∈ [THE_STATION.eastX, eastX]) is drawn here. The other slice
          (X ∈ [westX, THE_STATION.eastX]) is coplanar with TheStation's
          own north wall and is owned by TheStation.tsx. */}
      <WallPanel
        position={[(THE_STATION.eastX + eastX) / 2, y, southZ]}
        size={[eastX - THE_STATION.eastX, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* east wall — main floor stretch */}
      <WallPanel
        position={[eastX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
      />

      {/* Shared wall between main floor (north side) and conference
          sub-room (south side): split around the sub-room doorway.
          Opaque on both sides of the door. Sub-room spans the full
          width of the main floor (same westX / eastX), so the shared
          wall runs the full room width. */}
      <WallPanel
        position={[(westX + confDoorLo) / 2, y, northZ]}
        size={[confDoorLo - westX, WALL_HEIGHT, WALL_THICKNESS]}
      />
      <WallPanel
        position={[(confDoorHi + eastX) / 2, y, northZ]}
        size={[eastX - confDoorHi, WALL_HEIGHT, WALL_THICKNESS]}
      />
      <DoorHeader
        position={[conference.doorCenterX, northZ]}
        width={conference.doorWidth}
        spansX
      />
      <Door
        position={[conference.doorCenterX, northZ]}
        width={conference.doorWidth}
        spansX
        blocking={false}
        open
      />

      {/* Conference sub-room — north + east walls (opaque). West wall is
          owned by CentralCorridor.tsx (glass, coplanar with corridor).
          South wall is the shared wall drawn above. */}
      <WallPanel
        position={[confCenterX, y, conference.northZ]}
        size={[confWidth, WALL_HEIGHT, WALL_THICKNESS]}
      />
      <WallPanel
        position={[conference.eastX, y, confCenterZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, confDepth]}
      />

      {/* Whiteboard on the main-floor east wall */}
      <Whiteboard
        wallX={THE_GARAGE_WHITEBOARD.wallX}
        centerZ={THE_GARAGE_WHITEBOARD.centerZ}
        centerY={THE_GARAGE_WHITEBOARD.centerY}
        width={THE_GARAGE_WHITEBOARD.width}
        height={THE_GARAGE_WHITEBOARD.height}
        facing={THE_GARAGE_WHITEBOARD.facing}
      />

      {/* Two lounge tables on the main floor, each with 4 chairs. */}
      {THE_GARAGE_TABLES.map((t, i) => (
        <group key={`garage-table-${i}`}>
          <Desk
            position={t.center}
            size={t.size}
            topColor={COLORS.tableTop}
            legColor={COLORS.tableLegs}
          />
          {t.chairs.map(([cx, cz, cr], j) => (
            <Chair key={j} position={[cx, 0, cz]} rotationY={cr} />
          ))}
        </group>
      ))}

      {/* Formal meeting table + chairs inside the conference sub-room. */}
      <Desk
        position={THE_GARAGE_CONFERENCE_TABLE.center}
        size={THE_GARAGE_CONFERENCE_TABLE.size}
        topColor={COLORS.tableTop}
        legColor={COLORS.tableLegs}
      />
      {THE_GARAGE_CONFERENCE_CHAIRS.map(([cx, cz, cr], i) => (
        <Chair key={`garage-conf-chair-${i}`} position={[cx, 0, cz]} rotationY={cr} />
      ))}

      {/* Wall-mounted TV on the conference sub-room's north wall, facing south. */}
      <Television
        wallAxis="x"
        wallCoord={THE_GARAGE_CONFERENCE_TV.wallZ}
        facing={THE_GARAGE_CONFERENCE_TV.facing}
        centerAlong={THE_GARAGE_CONFERENCE_TV.centerX}
        centerY={THE_GARAGE_CONFERENCE_TV.centerY}
        width={THE_GARAGE_CONFERENCE_TV.width}
        height={THE_GARAGE_CONFERENCE_TV.height}
        depth={THE_GARAGE_CONFERENCE_TV.depth}
      />
    </>
  )
}
