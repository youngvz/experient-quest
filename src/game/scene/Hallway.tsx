import { RigidBody } from '@react-three/rapier'
import type { ReactElement } from 'react'
import {
  ALCOVE_DESKS,
  ALCOVE_DESK_SIZE,
  COLORS,
  HALLWAY,
  HALLWAY_DESKS,
  HALLWAY_DESK_CHAIRS,
  HALLWAY_DESK_SIZE,
  HALLWAY_KITCHEN_TABLE,
  HALLWAY_SOUTH_DOOR,
  HALLWAY_SOUTH_WINDOWS,
  HALLWAY_WEST_DOOR,
  NE_ALCOVE,
  ROOM_DEPTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chairs'
import { Desk } from './Desk'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Paper } from './Paper'
import { DoorBlocker, DoorHeader, WallPanel } from './Walls'

// Build alternating opaque + glass segments along an axis to render a wall
// with windows cut into it. Returns an array of <WallPanel /> elements. Any
// span from `min` to `max` not covered by a window becomes opaque wall; each
// window becomes a glass panel.
function segmentedWall({
  min,
  max,
  windows,
  y,
  isXAxis,
  fixedAxisValue,
  wallThickness,
  height,
}: {
  min: number
  max: number
  windows: [number, number][] // [center, width]
  y: number
  isXAxis: boolean // true = spans X (front/back/south walls); false = spans Z (side walls)
  fixedAxisValue: number
  wallThickness: number
  height: number
}) {
  const sorted = [...windows].sort((a, b) => a[0] - b[0])
  const panels: ReactElement[] = []
  let cursor = min
  let key = 0

  const pushOpaque = (start: number, end: number) => {
    const width = end - start
    if (width <= 0.001) return
    const center = (start + end) / 2
    const pos: [number, number, number] = isXAxis
      ? [center, y, fixedAxisValue]
      : [fixedAxisValue, y, center]
    const size: [number, number, number] = isXAxis
      ? [width, height, wallThickness]
      : [wallThickness, height, width]
    panels.push(<WallPanel key={`op-${key++}`} position={pos} size={size} />)
  }
  const pushGlass = (start: number, end: number) => {
    const width = end - start
    const center = (start + end) / 2
    const pos: [number, number, number] = isXAxis
      ? [center, y, fixedAxisValue]
      : [fixedAxisValue, y, center]
    const size: [number, number, number] = isXAxis
      ? [width, height, wallThickness]
      : [wallThickness, height, width]
    panels.push(<WallPanel key={`gl-${key++}`} position={pos} size={size} glass />)
  }

  for (const [center, width] of sorted) {
    const lo = center - width / 2
    const hi = center + width / 2
    pushOpaque(cursor, lo)
    pushGlass(lo, hi)
    cursor = hi
  }
  pushOpaque(cursor, max)
  return panels
}

