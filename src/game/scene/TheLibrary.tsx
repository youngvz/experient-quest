import { RigidBody } from '@react-three/rapier'
import { Suspense } from 'react'
import { useEmployeeUrl } from '../characters/roster'
import {
  COLORS,
  THE_LIBRARY,
  THE_LIBRARY_DESKS,
  THE_LIBRARY_WHITEBOARDS,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Chair } from './Chair'
import { Desk } from './Desk'
import { Employee } from './Employee'
import { FilingCabinet } from './FilingCabinet'
import { InteractionMarker } from './InteractionMarker'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Mug } from './Mug'
import { Painting } from './Painting'
import { Paper } from './Paper'
import { Telephone } from './Telephone'
import { Whiteboard } from './Whiteboard'
import { DoorHeader, WallPanel } from './wallPrimitives'

// Idle-only — Tenant doesn't wave; keeps a resting pose whether or not
// the player has talked to him.
const TENANT_IDLE = [/idle/i, /stand/i, /breath/i]

function Tenant() {
  const url = useEmployeeUrl('tenant')
  return (
    <Employee
      url={url}
      position={[-15, 0, -20]}
      rotationY={Math.PI}
      clipPatterns={TENANT_IDLE}
    />
  )
}

// Quiet focus room on the west side of the central corridor.
// Non-explorable. A row of individual focus desks along the west wall,
// occupants facing west (backs to the corridor). Whiteboards at both
// short ends of the room.
export function TheLibrary() {
  const y = WALL_HEIGHT / 2
  const { westX, eastX, northZ, southZ, doorCenterZ, doorWidth } = THE_LIBRARY
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

      {/* Focus desks along the west wall. Chair on the +X side of each
          desk facing west, so occupants look toward the wall (-X). Screen
          normal points +X (toward the sitter). */}
      {THE_LIBRARY_DESKS.map((d, i) => {
        const deskTopY = d.deskSize[1]
        const facingX = Math.PI / 2 // screen normal → +X
        // Small jitter so the row doesn't read as a perfect grid.
        const jitterR = (i % 2 === 0 ? 1 : -1) * 0.12
        return (
          <group key={`ldesk-${i}`}>
            <Desk
              position={d.deskCenter}
              size={d.deskSize}
              topColor={COLORS.tableTop}
              legColor={COLORS.tableLegs}
            />
            <Chair position={[d.chair[0], 0, d.chair[1]]} rotationY={d.chair[2]} />
            <Laptop
              position={[d.deskCenter[0] + 0.3, d.deskCenter[1] + (i % 2 === 0 ? 0.15 : -0.18)]}
              deskTopY={deskTopY}
              rotationY={facingX + jitterR}
            />
            {d.hasMonitor ? (
              <Monitor
                position={[d.deskCenter[0] - 0.35, d.deskCenter[1] + (i % 2 === 0 ? -0.2 : 0.22)]}
                deskTopY={deskTopY}
                rotationY={facingX - jitterR * 0.6}
              />
            ) : null}
            <Paper
              position={[d.deskCenter[0] + 0.15, d.deskCenter[1] + (i % 2 === 0 ? -0.35 : 0.4)]}
              deskTopY={deskTopY}
              rotationY={i % 2 === 0 ? 0.45 : -0.35}
              color="#ede8dc"
            />
            <Paper
              position={[d.deskCenter[0] - 0.05, d.deskCenter[1] + (i % 2 === 0 ? 0.35 : -0.4)]}
              deskTopY={deskTopY}
              rotationY={i % 2 === 0 ? -0.3 : 0.5}
              layer={1}
            />
          </group>
        )
      })}

      {/* Whiteboards at both short ends. */}
      {THE_LIBRARY_WHITEBOARDS.map((w, i) => (
        <Whiteboard
          key={`lwb-${i}`}
          centerX={w.centerX}
          centerY={w.centerY}
          width={w.width}
          height={w.height}
          wallZ={w.wallZ}
          facing={w.facing}
        />
      ))}

      {/* Desk-top clutter: a mug on the first desk, a telephone on the
          third. Sparse on purpose — this is a focus room. */}
      {(() => {
        const d0 = THE_LIBRARY_DESKS[0]!
        const d2 = THE_LIBRARY_DESKS[2]!
        return (
          <>
            <Mug
              position={[d0.deskCenter[0] + 0.1, d0.deskCenter[1] + 0.5]}
              deskTopY={d0.deskSize[1]}
            />
            <Telephone
              position={[d2.deskCenter[0] + 0.15, d2.deskCenter[1] - 0.45]}
              deskTopY={d2.deskSize[1]}
              rotationY={Math.PI / 2}
            />
          </>
        )
      })()}

      {/* A pair of short filing cabinets stacked flush against the north
          wall, drawer fronts facing south into the room. Cabinet width
          = 0.5 m; centers 0.5 m apart so bodies touch with no gap.
          Depth = 0.6 m; north wall at Z = -22 (inner face at -21.8),
          so centerZ = -21.5 seats the back flush against the wall. */}
      <FilingCabinet position={[-14, -21.5]} rotationY={0} drawers={2} />
      <FilingCabinet position={[-13.5, -21.5]} rotationY={0} drawers={2} />
      <Painting
        centerX={-16.5}
        wallZ={THE_LIBRARY.northZ}
        facing={1}
        centerY={1.7}
        size={[1.1, 0.8]}
        color="#3b7a5c"
      />

      {/* Tenant — standing in front of the north-wall whiteboard next
          to the filing cabinets, facing it (rotationY = π faces -Z).
          Idle only (no wave). */}
      <Suspense fallback={null}>
        <Tenant />
      </Suspense>
      <InteractionMarker
        stopId="tenant"
        position={[-15, 2.6, -20]}
        requiresQuest="weekly-status-meeting"
      />
    </>
  )
}
