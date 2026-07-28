import { RigidBody } from '@react-three/rapier'
import { Suspense, useMemo, type ReactElement } from 'react'
import { useEmployeeUrl } from '../characters/roster'
import {
  THE_BAKERY_ALCOVE_DESKS,
  THE_BAKERY_ALCOVE_DESK_SIZE,
  COLORS,
  THE_BAKERY,
  THE_BAKERY_DESKS,
  THE_BAKERY_DESK_CHAIRS,
  THE_BAKERY_DESK_SIZE,
  THE_BAKERY_EAST_CABINETS,
  THE_BAKERY_KITCHEN_TABLE,
  THE_BAKERY_SOUTH_DOOR,
  THE_BAKERY_SOUTH_WINDOWS,
  THE_BAKERY_WEST_DOOR,
  THE_BAKERY_NE_ALCOVE,
  ROOM_DEPTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { useGameStore } from '../state/gameStore'
import { CabinetRow } from './CabinetRow'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Door } from './Door'
import { Employee } from './Employee'
import { FaxMachine } from './FaxMachine'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Mug } from './Mug'
import { Painting } from './Painting'
import { Paper } from './Paper'
import { WaterCooler } from './WaterCooler'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Waves until the player finishes talking to Sarah, then swaps to idle.
const SARAH_WAVE = [/wave/i, /greet/i, /hello/i]
const SARAH_IDLE = [/idle/i, /stand/i, /breath/i]

function Sarah({ position }: { position: [number, number, number] }) {
  const hasSpoken = useGameStore((s) => s.completedStopIds.has('sarah'))
  const clipPatterns = useMemo(
    () => (hasSpoken ? SARAH_IDLE : SARAH_WAVE),
    [hasSpoken],
  )
  const url = useEmployeeUrl('sarah')
  return (
    <Employee
      url={url}
      position={position}
      rotationY={-Math.PI / 2}
      clipPatterns={clipPatterns}
    />
  )
}

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

