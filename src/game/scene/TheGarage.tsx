import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  ROOM_WIDTH,
  THE_GARAGE,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Door } from './Door'
import { FilingCabinet } from './FilingCabinet'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Mug } from './Mug'
import { Painting } from './Painting'
import { Paper } from './Paper'
import { Television } from './Television'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Landscape painting preset — wider than tall, in contrast to the
// default near-square canvas. Use for horizontal wall runs where a
// panoramic proportion reads better.
const LANDSCAPE_PAINTING_SIZE: [number, number] = [1.8, 1.4]

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
      {/* Dead-end door — visible glass slab that seals the opening.
          Leads nowhere yet; swap `blocking` for a sensor collider when
          the space beyond becomes a real level transition. */}
      <Door
        position={[eastX, THE_GARAGE.eastDoorCenterZ]}
        width={THE_GARAGE.eastDoorWidth}
        spansX={false}
        blocking
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
        openDirection="outward"
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

      {/* NW office conference table + chairs, mirroring the layout of
          the main conference room. Table long along X, 4 chairs on each
          long side facing the table. Room is 15 × 5 m; the 8 × 3
          footprint (table 8 × 2.6, chair clearance 0.55m each side) fits
          with ~0.65m off the north and south walls. */}
      {(() => {
        const nwCenterX = (nwOffice.westX + nwOffice.eastX) / 2 // -2.5
        const nwCenterZ = (nwOffice.northZ + nwOffice.southZ) / 2 // -71.5
        const tableSize: [number, number, number] = [8, 0.75, 2.6]
        // Chair seat-center clearance from the table edge. 0.2m tucks
        // the front of the seat under the tabletop for a pulled-in read.
        const chairOffsetZ = tableSize[2] / 2 + 0.2
        const chairXs = [-3, -1, 1, 3].map((dx) => nwCenterX + dx)
        return (
          <>
            <Desk
              position={[nwCenterX, nwCenterZ]}
              size={tableSize}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />
            {/* North side — chairs at Z = nwCenterZ - offset, facing
                south (+Z, toward the table). rotationY=0 → local +Z is
                world +Z, which the Chair primitive treats as its
                "facing" direction. */}
            {chairXs.map((cx) => (
              <Chair
                key={`nw-conf-chair-n-${cx}`}
                position={[cx, 0, nwCenterZ - chairOffsetZ]}
                rotationY={0}
              />
            ))}
            {/* South side — chairs at Z = nwCenterZ + offset, facing
                north (-Z). rotationY=Math.PI flips local +Z to world
                -Z. */}
            {chairXs.map((cx) => (
              <Chair
                key={`nw-conf-chair-s-${cx}`}
                position={[cx, 0, nwCenterZ + chairOffsetZ]}
                rotationY={Math.PI}
              />
            ))}
            {/* Wall-mounted TV on the office's east wall (partition at
                X=nwOffice.eastX), facing west (-X, into the office).
                Mirrors the Bakery/main conference room's east-wall TV. */}
            <Television
              wallAxis="z"
              wallCoord={nwOffice.eastX}
              facing={-1}
              centerAlong={nwCenterZ}
              centerY={1.5}
              width={4}
              height={1.8}
              depth={0.15}
            />
          </>
        )
      })()}

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

      {/* Alcove aisle-facing walls. Each enclosed alcove reads through
          to the aisle via a glass front wall with a 2 m open door.
          Four alcoves total, all in the middle two bays (X ∈ [+14, +23]
          and [+23, +32]):
            - North strip: 2 alcoves along Z=aisle.northZ
            - South strip: 2 alcoves along Z=aisle.southZ
          The outer bays on both strips (X ∈ [nwOffice.eastX, +14] and
          [+32, +44]) and the south strip's westernmost lobby stay
          open onto the aisle. */}
      {(() => {
        const partitionXs = partitions.map((p) => p.x)
        const alcoveDoorWidth = 2
        // Bays that get glass fronts + doors: the two middle columns
        // bounded by the partition Xs.
        const alcoveBays = partitionXs
          .slice(0, -1)
          .map((wx, i) => ({ westX: wx, eastX: partitionXs[i + 1]! }))
        const northAlcoves = alcoveBays
        const southAlcoves = alcoveBays

        const renderFrontWall = (
          bay: { westX: number; eastX: number },
          wallZ: number,
          key: string,
          spansXHint: boolean,
        ) => {
          const doorCenterX = (bay.westX + bay.eastX) / 2
          const doorLo = doorCenterX - alcoveDoorWidth / 2
          const doorHi = doorCenterX + alcoveDoorWidth / 2
          return (
            <group key={key}>
              <WallPanel
                position={[(bay.westX + doorLo) / 2, y, wallZ]}
                size={[doorLo - bay.westX, WALL_HEIGHT, WALL_THICKNESS]}
                glass
                divisions={1}
              />
              <WallPanel
                position={[(doorHi + bay.eastX) / 2, y, wallZ]}
                size={[bay.eastX - doorHi, WALL_HEIGHT, WALL_THICKNESS]}
                glass
                divisions={1}
              />
              <DoorHeader
                position={[doorCenterX, wallZ]}
                width={alcoveDoorWidth}
                spansX={spansXHint}
              />
              <Door
                position={[doorCenterX, wallZ]}
                width={alcoveDoorWidth}
                spansX={spansXHint}
                blocking={false}
                open
              />
            </group>
          )
        }

        // North-alcove furnishings. Chair faces south toward the door
        // (rotationY=0); desk sits in front of the sitter with the
        // monitor at the desk's north (back) edge and the laptop nearer
        // the sitter. Mug + two papers scatter on the desktop. Painting
        // hangs on the north perimeter wall behind the sitter, centered
        // on the bay.
        const NORTH_ALCOVE_DESK_SIZE: [number, number, number] = [5, 0.75, 1.6]
        // Landscape painting fits the alcove's ~9 m wide north wall
        // better than the near-square default.
        const NORTH_ALCOVE_PAINTING_SIZE = LANDSCAPE_PAINTING_SIZE
        const northFurniture = northAlcoves.map((bay, i) => {
          const bayCenterX = (bay.westX + bay.eastX) / 2
          // Chair sits ~1m off the north wall; desk pulled south so the
          // sitter faces further into the alcove toward the aisle door.
          const chairZ = northZ + 1.0
          const deskCenterZ = chairZ + 1.4
          const deskTopY = NORTH_ALCOVE_DESK_SIZE[1]
          // Sitter is on the desk's north edge (chair at chairZ=-73.4)
          // and faces south (+Z). Laptop lives at the desk's north edge
          // right in front of them; monitor sits behind it at the
          // desk's south edge.
          const laptopZ =
            deskCenterZ - NORTH_ALCOVE_DESK_SIZE[2] / 2 + 0.5
          const monitorZ =
            deskCenterZ + NORTH_ALCOVE_DESK_SIZE[2] / 2 - 0.4
          const chairFacing = 0 // faces +Z (south, toward door)
          const screenFacing = Math.PI // faces -Z (north, toward sitter)
          // Alternate details between the two alcoves so they don't
          // read as identical.
          const mugColor: 'white' | 'black' = i === 0 ? 'white' : 'black'
          const paintingColor = i === 0 ? '#4a6d8c' : '#9a5b3d'
          return (
            <group key={`n-alcove-furn-${i}`}>
              <Desk
                position={[bayCenterX, deskCenterZ]}
                size={NORTH_ALCOVE_DESK_SIZE}
                topColor={COLORS.tableTop}
                legColor={COLORS.tableLegs}
              />
              <Chair
                position={[bayCenterX, 0, chairZ]}
                rotationY={chairFacing}
              />
              <Laptop
                position={[bayCenterX, laptopZ]}
                deskTopY={deskTopY}
                rotationY={screenFacing}
              />
              <Monitor
                position={[bayCenterX, monitorZ]}
                deskTopY={deskTopY}
                rotationY={screenFacing}
              />
              <Mug
                position={[bayCenterX + 0.9, laptopZ + 0.15]}
                deskTopY={deskTopY}
                rotationY={i === 0 ? -0.6 : 0.5}
                color={mugColor}
              />
              <Paper
                position={[bayCenterX - 0.9, laptopZ + 0.25]}
                deskTopY={deskTopY}
                rotationY={i === 0 ? 0.5 : -0.4}
                color="#ede8dc"
              />
              <Paper
                position={[bayCenterX - 0.6, laptopZ + 0.55]}
                deskTopY={deskTopY}
                rotationY={i === 0 ? -0.3 : 0.55}
                layer={1}
              />
              <Painting
                centerX={bayCenterX}
                wallZ={northZ}
                centerY={1.7}
                size={NORTH_ALCOVE_PAINTING_SIZE}
                facing={1}
                color={paintingColor}
              />
              {/* Row of filing cabinets against the alcove's east
                  partition wall, drawers facing west (-X) into the
                  room. FilingCabinet's drawer faces are on its local
                  +Z (see Library, which uses rotationY=0 for drawers
                  facing +Z south). rotationY=-Math.PI/2 rotates local
                  +Z to world -X so drawers face west. After that
                  rotation, cabinet width (0.5m) runs along world Z
                  and depth (0.6m) along world X — position so the
                  body's east face is flush against the partition
                  wall's inner surface. */}
              {(() => {
                const rowCount = 4
                const cabinetWidth = 0.5
                const cabinetDepth = 0.6
                const eastWallInner = bay.eastX - WALL_THICKNESS / 2
                const cabinetX = eastWallInner - cabinetDepth / 2 - 0.02
                // Cluster the cabinets flush against each other so the
                // row reads as one filing wall. Body Z-extent after
                // rotationY=-π/2 is cabinetWidth (0.5m); adjacent
                // bodies share a face when stepZ === cabinetWidth.
                const stepZ = cabinetWidth
                const rowSpanZ = stepZ * rowCount
                const startZ =
                  (northZ + aisle.northZ) / 2 - rowSpanZ / 2 + cabinetWidth / 2
                return Array.from({ length: rowCount }).map((_, j) => (
                  <FilingCabinet
                    key={`n-alcove-fc-${i}-${j}`}
                    position={[cabinetX, startZ + stepZ * j]}
                    rotationY={-Math.PI / 2}
                  />
                ))
              })()}
            </group>
          )
        })

        return (
          <>
            {northAlcoves.map((bay, i) =>
              renderFrontWall(bay, aisle.northZ, `n-alcove-${i}`, true),
            )}
            {southAlcoves.map((bay, i) =>
              renderFrontWall(bay, aisle.southZ, `s-alcove-${i}`, true),
            )}
            {northFurniture}
          </>
        )
      })()}
    </>
  )
}
