import { RigidBody } from '@react-three/rapier'
import { Suspense, useMemo } from 'react'
import { CHARACTERS } from '../characters/characters'
import {
  COLORS,
  CORRIDOR_POCKET,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { useGameStore } from '../state/gameStore'
import { Desk } from './Desk'
import { Employee } from './Employee'
import { InteractionMarker } from './InteractionMarker'
import { WallPanel } from './wallPrimitives'

// Wave clips vs idle-only clips. Swapping the array identity re-runs the
// Employee's animation effect, which stops the wave and starts the idle.
const DISTASI_WAVE = [/wave/i, /greet/i, /hello/i]
const DISTASI_IDLE = [/idle/i, /stand/i, /breath/i]

function Distasi({ position }: { position: [number, number, number] }) {
  const hasSpoken = useGameStore((s) => s.completedStopIds.has('distasi'))
  const clipPatterns = useMemo(
    () => (hasSpoken ? DISTASI_IDLE : DISTASI_WAVE),
    [hasSpoken],
  )
  return (
    <Employee
      url={CHARACTERS.distasi.glbUrl}
      position={position}
      rotationY={0}
      clipPatterns={clipPatterns}
    />
  )
}

// Narrow workbench + backless stools that live in the middle of the pocket.
// Long axis runs along Z so seating fits on the east and west sides.
const POCKET_DESK_SIZE: [number, number, number] = [2, 0.75, 4]

function Stool({
  position,
  seatColor,
  legColor,
}: {
  position: [number, number, number]
  seatColor: string
  legColor: string
}) {
  const seatSize = 0.42
  const seatThickness = 0.06
  const seatTopY = 0.45
  const seatCenterY = seatTopY - seatThickness / 2
  const legT = 0.04
  const legInset = 0.05
  const legHeight = seatTopY - seatThickness
  const legY = legHeight / 2
  const legOffset = seatSize / 2 - legInset - legT / 2
  const legPositions: [number, number][] = [
    [-legOffset, -legOffset],
    [legOffset, -legOffset],
    [-legOffset, legOffset],
    [legOffset, legOffset],
  ]
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, seatCenterY, 0]}>
        <boxGeometry args={[seatSize, seatThickness, seatSize]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>
      {legPositions.map(([lx, lz], i) => (
        <mesh key={i} castShadow position={[lx, legY, lz]}>
          <boxGeometry args={[legT, legHeight, legT]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
      ))}
    </group>
  )
}

// 3×3 open pocket at the T-junction between the west and east corridors.
// The west side is open to the central corridor (that wall's cutout is
// declared in CentralCorridor.tsx). The south side is open to the east
// corridor (that wall's cutout is declared in EastCorridor.tsx). Only the
// north and east perimeter walls are rendered here.
export function CorridorPocket() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, southZ } = CORRIDOR_POCKET
  const centerX = (westX + eastX) / 2
  const centerZ = (northZ + southZ) / 2
  const width = eastX - westX
  const depth = southZ - northZ

  // Three stools per long (east/west) side; offset from the desk edge by
  // half a stool width plus a small gap so they don't clip into the desk.
  const stoolOffset = POCKET_DESK_SIZE[0] / 2 + 0.35
  const stoolZs = [centerZ - 1.2, centerZ, centerZ + 1.2]

  return (
    <>
      {/* floor slab */}
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

      {/* east wall */}
      <WallPanel
        position={[eastX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
      />

      <Desk
        position={[centerX, centerZ]}
        size={POCKET_DESK_SIZE}
        topColor={COLORS.tableTop}
        legColor={COLORS.tableLegs}
      />

      {stoolZs.map((sz) => (
        <Stool
          key={`w-${sz}`}
          position={[centerX - stoolOffset, 0, sz]}
          seatColor={COLORS.tableTop}
          legColor={COLORS.tableLegs}
        />
      ))}
      {stoolZs.map((sz) => (
        <Stool
          key={`e-${sz}`}
          position={[centerX + stoolOffset, 0, sz]}
          seatColor={COLORS.tableTop}
          legColor={COLORS.tableLegs}
        />
      ))}

      {/* Distasi — stationed against the pocket's west wall, facing south so
          he greets anyone coming up the central corridor or south from the
          east corridor. Waves until the player talks to him. */}
      <Suspense fallback={null}>
        <Distasi position={[westX + 0.5, 0, centerZ + 1]} />
      </Suspense>
      <InteractionMarker stopId="distasi" position={[westX + 0.5, 2.6, centerZ + 1]} />
    </>
  )
}
