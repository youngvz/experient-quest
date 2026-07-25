import { RigidBody } from '@react-three/rapier'
import {
  BRANCH_DOORS,
  COLORS,
  CORRIDOR_POCKET,
  EAST_CORRIDOR,
  THE_BAKERY,
  THE_BAKERY_WEST_DOOR,
  THE_LAB,
  THE_STATION,
  ROOM_DEPTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
  CENTRAL_CORRIDOR,
} from '../constants/gameConstants'
import { Door } from './Door'
import { DoorBlocker, DoorHeader, WallPanel } from './wallPrimitives'

// Remove any part of each input segment that overlaps the conference room's
// west wall span (Z ∈ [-ROOM_DEPTH/2, +ROOM_DEPTH/2]). A segment may split
// into 0, 1, or 2 output segments depending on where it sits relative to
// the exclusion zone. Filters out zero-length outputs.
const CONF_ROOM_LO = -ROOM_DEPTH / 2
const CONF_ROOM_HI = ROOM_DEPTH / 2
function clipSegments(segments: [number, number][]): [number, number][] {
  const out: [number, number][] = []
  for (const [lo, hi] of segments) {
    if (hi <= CONF_ROOM_LO || lo >= CONF_ROOM_HI) {
      if (hi - lo > 0.01) out.push([lo, hi])
      continue
    }
    if (lo < CONF_ROOM_LO && CONF_ROOM_LO - lo > 0.01) {
      out.push([lo, CONF_ROOM_LO])
    }
    if (hi > CONF_ROOM_HI && hi - CONF_ROOM_HI > 0.01) {
      out.push([CONF_ROOM_HI, hi])
    }
  }
  return out
}