export function TheBakery() {
  const laptopUsed = useGameStore((s) => s.completedStopIds.has('bakery-laptop'))
  const y = WALL_HEIGHT / 2
  const halfW = THE_BAKERY.width / 2
  const northZ = ROOM_DEPTH / 2
  const southZ = northZ + THE_BAKERY.depth
  const centerZ = (northZ + southZ) / 2
  const westX = THE_BAKERY.centerX - halfW
  const eastX = THE_BAKERY.centerX + halfW

  // West wall (glass), split around THE_BAKERY_WEST_DOOR.
  const wDoorLo = THE_BAKERY_WEST_DOOR.centerZ - THE_BAKERY_WEST_DOOR.width / 2
  const wDoorHi = THE_BAKERY_WEST_DOOR.centerZ + THE_BAKERY_WEST_DOOR.width / 2

  // South wall segments (opaque with glass windows).
  const sDoorLo = THE_BAKERY_SOUTH_DOOR.centerX - THE_BAKERY_SOUTH_DOOR.width / 2
  const sDoorHi = THE_BAKERY_SOUTH_DOOR.centerX + THE_BAKERY_SOUTH_DOOR.width / 2

  // NE alcove wall metrics — the alcove sits between The Bakery col X=THE_BAKERY_NE_ALCOVE.westX
  // and the east wall. Its west wall runs from THE_BAKERY_NE_ALCOVE.upper.northZ to
  // THE_BAKERY_NE_ALCOVE.lower.southZ, with two doorways.
  const { westX: alcoveWestX, upper, lower } = THE_BAKERY_NE_ALCOVE
  const upperDoorLo = upper.doorZ - upper.doorWidth / 2
  const upperDoorHi = upper.doorZ + upper.doorWidth / 2
  const lowerDoorLo = lower.doorZ - lower.doorWidth / 2
  const lowerDoorHi = lower.doorZ + lower.doorWidth / 2

  return (
    <>
      {/* floor — The Bakery + alcove (single slab) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[THE_BAKERY.centerX, -0.05, centerZ]}>
          <boxGeometry args={[THE_BAKERY.width, 0.1, THE_BAKERY.depth]} />
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
        position={[westX, THE_BAKERY_WEST_DOOR.centerZ]}
        width={THE_BAKERY_WEST_DOOR.width}
        spansX={false}
      />
      {/* west doorway is now the entrance to <CentralCorridor /> — no blocker */}

      {/* east wall — opaque, full length */}
      <WallPanel
        position={[eastX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, THE_BAKERY.depth]}
      />

      {/* south wall — opaque with glass windows and a doorway */}
      {segmentedWall({
        min: westX,
        max: sDoorLo,
        windows: THE_BAKERY_SOUTH_WINDOWS.filter(
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
        windows: THE_BAKERY_SOUTH_WINDOWS.filter(
          ([c, w]) => c - w / 2 >= sDoorHi,
        ),
        y,
        isXAxis: true,
        fixedAxisValue: southZ,
        wallThickness: WALL_THICKNESS,
        height: WALL_HEIGHT,
      })}
      <DoorHeader
        position={[THE_BAKERY_SOUTH_DOOR.centerX, southZ]}
        width={THE_BAKERY_SOUTH_DOOR.width}
        spansX
      />
      {/* Glass door — visible pane + handle. blocking=true seals the opening
          in place of the old invisible DoorBlocker; swap for a sensor
          collider when this becomes a level transition. */}
      <Door
        position={[THE_BAKERY_SOUTH_DOOR.centerX, southZ]}
        width={THE_BAKERY_SOUTH_DOOR.width}
        spansX
        blocking
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

      {/* The Bakery desks + chairs */}
      {THE_BAKERY_DESKS.map((pos, i) => (
        <Desk key={`h-desk-${i}`} position={pos} size={THE_BAKERY_DESK_SIZE} />
      ))}
      {THE_BAKERY_DESK_CHAIRS.map(([x, z, r], i) => (
        <Chair key={`h-chair-${i}`} position={[x, 0, z]} rotationY={r} />
      ))}
      {/* Laptops + monitors on each The Bakery desk. Chair pairs:
          cluster 0/2 → chair on west (sitter looks east),
          cluster 1/3 → chair on east (sitter looks west).
          Both screens face the sitter (180° from their gaze). Monitors sit
          on the back edge of the desk; laptops nearer the front. Each desk
          has its own position offset + rotation jitter so the four
          workstations don't read as a perfect grid. */}
      {THE_BAKERY_DESKS.map((pos, i) => {
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
              deskTopY={THE_BAKERY_DESK_SIZE[1]}
              rotationY={facingSitter + lj.dr}
              flashing={i === 0 && !laptopUsed}
            />
            <Monitor
              position={[pos[0] + backX, pos[1] + mj.dz]}
              deskTopY={THE_BAKERY_DESK_SIZE[1]}
              rotationY={facingSitter + mj.dr}
            />
            {papers.map((p, k) => (
              <Paper
                key={`h-paper-${i}-${k}`}
                position={[
                  pos[0] + towardSitterX * (0.7 + p.dxFromFront),
                  pos[1] + p.dz,
                ]}
                deskTopY={THE_BAKERY_DESK_SIZE[1]}
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
        position={THE_BAKERY_KITCHEN_TABLE.position}
        size={THE_BAKERY_KITCHEN_TABLE.size}
        topColor="#f3f1ec"
        legColor="#b8b8bc"
      />

      {/* alcove desks — white top with light-grey legs to contrast the The Bakery
          workbenches */}
      {THE_BAKERY_ALCOVE_DESKS.map((pos, i) => (
        <Desk
          key={`a-desk-${i}`}
          position={pos}
          size={THE_BAKERY_ALCOVE_DESK_SIZE}
          topColor="#f3f1ec"
          legColor="#b8b8bc"
        />
      ))}
      {/* a single paper on each alcove desk, tilted */}
      {THE_BAKERY_ALCOVE_DESKS.map((pos, i) => (
        <Paper
          key={`a-paper-${i}`}
          position={[pos[0] + (i === 0 ? -0.7 : 0.6), pos[1] + (i === 0 ? 0.3 : -0.2)]}
          deskTopY={THE_BAKERY_ALCOVE_DESK_SIZE[1]}
          rotationY={i === 0 ? 0.5 : -0.6}
          color={i === 0 ? '#ede8dc' : undefined}
        />
      ))}
      <CabinetRow config={THE_BAKERY_EAST_CABINETS} />

      {/* Kitchen-area water cooler tucked against the south wall in
          the opaque strip between the two east glass panes, spigot
          facing north into the room. */}
      <WaterCooler position={[0, 19.4]} rotationY={Math.PI / 2} />

      {/* Mugs on the long prep table — a small cluster for texture. */}
      <Mug
        position={[THE_BAKERY_KITCHEN_TABLE.position[0] - 1.2, THE_BAKERY_KITCHEN_TABLE.position[1]]}
        deskTopY={THE_BAKERY_KITCHEN_TABLE.size[1]}
        color="black"
      />
      <Mug
        position={[THE_BAKERY_KITCHEN_TABLE.position[0] - 0.9, THE_BAKERY_KITCHEN_TABLE.position[1] + 0.25]}
        deskTopY={THE_BAKERY_KITCHEN_TABLE.size[1]}
        color="black"
        rotationY={0.6}
      />
      <Mug
        position={[THE_BAKERY_KITCHEN_TABLE.position[0] - 0.6, THE_BAKERY_KITCHEN_TABLE.position[1] - 0.2]}
        deskTopY={THE_BAKERY_KITCHEN_TABLE.size[1]}
        color="black"
        rotationY={-0.8}
      />

      {/* Fax + phone shared between the two south-cluster desks. Sits on
          the south-east desk in the SE cluster. */}
      <FaxMachine
        position={[THE_BAKERY_DESKS[3]![0] + 0.55, THE_BAKERY_DESKS[3]![1] + 1.1]}
        deskTopY={THE_BAKERY_DESK_SIZE[1]}
        rotationY={Math.PI / 2}
      />

      {/* A single painting on the east (opaque) wall of the bakery,
          hung above the sink cabinet row. East wall X = ROOM_WIDTH/2 = +10;
          cabinets span Z ≈ [15, 22], so center the painting at Z=19. */}
      <Painting
        centerZ={17}
        wallX={halfW + THE_BAKERY.centerX}
        facing={-1}
        centerY={2.1}
        size={[1.4, 1.0]}
        color="#c99a3f"
      />

      {/* Sarah — standing just west of the kitchen table in the open
          floor between the desks and the kitchen. Facing west toward
          the desks / west door. Waves until the player talks to her. */}
      <Suspense fallback={null}>
        <Sarah position={[2.5, 0, 17]} />
      </Suspense>
    </>
  )
}
