import { RigidBody } from '@react-three/rapier'
import { Suspense, useMemo } from 'react'
import { CHARACTERS } from '../characters/characters'
import {
  COLORS,
  THE_LAB,
  THE_LAB_ALCOVES,
  THE_LAB_CABINETS,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { useGameStore } from '../state/gameStore'
import { CabinetRow } from './CabinetRow'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Employee } from './Employee'
import { KitchenStation } from './KitchenStation'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Paper } from './Paper'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Waves until the player finishes talking to Juan, then swaps to idle.
const JUAN_WAVE = [/wave/i, /greet/i, /hello/i]
const JUAN_IDLE = [/idle/i, /stand/i, /breath/i]

function Juan({ position }: { position: [number, number, number] }) {
  const hasSpoken = useGameStore((s) => s.completedStopIds.has('juan'))
  const clipPatterns = useMemo(
    () => (hasSpoken ? JUAN_IDLE : JUAN_WAVE),
    [hasSpoken],
  )
  return (
    <Employee
      url={CHARACTERS.juan.glbUrl}
      position={position}
      rotationY={(5 * Math.PI) / 4}
      clipPatterns={clipPatterns}
    />
  )
}

// Alcove desk metrics — 3m wide (along Z) × 2m deep (along X). Placed
// against the east wall so the desk's back edge is at the wall and its
// front edge faces west into the alcove, matching the door orientation.
const ALCOVE_DESK_SIZE: [number, number, number] = [2, 0.75, 3]

// TheLab interior workstations. Two clusters:
//   - North: two 6m × 3m shared tables stacked back-to-back at Z=-28.5
//     and Z=-25.5 (no aisle between). Each table has two sitters on its
//     outer long edge, facing across the table.
//   - South: a shared 4m × 3m table at Z=-18 with two sitters facing
//     each other across it.
const TL_NORTH_DESK_SIZE: [number, number, number] = [6, 0.75, 3]
const TL_SOUTH_DESK_SIZE: [number, number, number] = [4, 0.75, 3]