// Long north-south corridor west of the office. Reached through The
// Bakery's west doorway. Additional openings along the east wall are
// declared in BRANCH_DOORS — each becomes a door frame + invisible blocker
// until a branch scene is wired up. The far north end has a dead-end door.
export function CentralCorridor() {
  const y = WALL_HEIGHT / 2
  const {
    eastX,
    westX,
    southZ,
    northZ,
    width,
    deadEndDoorZ,
    deadEndDoorWidth,
    southDoorWidth,
  } = CENTRAL_CORRIDOR
  const centerX = (eastX + westX) / 2
  const centerZ = (northZ + southZ) / 2
  const length = southZ - northZ
  const southDoorLo = centerX - southDoorWidth / 2
  const southDoorHi = centerX + southDoorWidth / 2

  // Doorway openings on the east wall — each gets a header lintel.
  const openings: { lo: number; hi: number; centerZ: number; width: number }[] = [
    {
      lo: THE_BAKERY_WEST_DOOR.centerZ - THE_BAKERY_WEST_DOOR.width / 2,
      hi: THE_BAKERY_WEST_DOOR.centerZ + THE_BAKERY_WEST_DOOR.width / 2,
      centerZ: THE_BAKERY_WEST_DOOR.centerZ,
      width: THE_BAKERY_WEST_DOOR.width,
    },
    {
      lo: deadEndDoorZ - deadEndDoorWidth / 2,
      hi: deadEndDoorZ + deadEndDoorWidth / 2,
      centerZ: deadEndDoorZ,
      width: deadEndDoorWidth,
    },
    {
      lo: THE_LAB.doorCenterZ - THE_LAB.doorWidth / 2,
      hi: THE_LAB.doorCenterZ + THE_LAB.doorWidth / 2,
      centerZ: THE_LAB.doorCenterZ,
      width: THE_LAB.doorWidth,
    },
    {
      lo: THE_STATION.doorCenterZ - THE_STATION.doorWidth / 2,
      hi: THE_STATION.doorCenterZ + THE_STATION.doorWidth / 2,
      centerZ: THE_STATION.doorCenterZ,
      width: THE_STATION.doorWidth,
    },
    ...BRANCH_DOORS.map((door) => ({
      lo: door.centerZ - door.width / 2,
      hi: door.centerZ + door.width / 2,
      centerZ: door.centerZ,
      width: door.width,
    })),
  ]

  // Full-height wall carve-outs (no lintel) — used for open room-to-room
  // transitions. One combined cutout spans the pocket AND the east
  // corridor's west end so the whole L reads as continuous space.
  const gaps: { lo: number; hi: number }[] = [
    { lo: CORRIDOR_POCKET.northZ, hi: EAST_CORRIDOR.southZ },
  ]

  // Zero-width "seams" at each adjacent room's north/south wall Z-values.
  // These break wall segments at room boundaries so the glass predicate
  // below (which checks whether a segment lies *inside* a room's Z-span)
  // matches correctly. Without seams, a single segment can straddle
  // both inside-a-room and outside-a-room stretches → predicate fails
  // and the whole segment renders opaque.
  const seams: number[] = [
    THE_LAB.northZ,
    THE_LAB.westSouthZ,
    THE_STATION.northZ,
    THE_STATION.southZ,
    // Also break at The Station's Alcove A south edge so the wall
    // stretch along Alcove A (Z: -62..-57) can render opaque separately
    // from the rest of The Station's west wall (glass).
    -57,
  ]

  // Wall segments: subtract the union of openings + gaps from the east
  // wall, and also break the wall at every seam.
  const cutouts = [...openings, ...gaps].sort((a, b) => a.lo - b.lo)
  const seamsSet = seams
    .filter((z) => z > northZ && z < southZ)
    .sort((a, b) => a - b)
  const wallSegments: [number, number][] = []
  let cursor = northZ
  const pushSpan = (from: number, to: number) => {
    if (to - from <= 0.01) return
    let start = from
    for (const seam of seamsSet) {
      if (seam > start && seam < to) {
        wallSegments.push([start, seam])
        start = seam
      }
    }
    wallSegments.push([start, to])
  }
  for (const cutout of cutouts) {
    if (cutout.lo - cursor > 0.01) pushSpan(cursor, cutout.lo)
    cursor = cutout.hi
  }
  if (southZ - cursor > 0.01) pushSpan(cursor, southZ)

  return (
    <>
      {/* floor slab */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[centerX, -0.05, centerZ]}>
          <boxGeometry args={[width, 0.1, length]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* east wall — segments between openings, then clipped so we don't
          render coplanar with the conference room's own west wall.
          Segments that fall entirely within TheLab's Z-span render as
          glass (storefront wall); everything else stays opaque so the
          exterior ring buildings north of the office don't show through
          as "huge cubes" from inside the corridor. */}
      {clipSegments(wallSegments).map(([lo, hi], i) => {
        // Glass along the Z-spans of every room whose west boundary is
        // shared with the corridor's east wall — reads as a storefront
        // wherever the player can look into a room.
        const bakeryNorthZ = ROOM_DEPTH / 2
        const bakerySouthZ = bakeryNorthZ + THE_BAKERY.depth
        const inLab = lo >= THE_LAB.northZ && hi <= THE_LAB.westSouthZ
        const inBakery = lo >= bakeryNorthZ && hi <= bakerySouthZ
        // The Station: glass everywhere along its Z-span EXCEPT the
        // stretch behind Alcove A (Z ∈ [-62, -57]), which stays opaque
        // so the alcove reads as an enclosed office.
        const inStation =
          lo >= -57 && hi <= THE_STATION.southZ
        const isGlass = inLab || inBakery || inStation
        return (
          <WallPanel
            key={`east-${i}`}
            position={[eastX, y, (lo + hi) / 2]}
            size={[WALL_THICKNESS, WALL_HEIGHT, hi - lo]}
            glass={isGlass}
          />
        )
      })}

      {/* Door headers on every east-wall opening */}
      {openings.map((opening, i) => (
        <DoorHeader
          key={`header-${i}`}
          position={[eastX, opening.centerZ]}
          width={opening.width}
          spansX={false}
        />
      ))}

      {/* Dead-end door: visible passage, physically sealed. Swap for a
          sensor collider when the branch scene beyond it lands. */}
      <DoorBlocker
        position={[eastX, deadEndDoorZ]}
        width={deadEndDoorWidth}
        spansX={false}
      />

      {/* Branch doors: sealed the same way, but each one is paired with a
          zone-activation rect (see BRANCH_DOORS.activationRect) so the
          branch's <LazyBranch> mounts as the player approaches. When a
          branch scene exists, remove that door's blocker. */}
      {BRANCH_DOORS.map((door) => (
        <DoorBlocker
          key={`branch-block-${door.id}`}
          position={[eastX, door.centerZ]}
          width={door.width}
          spansX={false}
        />
      ))}

      {/* TheLab entrance — open glass door standing in the shared doorway. */}
      <Door
        position={[eastX, THE_LAB.doorCenterZ]}
        width={THE_LAB.doorWidth}
        spansX={false}
        blocking={false}
        open
      />

      {/* TheStation entrance — same treatment. */}
      <Door
        position={[eastX, THE_STATION.doorCenterZ]}
        width={THE_STATION.doorWidth}
        spansX={false}
        blocking={false}
        open
      />

      {/* west wall — solid full length */}
      <WallPanel
        position={[westX, y, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, length]}
      />

      {/* south wall — split around the south doorway (player entrance) */}
      <WallPanel
        position={[(westX + southDoorLo) / 2, y, southZ]}
        size={[southDoorLo - westX, WALL_HEIGHT, WALL_THICKNESS]}
      />
      <WallPanel
        position={[(southDoorHi + eastX) / 2, y, southZ]}
        size={[eastX - southDoorHi, WALL_HEIGHT, WALL_THICKNESS]}
      />
      <DoorHeader
        position={[centerX, southZ]}
        width={southDoorWidth}
        spansX
      />
      <Door
        position={[centerX, southZ]}
        width={southDoorWidth}
        spansX
        blocking={false}
        open
        openDirection="outward"
      />

      {/* north wall — seals the north end of the corridor */}
      <WallPanel
        position={[centerX, y, northZ]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
      />
    </>
  )
}
