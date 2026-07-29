import { RigidBody } from '@react-three/rapier'
import { Suspense, useMemo } from 'react'
import { useEmployeeUrl } from '../characters/roster'
import {
  COLORS,
  THE_BOARDROOM,
  THE_STATION,
  THE_STATION_ALCOVES,
  THE_STATION_EAST_ALCOVES,
  THE_STATION_F_EXPANSION,
  THE_STATION_WEST_WORKSTATIONS,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { useGameStore } from '../state/gameStore'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Door } from './Door'
import { Employee } from './Employee'
import { InteractionMarker } from './InteractionMarker'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Paper } from './Paper'
import { Sofa } from './Sofa'
import { Television } from './Television'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Waves until the player finishes talking to Catherine, then swaps to idle.
const CATHERINE_WAVE = [/wave/i, /greet/i, /hello/i]
const CATHERINE_IDLE = [/idle/i, /stand/i, /breath/i]

function Catherine({ position }: { position: [number, number, number] }) {
  const hasSpoken = useGameStore((s) => s.completedStopIds.has('catherine'))
  const clipPatterns = useMemo(
    () => (hasSpoken ? CATHERINE_IDLE : CATHERINE_WAVE),
    [hasSpoken],
  )
  const url = useEmployeeUrl('catherine')
  return (
    <Employee
      url={url}
      position={position}
      rotationY={-Math.PI / 2}
      clipPatterns={clipPatterns}
    />
  )
}

// Bay workstation desk — 3m wide (X) × 2m deep (Z). Sits against the
// north wall so the sitter (south side of desk) faces the south-facing
// alcove doorway.
const STATION_ALCOVE_DESK_SIZE: [number, number, number] = [3, 0.75, 2]