export function Hallway() {
  const y = WALL_HEIGHT / 2
  const halfW = HALLWAY.width / 2
  const northZ = ROOM_DEPTH / 2
  const southZ = northZ + HALLWAY.depth
  const centerZ = (northZ + southZ) / 2
  const westX = HALLWAY.centerX - halfW
  const eastX = HALLWAY.centerX + halfW

  // West wall (glass), split around HALLWAY_WEST_DOOR.
  const wDoorLo = HALLWAY_WEST_DOOR.centerZ - HALLWAY_WEST_DOOR.width / 2
  const wDoorHi = HALLWAY_WEST_DOOR.centerZ + HALLWAY_WEST_DOOR.width / 2

  // South wall segments (opaque with glass windows).
  const sDoorLo = HALLWAY_SOUTH_DOOR.centerX - HALLWAY_SOUTH_DOOR.width / 2
  const sDoorHi = HALLWAY_SOUTH_DOOR.centerX + HALLWAY_SOUTH_DOOR.width / 2

  // NE alcove wall metrics — the alcove sits between hallway col X=NE_ALCOVE.westX
  // and the east wall. Its west wall runs from NE_ALCOVE.upper.northZ to
  // NE_ALCOVE.lower.southZ, with two doorways.
  const { westX: alcoveWestX, upper, lower } = NE_ALCOVE
  const upperDoorLo = upper.doorZ - upper.doorWidth / 2
  const upperDoorHi = upper.doorZ + upper.doorWidth / 2
  const lowerDoorLo = lower.doorZ - lower.doorWidth / 2
  const lowerDoorHi = lower.doorZ + lower.doorWidth / 2

  return (
    <>
      {/* floor — hallway + alcove (single slab) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[HALLWAY.centerX, -0.05, centerZ]}>
          <boxGeometry args={[HALLWAY.width, 0.1, HALLWAY.depth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* west wall — glass, split around west doorway */}
      <WallPanel
        position={[westX, y, (northZ + wDoorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, wDoorLo - northZ]}
        glass
      />
      <WallPanel
        position={[westX, y, (wDoorHi + southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, southZ - wDoorHi]}
        glass
      />
      <DoorHeader
        position={[westX, HALLWAY_WEST_DOOR.centerZ]}
        width={HALLWAY_WEST_DOOR.width}
        spansX={false}
      />
      {/* west doorway is now the entrance to <WestCorridor /> — no blocker */}

      {/* east wall — opaque, full length */}
      <WallPanel
        position={[eastX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, HALLWAY.depth]}
      />

      {/* south wall — opaque with glass windows and a doorway */}
      {segmentedWall({
        min: westX,
        max: sDoorLo,
        windows: HALLWAY_SOUTH_WINDOWS.filter(
          ([c, w]) => c + w / 2 <= sDoorLo,
        ),
        y,
        isXAxis: true,
        fixedAxisValue: southZ,
        wallThickness: WALL_THICKNESS,
        height: WALL_HEIGHT,
      })}
      {segmentedWall({
        min: sDoorHi,
        max: eastX,
        windows: HALLWAY_SOUTH_WINDOWS.filter(
          ([c, w]) => c - w / 2 >= sDoorHi,
        ),
        y,
        isXAxis: true,
        fixedAxisValue: southZ,
        wallThickness: WALL_THICKNESS,
        height: WALL_HEIGHT,
      })}
      <DoorHeader
        position={[HALLWAY_SOUTH_DOOR.centerX, southZ]}
        width={HALLWAY_SOUTH_DOOR.width}
        spansX
      />
      {/* seal the south doorway — later swap for a level-transition sensor */}
      <DoorBlocker
        position={[HALLWAY_SOUTH_DOOR.centerX, southZ]}
        width={HALLWAY_SOUTH_DOOR.width}
        spansX
      />

      {/* NE alcove west wall — glass, split around two doorways */}
      <WallPanel
        position={[alcoveWestX, y, (upper.northZ + upperDoorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, upperDoorLo - upper.northZ]}
        glass
      />
      <WallPanel
        position={[alcoveWestX, y, (upperDoorHi + lower.northZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, lower.northZ - upperDoorHi]}
        glass
      />
      <WallPanel
        position={[alcoveWestX, y, (lower.northZ + lowerDoorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, lowerDoorLo - lower.northZ]}
        glass
      />
      <WallPanel
        position={[alcoveWestX, y, (lowerDoorHi + lower.southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, lower.southZ - lowerDoorHi]}
        glass
      />
      <DoorHeader
        position={[alcoveWestX, upper.doorZ]}
        width={upper.doorWidth}
        spansX={false}
      />
      <DoorHeader
        position={[alcoveWestX, lower.doorZ]}
        width={lower.doorWidth}
        spansX={false}
      />

      {/* NE alcove divider between upper and lower offices — opaque */}
      <WallPanel
        position={[(alcoveWestX + eastX) / 2, y, lower.northZ]}
        size={[eastX - alcoveWestX, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* NE alcove south wall (seals the lower office) */}
      <WallPanel
        position={[(alcoveWestX + eastX) / 2, y, lower.southZ]}
        size={[eastX - alcoveWestX, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* hallway desks + chairs */}
      {HALLWAY_DESKS.map((pos, i) => (
        <Desk key={`h-desk-${i}`} position={pos} size={HALLWAY_DESK_SIZE} />
      ))}
      {HALLWAY_DESK_CHAIRS.map(([x, z, r], i) => (
        <Chair key={`h-chair-${i}`} position={[x, 0, z]} rotationY={r} />
      ))}
      {/* Laptops + monitors on each hallway desk. Chair pairs:
          cluster 0/2 → chair on west (sitter looks east),
          cluster 1/3 → chair on east (sitter looks west).
          Both screens face the sitter (180° from their gaze). Monitors sit
          on the back edge of the desk; laptops nearer the front. Each desk
          has its own position offset + rotation jitter so the four
          workstations don't read as a perfect grid. */}
      {HALLWAY_DESKS.map((pos, i) => {
        const sitOnWest = i % 2 === 0
        const facingSitter = sitOnWest ? -Math.PI / 2 : Math.PI / 2
        // "Back of the desk" (away from sitter) shifts the monitor along X.
        const backX = sitOnWest ? 0.55 : -0.55
        const frontX = sitOnWest ? -0.15 : 0.15
        // Papers go on the desk half nearest the sitter, away from the
        // laptop/monitor. Offsets are in the desk's local X (across the
        // depth-3 axis is Z). Each paper: [dxFromFront, dz, rotation, color?].
        // dxFromFront positive → toward the sitter's edge.
        type P = { dxFromFront: number; dz: number; rot: number; color?: string }
        const paperSets: P[][] = [
          // NW desk (i=0): 2 papers, stacked and rotated
          [
            { dxFromFront: -0.05, dz: 0.9, rot: 0.35 },
            { dxFromFront: 0.05, dz: 0.95, rot: -0.15, color: '#ede8dc' },
          ],
          // NE desk (i=1): 1 paper
          [{ dxFromFront: 0.02, dz: -0.85, rot: -0.4 }],
          // SW desk (i=2): 1 paper, tilted hard
          [{ dxFromFront: -0.1, dz: -0.6, rot: 0.7 }],
          // SE desk (i=3): 2 papers, offset stack
          [
            { dxFromFront: 0.0, dz: 0.8, rot: -0.25, color: '#f0ece0' },
            { dxFromFront: -0.08, dz: 0.7, rot: 0.5 },
          ],
        ]
        const papers = paperSets[i] ?? []
        // Local X direction toward the sitter (negative of the "front" offset
        // because frontX already points TOWARD the sitter, so we reuse it).
        const towardSitterX = sitOnWest ? -1 : 1
        const laptopJitter: { dx: number; dz: number; dr: number }[] = [
          { dx: 0, dz: 0.4, dr: 0.25 },
          { dx: 0, dz: -0.5, dr: -0.35 },
          { dx: 0, dz: -0.35, dr: -0.2 },
          { dx: 0, dz: 0.55, dr: 0.4 },
        ]
        const monitorJitter: { dz: number; dr: number }[] = [
          { dz: -0.5, dr: -0.1 },
          { dz: 0.4, dr: 0.12 },
          { dz: 0.5, dr: 0.08 },
          { dz: -0.45, dr: -0.15 },
        ]
        const lj = laptopJitter[i]
        const mj = monitorJitter[i]
        return (
          <group key={`h-work-${i}`}>
            <Laptop
              position={[pos[0] + frontX + lj.dx, pos[1] + lj.dz]}
              deskTopY={HALLWAY_DESK_SIZE[1]}
              rotationY={facingSitter + lj.dr}
            />
            <Monitor
              position={[pos[0] + backX, pos[1] + mj.dz]}
              deskTopY={HALLWAY_DESK_SIZE[1]}
              rotationY={facingSitter + mj.dr}
            />
            {papers.map((p, k) => (
              <Paper
                key={`h-paper-${i}-${k}`}
                position={[
                  pos[0] + towardSitterX * (0.7 + p.dxFromFront),
                  pos[1] + p.dz,
                ]}
                deskTopY={HALLWAY_DESK_SIZE[1]}
                rotationY={p.rot}
                layer={k}
                color={p.color}
              />
            ))}
          </group>
        )
      })}

      {/* long prep-style table west of the sink cabinets, matching the alcove
          desks' white top + light-grey legs */}
      <Desk
        position={HALLWAY_KITCHEN_TABLE.position}
        size={HALLWAY_KITCHEN_TABLE.size}
        topColor="#f3f1ec"
        legColor="#b8b8bc"
      />

      {/* alcove desks — white top with light-grey legs to contrast the hallway
          workbenches */}
      {ALCOVE_DESKS.map((pos, i) => (
        <Desk
          key={`a-desk-${i}`}
          position={pos}
          size={ALCOVE_DESK_SIZE}
          topColor="#f3f1ec"
          legColor="#b8b8bc"
        />
      ))}
      {/* a single paper on each alcove desk, tilted */}
      {ALCOVE_DESKS.map((pos, i) => (
        <Paper
          key={`a-paper-${i}`}
          position={[pos[0] + (i === 0 ? -0.7 : 0.6), pos[1] + (i === 0 ? 0.3 : -0.2)]}
          deskTopY={ALCOVE_DESK_SIZE[1]}
          rotationY={i === 0 ? 0.5 : -0.6}
          color={i === 0 ? '#ede8dc' : undefined}
        />
      ))}
    </>
  )
}