// First branch room off the central corridor's east wall. L-shaped:
// runs the full 20 m width of the east corridor, with a bite cut out of
// its SW corner where the corridor pocket sits.
//
// The three east-side alcoves are carved into TheLab's interior (not
// hanging off the east wall). Their doorways face WEST, back into the
// room; TheLab's floor slab covers them, so each alcove only renders
// its interior partition walls.
//
// TheLab renders:
//   - two floor slabs (one for each rect of the L)
//   - its north wall (single 20 m span at Z = northZ)
//   - its east wall (single continuous span)
//   - three interior alcoves (walls only; floor is TheLab's floor)
//
// TheLab does NOT render:
//   - west wall: it's the central corridor's east wall, with a doorway
//     already carved at THE_LAB.doorCenterZ by CentralCorridor.tsx
//   - south wall: composed from three existing walls owned by
//     CorridorPocket.tsx (north + east walls of the pocket) and
//     EastCorridor.tsx (north wall of the east corridor)
export function TheLab() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, westSouthZ, eastSouthZ, stepX } = THE_LAB

  const westRectCenterX = (westX + stepX) / 2
  const westRectCenterZ = (northZ + westSouthZ) / 2
  const westRectWidth = stepX - westX
  const westRectDepth = westSouthZ - northZ

  const eastRectCenterX = (stepX + eastX) / 2
  const eastRectCenterZ = (northZ + eastSouthZ) / 2
  const eastRectWidth = eastX - stepX
  const eastRectDepth = eastSouthZ - northZ

  // Alcoves share edges: if bay[i].southZ == bay[i+1].northZ, only one
  // divider wall is needed between them. Draw north edges always, and
  // draw the south edge only when it doesn't coincide with the next
  // bay's north edge.
  const bays = THE_LAB_ALCOVES.bays
  const { westX: aWestX, eastX: aEastX } = THE_LAB_ALCOVES
  const alcoveWidth = aEastX - aWestX

  return (
    <>
      {/* floor — west rect of the L */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          receiveShadow
          position={[westRectCenterX, -0.05, westRectCenterZ]}
        >
          <boxGeometry args={[westRectWidth, 0.1, westRectDepth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* floor — east rect of the L */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          receiveShadow
          position={[eastRectCenterX, -0.05, eastRectCenterZ]}
        >
          <boxGeometry args={[eastRectWidth, 0.1, eastRectDepth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* north wall — full 20 m span */}
      <WallPanel
        position={[(westX + eastX) / 2, y, northZ]}
        size={[eastX - westX, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* east wall — continuous, alcoves live inside so no cutout here */}
      <WallPanel
        position={[eastX, y, (northZ + eastSouthZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, eastSouthZ - northZ]}
      />

      {/* Alcoves — carved into TheLab's east interior. Each renders its
          west wall (split around a west-facing doorway) plus perimeter
          divider walls where not shared with a neighboring bay. */}
      {bays.map((b, i) => {
        const doorLo = b.doorZ - b.doorWidth / 2
        const doorHi = b.doorZ + b.doorWidth / 2
        const centerX = (aWestX + aEastX) / 2

        // Two ways a bay edge can be "already covered":
        //   1. it touches a neighboring bay — draw once as the shared divider
        //   2. it sits flush with TheLab's own perimeter — skip entirely
        //      because that plane is already drawn elsewhere.
        const prev = bays[i - 1]
        const next = bays[i + 1]
        const northSharesNeighbor =
          !!prev && Math.abs(prev.southZ - b.northZ) < 0.01
        const southSharesNeighbor =
          !!next && Math.abs(b.southZ - next.northZ) < 0.01
        const northFlushWithPerimeter = Math.abs(b.northZ - northZ) < 0.01
        const southFlushWithPerimeter =
          Math.abs(b.southZ - eastSouthZ) < 0.01
        const shareNorth = northSharesNeighbor || northFlushWithPerimeter
        const shareSouth = southSharesNeighbor || southFlushWithPerimeter

        return (
          <group key={`alcove-${i}`}>
            {/* west wall — split around the doorway */}
            <WallPanel
              position={[aWestX, y, (b.northZ + doorLo) / 2]}
              size={[WALL_THICKNESS, WALL_HEIGHT, doorLo - b.northZ]}
            />
            <WallPanel
              position={[aWestX, y, (doorHi + b.southZ) / 2]}
              size={[WALL_THICKNESS, WALL_HEIGHT, b.southZ - doorHi]}
            />
            <DoorHeader
              position={[aWestX, b.doorZ]}
              width={b.doorWidth}
              spansX={false}
            />
            {/* north wall — only if not shared with the previous bay */}
            {!shareNorth ? (
              <WallPanel
                position={[centerX, y, b.northZ]}
                size={[alcoveWidth, WALL_HEIGHT, WALL_THICKNESS]}
              />
            ) : null}
            {/* south wall — only if not shared with the next bay */}
            {!shareSouth ? (
              <WallPanel
                position={[centerX, y, b.southZ]}
                size={[alcoveWidth, WALL_HEIGHT, WALL_THICKNESS]}
              />
            ) : null}
            {/* shared divider — drawn once, on the boundary with the next bay */}
            {southSharesNeighbor ? (
              <WallPanel
                position={[centerX, y, b.southZ]}
                size={[alcoveWidth, WALL_HEIGHT, WALL_THICKNESS]}
              />
            ) : null}
          </group>
        )
      })}

      {/* Bay A gets a smoking kitchen station against its east (back)
          wall, facing west toward the alcove doorway. Station is 1.2 m
          wide × 0.7 m deep — back face flush at X ≈ 9.8. */}
      <KitchenStation position={[9.45, -27]} rotationY={-Math.PI / 2} smoke />

      {/* Logan stands ~1.5 m west of the kitchen station, facing east
          (+X) so he's looking straight at the smoking cooktop. */}
      <Employee
        url={CHARACTERS.logan.glbUrl}
        position={[7.5, 0, -27]}
        rotationY={Math.PI / 2}
      />

      {/* Bay B and C furnishings: desk + chair against the east wall,
          chair facing west (toward the doorway), monitor at the desk's
          back edge, laptop nearer the chair. */}
      {bays
        .filter((b) => b.id === 'b' || b.id === 'c')
        .map((b) => {
          const bayCenterZ = (b.northZ + b.southZ) / 2
          const chairX = 9 // 1 m clearance from east wall (X=+10)
          const deskCenterX = 7.5 // between chair and doorway
          const deskTopY = ALCOVE_DESK_SIZE[1]
          const monitorX = deskCenterX - ALCOVE_DESK_SIZE[0] / 2 + 0.4
          const laptopX = deskCenterX + ALCOVE_DESK_SIZE[0] / 2 - 0.4
          // Chair facing west; screens face east (toward sitter).
          const chairFacing = -Math.PI / 2
          const screenFacing = Math.PI / 2
          return (
            <group key={`furn-${b.id}`}>
              <Desk
                position={[deskCenterX, bayCenterZ]}
                size={ALCOVE_DESK_SIZE}
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
              {/* Two scattered papers per alcove desk, tilted. */}
              <Paper
                position={[laptopX - 0.3, bayCenterZ - 0.6]}
                deskTopY={deskTopY}
                rotationY={b.id === 'b' ? 0.5 : -0.4}
                color="#ede8dc"
              />
              <Paper
                position={[laptopX - 0.1, bayCenterZ + 0.7]}
                deskTopY={deskTopY}
                rotationY={b.id === 'b' ? -0.3 : 0.55}
                layer={1}
              />
            </group>
          )
        })}

      {/* North cluster — two 6×3 shared tables back-to-back (no aisle),
          shifted +1 X. Each has two sitters on its outer long edge with
          laptops + monitors + a paper or two, screens facing the sitter.
          Monitors sit at the desk's far edge from the sitter; papers
          scatter around the laptop with slight rotations. */}
      {[
        // Top table — sitters at Z=-30 face south (+Z).
        //   sitter direction = +Z, so screens face -Z (rotationY = Math.PI)
        //   "far edge" from sitter is at Z=-27 (south edge of the table)
        {
          center: [-4, -28.5] as [number, number],
          screenFacing: Math.PI, // -Z
          sitterZ: -30,
          laptopZ: -28.8,
          monitorZ: -27.4,
          paperZs: [-29.2, -28.5] as [number, number],
          chairs: [
            [-6, -30, 0] as [number, number, number],
            [-2, -30, 0] as [number, number, number],
          ],
        },
        // Bottom table — sitters at Z=-24 face north (-Z).
        //   screens face +Z (rotationY = 0)
        //   "far edge" from sitter is at Z=-27 (north edge of the table)
        {
          center: [-4, -25.5] as [number, number],
          screenFacing: 0,
          sitterZ: -24,
          laptopZ: -25.2,
          monitorZ: -26.6,
          paperZs: [-24.8, -25.5] as [number, number],
          chairs: [
            [-6, -24, Math.PI] as [number, number, number],
            [-2, -24, Math.PI] as [number, number, number],
          ],
        },
      ].map((t, i) => (
        <group key={`tl-n-${i}`}>
          <Desk
            position={t.center}
            size={TL_NORTH_DESK_SIZE}
            topColor={COLORS.tableTop}
            legColor={COLORS.tableLegs}
          />
          {t.chairs.map(([cx, cz, cr], j) => {
            // Per-sitter jitter so the layout doesn't read as a grid.
            const laptopDx = j === 0 ? 0.12 : -0.15
            const laptopDr = j === 0 ? 0.22 : -0.18
            const monitorDx = j === 0 ? -0.18 : 0.14
            const monitorDr = j === 0 ? -0.1 : 0.12
            const p1Dx = j === 0 ? -0.32 : 0.28
            const p1Dr = j === 0 ? 0.55 : -0.4
            const p2Dx = j === 0 ? 0.18 : -0.22
            const p2Dr = j === 0 ? -0.3 : 0.5
            return (
              <group key={j}>
                <Chair position={[cx, 0, cz]} rotationY={cr} />
                <Laptop
                  position={[cx + laptopDx, t.laptopZ]}
                  deskTopY={TL_NORTH_DESK_SIZE[1]}
                  rotationY={t.screenFacing + laptopDr}
                />
                <Monitor
                  position={[cx + monitorDx, t.monitorZ]}
                  deskTopY={TL_NORTH_DESK_SIZE[1]}
                  rotationY={t.screenFacing + monitorDr}
                />
                <Paper
                  position={[cx + p1Dx, t.paperZs[0]]}
                  deskTopY={TL_NORTH_DESK_SIZE[1]}
                  rotationY={p1Dr}
                  color="#ede8dc"
                />
                <Paper
                  position={[cx + p2Dx, t.paperZs[1]]}
                  deskTopY={TL_NORTH_DESK_SIZE[1]}
                  rotationY={p2Dr}
                  layer={1}
                />
              </group>
            )
          })}
        </group>
      ))}

      {/* South cluster — two shared 4×3 tables. Each has two sitters
          facing each other across the table (west sitter faces east,
          east sitter faces west). Screens face their sitter, plus
          jittered monitors and papers per sitter. */}
      {[
        // East end of the Z=-18 row.
        [0.5, -18],
        // South table in TheLab's SE rectangle.
        [0.5, -13],
      ].map(([cx, cz]) => {
        // Two sitters per table: west and east. For each, an offset
        // toward the middle of the desk (where the laptop + monitor sit)
        // and along-Z jitter for papers.
        const sitters = [
          {
            // West sitter, faces east (+X). Screens face west (-X).
            chair: [cx - 2.5, cz, Math.PI / 2] as [number, number, number],
            screenFacing: -Math.PI / 2,
            laptopX: cx - 1.3,
            monitorX: cx - 0.6, // deeper into the desk (toward far edge)
            paperZs: [cz - 0.5, cz + 0.6] as [number, number],
            jitter: { lDr: 0.15, mDr: -0.1, p1Dr: 0.45, p2Dr: -0.35 },
          },
          {
            // East sitter, faces west (-X). Screens face east (+X).
            chair: [cx + 2.5, cz, -Math.PI / 2] as [number, number, number],
            screenFacing: Math.PI / 2,
            laptopX: cx + 1.3,
            monitorX: cx + 0.6,
            paperZs: [cz + 0.4, cz - 0.6] as [number, number],
            jitter: { lDr: -0.2, mDr: 0.08, p1Dr: -0.5, p2Dr: 0.4 },
          },
        ]
        return (
          <group key={`tl-s-${cx}-${cz}`}>
            <Desk
              position={[cx, cz]}
              size={TL_SOUTH_DESK_SIZE}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />
            {sitters.map((s, j) => (
              <group key={j}>
                <Chair position={[s.chair[0], 0, s.chair[1]]} rotationY={s.chair[2]} />
                <Laptop
                  position={[s.laptopX, s.chair[1] + (j === 0 ? -0.15 : 0.18)]}
                  deskTopY={TL_SOUTH_DESK_SIZE[1]}
                  rotationY={s.screenFacing + s.jitter.lDr}
                />
                <Monitor
                  position={[s.monitorX, s.chair[1] + (j === 0 ? 0.25 : -0.2)]}
                  deskTopY={TL_SOUTH_DESK_SIZE[1]}
                  rotationY={s.screenFacing + s.jitter.mDr}
                />
                <Paper
                  position={[s.laptopX + (j === 0 ? 0.1 : -0.15), s.paperZs[0]]}
                  deskTopY={TL_SOUTH_DESK_SIZE[1]}
                  rotationY={s.jitter.p1Dr}
                  color="#f0ece0"
                />
                <Paper
                  position={[s.laptopX + (j === 0 ? -0.2 : 0.12), s.paperZs[1]]}
                  deskTopY={TL_SOUTH_DESK_SIZE[1]}
                  rotationY={s.jitter.p2Dr}
                  layer={1}
                />
              </group>
            ))}
          </group>
        )
      })}
      <CabinetRow config={THE_LAB_CABINETS} />

      {/* Two kitchen holding stations against TheLab's north wall
          (Z = northZ = -32), facing south into the room. Placed east
          of the north desk clusters, west of Alcove A's west wall at
          X=5. Each station is 1.2 m wide × 0.7 m deep; back face flush
          with the wall's interior at Z ≈ -31.8. */}
      <KitchenStation position={[1, -31.45]} rotationY={0} />
      <KitchenStation position={[2.8, -31.45]} rotationY={0} />


      {/* Juan — greeter in TheLab's main lobby, near the L's inner
          corner between the west doorway and the south desk clusters.
          Waves until the player talks to him. */}
      <Suspense fallback={null}>
        <Juan position={[-3, 0, -20]} />
      </Suspense>
    </>
  )
}
