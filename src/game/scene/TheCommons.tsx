import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  THE_COMMONS,
  THE_COMMONS_TABLES,
  THE_COMMONS_TV,
  THE_COMMONS_WHITEBOARD,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { FilingCabinet } from './FilingCabinet'
import { Mug } from './Mug'
import { Painting } from './Painting'
import { Paper } from './Paper'
import { Sofa } from './Sofa'
import { Television } from './Television'
import { WaterCooler } from './WaterCooler'
import { Whiteboard } from './Whiteboard'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Open breakout / collab room on the west side of the central
// corridor. Corridor-side east wall is a coplanar glass storefront
// with a doorway (matching the east-side rooms). Two square meeting
// tables + whiteboard + wall TV.
//
// TheCommons renders:
//   - floor slab
//   - north / south / west perimeter walls (opaque)
//   - east wall as glass storefront, coplanar with the corridor's
//     west-wall glass segment, split around a corridor-side doorway.
//     The visible open door slab + lintel on the corridor side are
//     drawn by CentralCorridor.tsx.
//   - interior furniture
export function TheCommons() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, southZ, doorCenterZ, doorWidth } = THE_COMMONS
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
      {/* east wall — coplanar with the corridor's west wall. Split
          around the corridor-side doorway. Auto-divisions so the
          mullions match the east-side storefronts. */}
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

      {/* Two square meeting tables, each with 4 chairs around it. */}
      {THE_COMMONS_TABLES.map((t, i) => (
        <group key={`table-${i}`}>
          <Desk
            position={t.center}
            size={t.size}
            topColor={COLORS.tableTop}
            legColor={COLORS.tableLegs}
          />
          {t.chairs.map((c, j) => (
            <Chair key={j} position={[c[0], 0, c[1]]} rotationY={c[2]} />
          ))}
          {/* A couple of scattered papers on each table. */}
          <Paper
            position={[t.center[0] - 0.35, t.center[1] - 0.25]}
            deskTopY={t.size[1]}
            rotationY={i === 0 ? 0.4 : -0.35}
            color="#ede8dc"
          />
          <Paper
            position={[t.center[0] + 0.3, t.center[1] + 0.4]}
            deskTopY={t.size[1]}
            rotationY={i === 0 ? -0.25 : 0.5}
            layer={1}
          />
          {/* A mug on each table, offset so it doesn't clash with the papers. */}
          <Mug
            position={[t.center[0] + 0.5, t.center[1] - 0.5]}
            deskTopY={t.size[1]}
            rotationY={i === 0 ? -0.4 : 0.6}
            color={i === 0 ? 'white' : 'black'}
          />
        </group>
      ))}

      {/* Break-area kit: a 3-seat sofa against the west (opaque) wall
          facing east into the room, a water cooler in the SW corner,
          a filing cabinet against the south wall, and two paintings on
          the west wall above the sofa. */}
      <Sofa
        position={[-18.4, 10]}
        rotationY={Math.PI / 2}
        seatCount={3}
      />
      <WaterCooler position={[-18.2, 16.5]} rotationY={Math.PI / 2} />
      <FilingCabinet position={[-13.6, 3.4]} rotationY={-Math.PI / 2} drawers={3} />
      <Painting
        centerZ={5}
        wallX={THE_COMMONS.westX}
        facing={1}
        centerY={1.7}
        size={[1.2, 0.9]}
        color="#c47a4b"
      />
      <Painting
        centerZ={15}
        wallX={THE_COMMONS.westX}
        facing={1}
        centerY={1.7}
        size={[1.4, 1.0]}
        color="#5d7fa8"
      />

      {/* Whiteboard on the north wall, facing south into the room. */}
      <Whiteboard
        centerX={THE_COMMONS_WHITEBOARD.centerX}
        centerY={THE_COMMONS_WHITEBOARD.centerY}
        width={THE_COMMONS_WHITEBOARD.width}
        height={THE_COMMONS_WHITEBOARD.height}
        wallZ={THE_COMMONS_WHITEBOARD.wallZ}
        facing={THE_COMMONS_WHITEBOARD.facing}
      />

      {/* Wall-mounted TV on the south wall, facing north. */}
      <Television
        wallAxis="x"
        wallCoord={THE_COMMONS_TV.wallZ}
        facing={THE_COMMONS_TV.facing}
        centerAlong={THE_COMMONS_TV.centerX}
        centerY={THE_COMMONS_TV.centerY}
        width={THE_COMMONS_TV.width}
        height={THE_COMMONS_TV.height}
        depth={THE_COMMONS_TV.depth}
      />
    </>
  )
}
