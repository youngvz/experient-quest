import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  ROOM_WIDTH,
  THE_GARAGE,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Door } from './Door'
import { DoorHeader, WallPanel } from './wallPrimitives'

// The Garage — 54 m × 12 m room east of the central corridor. Interior
// split into three Z-strips (north 5 m, aisle 3 m, south 4 m) with three
// vertical partition walls at X=+14, +23, +32 that cut through both
// strips but not the aisle. The whole X ∈ [-10, +5] portion of the north
// strip is one enclosed office with a single south-facing doorway.
//
// TheGarage renders:
//   - floor slab
//   - opaque perimeter walls (north, east); south wall east of TheStation
//   - NW office south wall (with 2 m doorway)
//   - three vertical partitions running north and south of the aisle
//
// TheGarage does NOT render:
//   - west wall (X=-10) — glass storefront owned by CentralCorridor.tsx,
//     including the 2 m entry door at Z=-65.5
//   - south wall X ∈ [-10, +14] at Z=-62 — coplanar with TheStation's
//     north wall, owned by TheStation.tsx. Only the X ∈ [+14, +44] slice
//     is drawn here.
export function TheGarage() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, southZ, northZ, aisle, nwOffice, partitions } =
    THE_GARAGE
  const centerX = (westX + eastX) / 2
  const centerZ = (northZ + southZ) / 2
  const width = eastX - westX
  const depth = southZ - northZ

  const eastDoorLo = THE_GARAGE.eastDoorCenterZ - THE_GARAGE.eastDoorWidth / 2
  const eastDoorHi = THE_GARAGE.eastDoorCenterZ + THE_GARAGE.eastDoorWidth / 2

  const officeDoorLo = nwOffice.doorCenterX - nwOffice.doorWidth / 2
  const officeDoorHi = nwOffice.doorCenterX + nwOffice.doorWidth / 2

  return (
    <>
      {/* floor slab */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[centerX, -0.05, centerZ]}>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* north perimeter wall — opaque, full width */}
      <WallPanel
        position={[centerX, y, northZ]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* south perimeter wall — only the slice east of TheStation's
          north wall is drawn here. TheStation's north wall spans just
          its L-shape's main rect (X ∈ [-10, +10]); everything east of
          X=+10 at Z=-62 is TheGarage's. Sharing this literal with
          TheStation's `stepX` local rather than importing it — both
          derive from ROOM_WIDTH/2. */}
      <WallPanel
        position={[(ROOM_WIDTH / 2 + eastX) / 2, y, southZ]}
        size={[eastX - ROOM_WIDTH / 2, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* east perimeter wall — split around the dead-end door */}
      <WallPanel
        position={[eastX, y, (northZ + eastDoorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, eastDoorLo - northZ]}
      />
      <WallPanel
        position={[eastX, y, (eastDoorHi + southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, southZ - eastDoorHi]}
      />
      <DoorHeader
        position={[eastX, THE_GARAGE.eastDoorCenterZ]}
        width={THE_GARAGE.eastDoorWidth}
        spansX={false}
      />
      <Door
        position={[eastX, THE_GARAGE.eastDoorCenterZ]}
        width={THE_GARAGE.eastDoorWidth}
        spansX={false}
        blocking={false}
        open
      />

      {/* NW office south wall — spans X ∈ [nwOffice.westX, nwOffice.eastX]
          at Z = nwOffice.southZ (= aisle.northZ). Split around the
          south-facing doorway. Rendered as glass storefront so the
          enclosed office reads through to the aisle, mirroring the
          conference room's glass front wall. */}
      <WallPanel
        position={[(nwOffice.westX + officeDoorLo) / 2, y, nwOffice.southZ]}
        size={[officeDoorLo - nwOffice.westX, WALL_HEIGHT, WALL_THICKNESS]}
        glass
        divisions={1}
      />
      <WallPanel
        position={[(officeDoorHi + nwOffice.eastX) / 2, y, nwOffice.southZ]}
        size={[nwOffice.eastX - officeDoorHi, WALL_HEIGHT, WALL_THICKNESS]}
        glass
        divisions={1}
      />
      <DoorHeader
        position={[nwOffice.doorCenterX, nwOffice.southZ]}
        width={nwOffice.doorWidth}
        spansX
      />
      <Door
        position={[nwOffice.doorCenterX, nwOffice.southZ]}
        width={nwOffice.doorWidth}
        spansX
        blocking={false}
        open
      />

      {/* NW office east wall — separates the enclosed office from the
          east-side cubicle bays. Runs the full depth of the north strip. */}
      <WallPanel
        position={[
          nwOffice.eastX,
          y,
          (nwOffice.northZ + nwOffice.southZ) / 2,
        ]}
        size={[
          WALL_THICKNESS,
          WALL_HEIGHT,
          nwOffice.southZ - nwOffice.northZ,
        ]}
      />

      {/* Vertical partitions — each runs from northZ to aisle.northZ AND
          from aisle.southZ to southZ, leaving the 3 m aisle open. */}
      {partitions.map((p) => (
        <group key={`partition-${p.x}`}>
          {/* North stretch */}
          <WallPanel
            position={[p.x, y, (northZ + aisle.northZ) / 2]}
            size={[WALL_THICKNESS, WALL_HEIGHT, aisle.northZ - northZ]}
          />
          {/* South stretch */}
          <WallPanel
            position={[p.x, y, (aisle.southZ + southZ) / 2]}
            size={[WALL_THICKNESS, WALL_HEIGHT, southZ - aisle.southZ]}
          />
        </group>
      ))}
    </>
  )
}