// Second branch room off the central corridor's east wall, halfway
// between TheLab (Z ≈ -24) and the corridor's north dead-end (Z = -68).
// Simple 20 × 12 rectangle.
//
// TheStation renders:
//   - floor slab
//   - north / south / east perimeter walls
//
// TheStation renders a glass west wall coplanar with the central
// corridor's own glass segment (same trick The Bakery uses along the
// conference-room boundary). The doorway lintel and the visible glass
// door slab are drawn by CentralCorridor.tsx.
export function TheStation() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, southZ, doorCenterZ, doorWidth } = THE_STATION
  const depth = southZ - northZ
  const westDoorLo = doorCenterZ - doorWidth / 2
  const westDoorHi = doorCenterZ + doorWidth / 2

  // L-shape: cut the NE corner off so the north half is only ROOM_WIDTH
  // wide (aligned with Alcove C's east edge at X=+10) and the east strip
  // reaches out to eastX starting at the east-alcove Z-span.
  const stepX = 10 // Alcove C east edge = ROOM_WIDTH/2
  const stepZ = THE_STATION_EAST_ALCOVES.bays[0]!.northZ // -57

  // Main rect: X ∈ [westX, stepX], Z ∈ [northZ, southZ]
  const mainCenterX = (westX + stepX) / 2
  const mainCenterZ = (northZ + southZ) / 2
  const mainWidth = stepX - westX

  // East strip: X ∈ [stepX, eastX], Z ∈ [stepZ, southZ]
  const stripCenterX = (stepX + eastX) / 2
  const stripCenterZ = (stepZ + southZ) / 2
  const stripWidth = eastX - stepX
  const stripDepth = southZ - stepZ

  return (
    <>
      {/* floor — main rect */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[mainCenterX, -0.05, mainCenterZ]}>
          <boxGeometry args={[mainWidth, 0.1, depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>
      {/* floor — east strip */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[stripCenterX, -0.05, stripCenterZ]}>
          <boxGeometry args={[stripWidth, 0.1, stripDepth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* north wall — spans only the main rect */}
      <WallPanel
        position={[mainCenterX, y, northZ]}
        size={[mainWidth, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* NE-corner step's horizontal edge (Z=stepZ, X ∈ [stepX, eastX])
          is drawn by Alcove D's north wall — same plane, same X-span
          (D extends from stepX-1 west into the room and covers the full
          stepX..eastX range at Z=stepZ).
          NE-corner step's vertical edge (X=stepX, Z: northZ..stepZ) is
          drawn by Alcove C's east partition — same plane, same Z-span.
          No separate step walls needed. */}

      {/* south wall — spans the full room width (both rects) */}
      <WallPanel
        position={[(westX + eastX) / 2, y, southZ]}
        size={[eastX - westX, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* west wall — split around the corridor doorway. Glass along
          most of the room's Z-span (storefront, coplanar with the
          corridor's east wall) EXCEPT the stretch behind Alcove A
          (Z ∈ [-62, -57]), which is opaque so the alcove reads as an
          enclosed office. */}
      <WallPanel
        position={[westX, y, (northZ + THE_STATION_ALCOVES.southZ) / 2]}
        size={[
          WALL_THICKNESS,
          WALL_HEIGHT,
          THE_STATION_ALCOVES.southZ - northZ,
        ]}
      />
      <WallPanel
        position={[
          westX,
          y,
          (THE_STATION_ALCOVES.southZ + westDoorLo) / 2,
        ]}
        size={[
          WALL_THICKNESS,
          WALL_HEIGHT,
          westDoorLo - THE_STATION_ALCOVES.southZ,
        ]}
        glass
        divisions={1}
      />
      <WallPanel
        position={[westX, y, (westDoorHi + southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, southZ - westDoorHi]}
        glass
        divisions={1}
      />

      {/* east wall — spans only the east-strip Z-range (the main rect's
          east perimeter above the step is the short vertical wall drawn
          above at X=stepX). */}
      <WallPanel
        position={[eastX, y, stripCenterZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, stripDepth]}
      />

      {/* Two alcoves against the north wall. Each renders a south wall
          split around a south-facing doorway, plus east/west partitions
          where not shared with a neighbor or the room's perimeter. */}
      {THE_STATION_ALCOVES.bays.map((b, i) => {
        const aSouthZ = THE_STATION_ALCOVES.southZ
        const aCenterZ =
          (THE_STATION_ALCOVES.northZ + THE_STATION_ALCOVES.southZ) / 2
        const aDepth = aSouthZ - THE_STATION_ALCOVES.northZ
        const doorLo = b.doorX - b.doorWidth / 2
        const doorHi = b.doorX + b.doorWidth / 2

        const prev = THE_STATION_ALCOVES.bays[i - 1]
        const westSharesNeighbor =
          !!prev && Math.abs(prev.eastX - b.westX) < 0.01
        const westFlushWithPerimeter = Math.abs(b.westX - westX) < 0.01
        const eastFlushWithPerimeter = Math.abs(b.eastX - eastX) < 0.01

        // Alcoves A and B render their south wall as glass so the
        // furnished workstations read through from the main room.
        // Alcove C keeps an opaque south wall.
        const southGlass = b.id === 'a' || b.id === 'b'

        return (
          <group key={`alcove-${b.id}`}>
            {/* south wall — split around the south-facing doorway.
                Glass segments skip internal mullions (divisions=1). */}
            <WallPanel
              position={[(b.westX + doorLo) / 2, y, aSouthZ]}
              size={[doorLo - b.westX, WALL_HEIGHT, WALL_THICKNESS]}
              glass={southGlass}
              divisions={southGlass ? 1 : undefined}
            />
            <WallPanel
              position={[(doorHi + b.eastX) / 2, y, aSouthZ]}
              size={[b.eastX - doorHi, WALL_HEIGHT, WALL_THICKNESS]}
              glass={southGlass}
              divisions={southGlass ? 1 : undefined}
            />
            <DoorHeader
              position={[b.doorX, aSouthZ]}
              width={b.doorWidth}
              spansX
            />
            {/* west partition: skip if flush with room's west wall or
                already drawn as the previous bay's east partition. */}
            {!westFlushWithPerimeter && !westSharesNeighbor ? (
              <WallPanel
                position={[b.westX, y, aCenterZ]}
                size={[WALL_THICKNESS, WALL_HEIGHT, aDepth]}
              />
            ) : null}
            {/* east partition: skip if flush with room's east wall.
                When shared with the next bay, this call draws the
                divider once. North wall coincides with the room's
                north wall — never drawn here. */}
            {!eastFlushWithPerimeter ? (
              <WallPanel
                position={[b.eastX, y, aCenterZ]}
                size={[WALL_THICKNESS, WALL_HEIGHT, aDepth]}
              />
            ) : null}
          </group>
        )
      })}

      {/* East-side alcoves D + E: 5m deep bays tiling the north half of
          the east wall. F is rendered separately below because it's
          been expanded west to share a wall with The Boardroom. */}
      {THE_STATION_EAST_ALCOVES.bays
        .filter((b) => b.id !== 'f')
        .map((b, i) => {
        const aWestX = THE_STATION_EAST_ALCOVES.westX
        const aEastX = THE_STATION_EAST_ALCOVES.eastX
        const aCenterX = (aWestX + aEastX) / 2
        const aDepth = aEastX - aWestX
        const doorLo = b.doorZ - b.doorWidth / 2
        const doorHi = b.doorZ + b.doorWidth / 2

        const prev = THE_STATION_EAST_ALCOVES.bays[i - 1]
        const northSharesNeighbor =
          !!prev && Math.abs(prev.southZ - b.northZ) < 0.01
        const northFlushWithPerimeter =
          Math.abs(b.northZ - northZ) < 0.01
        const southFlushWithPerimeter =
          Math.abs(b.southZ - southZ) < 0.01

        return (
          <group key={`east-alcove-${b.id}`}>
            {/* west wall — split around the west-facing doorway. Glass
                panels (no interior mullions) so the bay reads through
                from The Station's main floor, mirroring alcove A/B. */}
            <WallPanel
              position={[aWestX, y, (b.northZ + doorLo) / 2]}
              size={[WALL_THICKNESS, WALL_HEIGHT, doorLo - b.northZ]}
              glass
              divisions={1}
            />
            <WallPanel
              position={[aWestX, y, (doorHi + b.southZ) / 2]}
              size={[WALL_THICKNESS, WALL_HEIGHT, b.southZ - doorHi]}
              glass
              divisions={1}
            />
            <DoorHeader
              position={[aWestX, b.doorZ]}
              width={b.doorWidth}
              spansX={false}
            />
            {/* north wall: skip if flush with room's north wall or
                already drawn as the previous bay's south wall. */}
            {!northFlushWithPerimeter && !northSharesNeighbor ? (
              <WallPanel
                position={[aCenterX, y, b.northZ]}
                size={[aDepth, WALL_HEIGHT, WALL_THICKNESS]}
              />
            ) : null}
            {/* south wall: skip if flush with room's south wall. When
                shared with the next bay, draws the divider once. East
                wall coincides with the room's east wall — never drawn. */}
            {!southFlushWithPerimeter ? (
              <WallPanel
                position={[aCenterX, y, b.southZ]}
                size={[aDepth, WALL_HEIGHT, WALL_THICKNESS]}
              />
            ) : null}
          </group>
        )
      })}

      {/* Alcove D + E workstations: identical to Alcove F's setup —
          chair against the east wall (X=+13) facing west, desk in front,
          monitor at the desk's west (back) edge, laptop nearer the sitter,
          two jittered papers. */}
      {THE_STATION_EAST_ALCOVES.bays
        .filter((b) => b.id === 'd' || b.id === 'e')
        .map((b) => {
          const bayCenterZ = (b.northZ + b.southZ) / 2
          const chairX = 13
          const deskCenterX = 11.5
          const deskSize: [number, number, number] = [2, 0.75, 3]
          const deskTopY = deskSize[1]
          // Chair faces west; screens face east toward the sitter.
          const chairFacing = -Math.PI / 2
          const screenFacing = Math.PI / 2
          const monitorX = deskCenterX - deskSize[0] / 2 + 0.4
          const laptopX = deskCenterX + deskSize[0] / 2 - 0.4
          return (
            <group key={`east-alcove-furn-${b.id}`}>
              <Desk
                position={[deskCenterX, bayCenterZ]}
                size={deskSize}
                topColor={COLORS.tableTop}
                legColor={COLORS.tableLegs}
              />
              <Chair
                position={[chairX, 0, bayCenterZ]}
                rotationY={chairFacing}
              />
              <Monitor
                position={[monitorX, bayCenterZ]}
                deskTopY={deskTopY}
                rotationY={screenFacing}
              />
              <Laptop
                position={[laptopX, bayCenterZ]}
                deskTopY={deskTopY}
                rotationY={screenFacing}
              />
              <Paper
                position={[deskCenterX + 0.2, bayCenterZ - 0.6]}
                deskTopY={deskTopY}
                rotationY={b.id === 'd' ? 0.5 : -0.4}
                color="#ede8dc"
              />
              <Paper
                position={[deskCenterX - 0.15, bayCenterZ + 0.55]}
                deskTopY={deskTopY}
                rotationY={b.id === 'd' ? -0.3 : 0.55}
                layer={1}
              />
            </group>
          )
        })}

      {/* Alcove F — expanded west to share a wall with The Boardroom.
          Interior: X ∈ [F_westX, +14], Z ∈ [-45, -39]. Renders:
            - west wall: glass with a west-facing doorway (Z=-42)
              along the original narrow section (X=+9..+14 doorway).
              But since F now extends further west, the "west" wall
              at X=+9 becomes an *interior* wall — no doorway there;
              F is one continuous room whose west boundary is at
              X=THE_STATION_F_EXPANSION.westX (+5), which coincides
              with The Boardroom's east wall (rendered by Boardroom).
            - north wall: split around two openings — a 2m doorway
              at X=+6.5 and a 2m glass panel at X=+8..+9 (west of
              the doorway pair, east of Boardroom's east wall).
              East of X=+9 the north wall is the existing E/F divider.
            - south + east walls: coincide with The Station's south and
              east walls — not drawn here.
      */}
      {(() => {
        const fWestX = THE_STATION_F_EXPANSION.westX
        const fEastX = THE_STATION_EAST_ALCOVES.eastX
        const fBay = THE_STATION_EAST_ALCOVES.bays[2]! // 'f'
        const fCenterZ = (fBay.northZ + fBay.southZ) / 2
        const fDepth = fBay.southZ - fBay.northZ

        const northDoorLo =
          THE_STATION_F_EXPANSION.northDoorX -
          THE_STATION_F_EXPANSION.northDoorWidth / 2
        const northDoorHi =
          THE_STATION_F_EXPANSION.northDoorX +
          THE_STATION_F_EXPANSION.northDoorWidth / 2

        // North wall spans X ∈ [fWestX, fEastX]. Segments (west→east):
        //   [fWestX, northDoorLo]           opaque
        //   [northDoorLo, northDoorHi]      doorway (no panel)
        //   [northDoorHi, +9]               glass panel (2 m)
        //   [+9, fEastX]                    E/F divider (opaque)
        return (
          <group key="east-alcove-f">
            {/* north-wall opaque segment west of doorway */}
            <WallPanel
              position={[(fWestX + northDoorLo) / 2, y, fBay.northZ]}
              size={[northDoorLo - fWestX, WALL_HEIGHT, WALL_THICKNESS]}
            />
            {/* north-wall glass panel east of doorway */}
            <WallPanel
              position={[(northDoorHi + 9) / 2, y, fBay.northZ]}
              size={[9 - northDoorHi, WALL_HEIGHT, WALL_THICKNESS]}
              glass
              divisions={1}
            />
            {/* E/F divider east of X=9 */}
            <WallPanel
              position={[(9 + fEastX) / 2, y, fBay.northZ]}
              size={[fEastX - 9, WALL_HEIGHT, WALL_THICKNESS]}
            />
            <DoorHeader
              position={[THE_STATION_F_EXPANSION.northDoorX, fBay.northZ]}
              width={THE_STATION_F_EXPANSION.northDoorWidth}
              spansX
            />

            {/* F workstation: monitor + laptop + papers + chair. */}
            <Desk
              position={THE_STATION_F_EXPANSION.workstation.deskCenter}
              size={THE_STATION_F_EXPANSION.workstation.deskSize}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />
            <Chair
              position={[
                THE_STATION_F_EXPANSION.workstation.chair[0],
                0,
                THE_STATION_F_EXPANSION.workstation.chair[1],
              ]}
              rotationY={THE_STATION_F_EXPANSION.workstation.chair[2]}
            />
            {/* Screens face east (toward the west-facing sitter at X=13). */}
            <Monitor
              position={[
                THE_STATION_F_EXPANSION.workstation.deskCenter[0] -
                  THE_STATION_F_EXPANSION.workstation.deskSize[0] / 2 +
                  0.4,
                THE_STATION_F_EXPANSION.workstation.deskCenter[1],
              ]}
              deskTopY={THE_STATION_F_EXPANSION.workstation.deskSize[1]}
              rotationY={Math.PI / 2}
            />
            <Laptop
              position={[
                THE_STATION_F_EXPANSION.workstation.deskCenter[0] +
                  THE_STATION_F_EXPANSION.workstation.deskSize[0] / 2 -
                  0.4,
                THE_STATION_F_EXPANSION.workstation.deskCenter[1],
              ]}
              deskTopY={THE_STATION_F_EXPANSION.workstation.deskSize[1]}
              rotationY={Math.PI / 2}
            />
            <Paper
              position={[
                THE_STATION_F_EXPANSION.workstation.deskCenter[0] + 0.2,
                THE_STATION_F_EXPANSION.workstation.deskCenter[1] - 0.6,
              ]}
              deskTopY={THE_STATION_F_EXPANSION.workstation.deskSize[1]}
              rotationY={0.5}
              color="#ede8dc"
            />
            <Paper
              position={[
                THE_STATION_F_EXPANSION.workstation.deskCenter[0] - 0.15,
                THE_STATION_F_EXPANSION.workstation.deskCenter[1] + 0.55,
              ]}
              deskTopY={THE_STATION_F_EXPANSION.workstation.deskSize[1]}
              rotationY={-0.35}
              layer={1}
            />
            {/* referenced-for-completeness; center + depth used only if
                we later add a floor slab or ceiling for F specifically. */}
            {fCenterZ && fDepth ? null : null}
          </group>
        )
      })()}

      {/* The Boardroom — enclosed south room with a big meeting table,
          wall-mounted TV, and glass perimeter. */}
      {(() => {
        const br = THE_BOARDROOM
        const brCenterX = (br.westX + br.eastX) / 2
        const brCenterZ = (br.northZ + br.southZ) / 2
        const brDepth = br.southZ - br.northZ

        // West wall: split around the west-facing doorway at Z=-42.
        const westDoorLo = br.doorCenterZ - br.doorWidth / 2
        const westDoorHi = br.doorCenterZ + br.doorWidth / 2

        return (
          <group key="boardroom">
            {/* west wall — glass, split around doorway */}
            <WallPanel
              position={[br.westX, y, (br.northZ + westDoorLo) / 2]}
              size={[
                WALL_THICKNESS,
                WALL_HEIGHT,
                westDoorLo - br.northZ,
              ]}
              glass
              divisions={1}
            />
            <WallPanel
              position={[br.westX, y, (westDoorHi + br.southZ) / 2]}
              size={[
                WALL_THICKNESS,
                WALL_HEIGHT,
                br.southZ - westDoorHi,
              ]}
              glass
              divisions={1}
            />
            <DoorHeader
              position={[br.westX, br.doorCenterZ]}
              width={br.doorWidth}
              spansX={false}
            />
            <Door
              position={[br.westX, br.doorCenterZ]}
              width={br.doorWidth}
              spansX={false}
              blocking={false}
              open
            />
            {/* east wall — opaque; F's west boundary uses this same plane. */}
            <WallPanel
              position={[br.eastX, y, brCenterZ]}
              size={[WALL_THICKNESS, WALL_HEIGHT, brDepth]}
            />
            {/* north wall — opaque */}
            <WallPanel
              position={[brCenterX, y, br.northZ]}
              size={[br.eastX - br.westX, WALL_HEIGHT, WALL_THICKNESS]}
            />
            {/* south wall coincides with The Station's south wall — not drawn */}

            {/* Wall-mounted TV on the north wall, facing south (+Z) */}
            <Television
              wallAxis="x"
              wallCoord={br.northZ}
              facing={1}
              centerAlong={br.tv.centerX}
              centerY={br.tv.centerY}
              width={br.tv.width}
              height={br.tv.height}
              depth={br.tv.depth}
            />

            {/* Meeting table (brown, matches other conference-style tables) */}
            <Desk
              position={[br.table.centerX, br.table.centerZ]}
              size={br.table.size}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />

            {/* 4 chairs + a laptop each. Laptops sit near each sitter,
                jittered slightly. Screens face the sitter (opposite of
                the chair's facing angle). Two scattered papers on the
                table for texture. */}
            {br.chairs.map(([cx, cz, cr], i) => {
              const screenFacing = cr - Math.PI
              // Nudge the laptop from the chair toward the table
              // center (west-facing sitters at X=+2 → -X nudge; east
              // at X=-2 → +X nudge).
              const nudge = cr > 0 ? 0.9 : -0.9
              return (
                <group key={`br-seat-${i}`}>
                  <Chair position={[cx, 0, cz]} rotationY={cr} />
                  <Laptop
                    position={[cx + nudge, cz]}
                    deskTopY={br.table.size[1]}
                    rotationY={screenFacing}
                  />
                </group>
              )
            })}
            {/* A pair of stray papers near opposite corners of the table. */}
            <Paper
              position={[br.table.centerX - 0.8, br.table.centerZ - 1.6]}
              deskTopY={br.table.size[1]}
              rotationY={0.4}
              color="#ede8dc"
            />
            <Paper
              position={[br.table.centerX + 0.6, br.table.centerZ + 1.8]}
              deskTopY={br.table.size[1]}
              rotationY={-0.5}
              layer={1}
            />
          </group>
        )
      })()}

      {/* Alcove A + B workstations: chair against the north wall facing
          south (toward the alcove doorway), desk in front of the chair,
          monitor at the desk's back edge (north side), laptop nearer the
          sitter, plus two scattered papers. C intentionally left empty. */}
      {THE_STATION_ALCOVES.bays
        .filter((b) => b.id === 'a' || b.id === 'b')
        .map((b) => {
          const bayCenterX = (b.westX + b.eastX) / 2
          // Positions derived from the alcove bounds so the workstation
          // follows the room if it moves.
          const chairZ = THE_STATION_ALCOVES.northZ + 0.6
          const deskCenterZ =
            (THE_STATION_ALCOVES.northZ + THE_STATION_ALCOVES.southZ) / 2
          const deskTopY = STATION_ALCOVE_DESK_SIZE[1]
          const monitorZ = deskCenterZ - STATION_ALCOVE_DESK_SIZE[2] / 2 + 0.4
          const laptopZ = deskCenterZ + STATION_ALCOVE_DESK_SIZE[2] / 2 - 0.4
          // Chair faces south (+Z); screens face north (Math.PI) so the
          // screen surface points back at the sitter.
          const chairFacing = 0
          const screenFacing = Math.PI
          return (
            <group key={`furn-${b.id}`}>
              <Desk
                position={[bayCenterX, deskCenterZ]}
                size={STATION_ALCOVE_DESK_SIZE}
                topColor={COLORS.tableTop}
                legColor={COLORS.tableLegs}
              />
              <Chair
                position={[bayCenterX, 0, chairZ]}
                rotationY={chairFacing}
              />
              <Monitor
                position={[bayCenterX, monitorZ]}
                deskTopY={deskTopY}
                rotationY={screenFacing}
              />
              <Laptop
                position={[bayCenterX, laptopZ]}
                deskTopY={deskTopY}
                rotationY={screenFacing}
              />
              <Paper
                position={[bayCenterX - 0.7, laptopZ + 0.15]}
                deskTopY={deskTopY}
                rotationY={b.id === 'a' ? 0.5 : -0.4}
                color="#ede8dc"
              />
              <Paper
                position={[bayCenterX + 0.55, laptopZ - 0.1]}
                deskTopY={deskTopY}
                rotationY={b.id === 'a' ? -0.3 : 0.55}
                layer={1}
              />
            </group>
          )
        })}

      {/* West-wall workstations along the main floor. Each: desk with a
          chair on its west side facing east; monitor at the desk's east
          (far) edge, laptop nearer the sitter, two scattered papers. */}
      {THE_STATION_WEST_WORKSTATIONS.map((w, i) => {
        const [dcx, dcz] = w.deskCenter
        const [chx, chz, chr] = w.chair
        const deskTopY = w.deskSize[1]
        // Chair faces east (+X); screens face west (-X) → rotationY=-π/2.
        const screenFacing = chr - Math.PI
        // Monitor at desk's east edge (back), laptop near west edge (front).
        const monitorX = dcx + w.deskSize[0] / 2 - 0.4
        const laptopX = dcx - w.deskSize[0] / 2 + 0.4
        return (
          <group key={`ws-w-${i}`}>
            <Desk
              position={[dcx, dcz]}
              size={w.deskSize}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />
            <Chair position={[chx, 0, chz]} rotationY={chr} />
            <Monitor
              position={[monitorX, dcz]}
              deskTopY={deskTopY}
              rotationY={screenFacing}
            />
            <Laptop
              position={[laptopX, dcz]}
              deskTopY={deskTopY}
              rotationY={screenFacing}
            />
            <Paper
              position={[dcx + 0.2, dcz - 0.6]}
              deskTopY={deskTopY}
              rotationY={i === 0 ? 0.5 : -0.4}
              color="#ede8dc"
            />
            <Paper
              position={[dcx - 0.15, dcz + 0.55]}
              deskTopY={deskTopY}
              rotationY={i === 0 ? -0.3 : 0.45}
              layer={1}
            />
          </group>
        )
      })}

      {/* Lounge sofa on the exterior north face of The Boardroom, on The
          Station's main floor. Back flush against the Boardroom's north
          wall (Z=THE_BOARDROOM.northZ = -48), facing north toward
          alcoves A and B. Boardroom north wall is at X ∈ [-4, +5];
          center the sofa on that span. Sofa's local +Z is the sitter's
          gaze direction, so rotationY = π flips it to face -Z (north). */}
      <Sofa
        position={[
          (THE_BOARDROOM.westX + THE_BOARDROOM.eastX) / 2,
          THE_BOARDROOM.northZ - WALL_THICKNESS / 2 - 0.45,
        ]}
        rotationY={Math.PI}
        seatCount={4}
      />

      {/* Catherine — greeter on TheStation's main floor, east of the
          west workstations, facing the west (glass) doorway. Waves
          until the player talks to her. */}
      <Suspense fallback={null}>
        <Catherine position={[-4, 0, -50]} />
      </Suspense>
      <InteractionMarker
        stopId="catherine"
        position={[-4, 2.6, -50]}
        requiresQuest="weekly-status-meeting"
      />
    </>
  )
}
