import { RigidBody } from '@react-three/rapier'
import {
  BRANCH_DOORS,
  COLORS,
  CORRIDOR_POCKET,
  EAST_CORRIDOR,
  NORTH_EAST_POCKET,
  THE_ATRIUM,
  THE_BAKERY,
  THE_BAKERY_WEST_DOOR,
  THE_COMMONS,
  THE_GARAGE,
  THE_LAB,
  THE_LIBRARY,
  THE_STATION,
  ROOM_DEPTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
  WEST_SIDE_ROOMS,
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
    {
      lo: THE_GARAGE.doorCenterZ - THE_GARAGE.doorWidth / 2,
      hi: THE_GARAGE.doorCenterZ + THE_GARAGE.doorWidth / 2,
      centerZ: THE_GARAGE.doorCenterZ,
      width: THE_GARAGE.doorWidth,
    },
    {
      lo:
        THE_GARAGE.conference.westDoorCenterZ -
        THE_GARAGE.conference.westDoorWidth / 2,
      hi:
        THE_GARAGE.conference.westDoorCenterZ +
        THE_GARAGE.conference.westDoorWidth / 2,
      centerZ: THE_GARAGE.conference.westDoorCenterZ,
      width: THE_GARAGE.conference.westDoorWidth,
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
    // Mouth of the north-east corridor pocket between TheLab and TheStation.
    { lo: NORTH_EAST_POCKET.northZ, hi: NORTH_EAST_POCKET.southZ },
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
    // Break at TheGarage's own Z boundaries so its glass storefront
    // stretch and its conference sub-room's glass stretch each render
    // as their own segments.
    THE_GARAGE.southZ,
    THE_GARAGE.northZ,
    THE_GARAGE.conference.northZ,
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
        // TheGarage: glass along both the main floor's Z-span AND its
        // conference sub-room's Z-span (both share their west wall
        // coplanar with the corridor east wall).
        const inGarage =
          lo >= THE_GARAGE.conference.northZ && hi <= THE_GARAGE.southZ
        const isGlass = inLab || inBakery || inStation || inGarage
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

      {/* Branch doors: sealed placeholder doorways whose branch scenes
          don't exist yet. Each is paired with a zone-activation rect
          (see BRANCH_DOORS.activationRect) so the branch's
          <LazyBranch> mounts as the player approaches. When a branch
          scene exists, remove that door's blocker. */}
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

      {/* TheGarage entrance — same treatment. */}
      <Door
        position={[eastX, THE_GARAGE.doorCenterZ]}
        width={THE_GARAGE.doorWidth}
        spansX={false}
        blocking={false}
        open
      />

      {/* TheGarage conference sub-room entrance on the corridor. */}
      <Door
        position={[eastX, THE_GARAGE.conference.westDoorCenterZ]}
        width={THE_GARAGE.conference.westDoorWidth}
        spansX={false}
        blocking={false}
        open
      />

      {/* west wall — split around each west-side room's Z-span AND each
          room's doorway. Segments inside a room render as coplanar
          glass storefront (auto-divisions so mullions match the east
          side). Doorways get a lintel + open glass door slab, matching
          the east-side entrances (TheLab / TheStation). */}
      {(() => {
        const rooms = [...WEST_SIDE_ROOMS].sort((a, b) => a.northZ - b.northZ)
        // `closed` matches the bakery south-wall door — a visible glass
        // slab that seals the opening (blocking, not `open`). Open doors
        // on this wall default to swinging `outward` (toward -X, into
        // the room) rather than into the corridor.
        const westOpenings: {
          id: string
          centerZ: number
          width: number
          closed: boolean
          openDirection?: 'inward' | 'outward'
        }[] = [
          {
            id: 'the-commons',
            centerZ: THE_COMMONS.doorCenterZ,
            width: THE_COMMONS.doorWidth,
            closed: true,
          },
          {
            id: 'the-library',
            centerZ: THE_LIBRARY.doorCenterZ,
            width: THE_LIBRARY.doorWidth,
            closed: false,
            openDirection: 'outward',
          },
          {
            id: 'the-atrium',
            centerZ: THE_ATRIUM.doorCenterZ,
            width: THE_ATRIUM.doorWidth,
            closed: true,
          },
        ]
        const cutouts = westOpenings
          .map((o) => ({ lo: o.centerZ - o.width / 2, hi: o.centerZ + o.width / 2 }))
          .sort((a, b) => a.lo - b.lo)
        // Break wall at every room boundary AND at every doorway edge.
        const seams = new Set<number>([northZ, southZ])
        for (const r of rooms) {
          if (r.northZ > northZ && r.northZ < southZ) seams.add(r.northZ)
          if (r.southZ > northZ && r.southZ < southZ) seams.add(r.southZ)
        }
        const seamList = [...seams].sort((a, b) => a - b)
        // Carve doorways out of the wall (skip those spans entirely).
        const segments: [number, number][] = []
        let cursor = northZ
        const pushSpan = (from: number, to: number) => {
          if (to - from <= 0.01) return
          let start = from
          for (const seam of seamList) {
            if (seam > start && seam < to) {
              segments.push([start, seam])
              start = seam
            }
          }
          segments.push([start, to])
        }
        for (const cut of cutouts) {
          if (cut.lo - cursor > 0.01) pushSpan(cursor, cut.lo)
          cursor = cut.hi
        }
        if (southZ - cursor > 0.01) pushSpan(cursor, southZ)

        return (
          <>
            {segments.map(([lo, hi], i) => {
              const isGlass = rooms.some((r) => lo >= r.northZ && hi <= r.southZ)
              return (
                <WallPanel
                  key={`west-${i}`}
                  position={[westX, y, (lo + hi) / 2]}
                  size={[WALL_THICKNESS, WALL_HEIGHT, hi - lo]}
                  glass={isGlass}
                />
              )
            })}
            {westOpenings.map((o) => (
              <DoorHeader
                key={`west-header-${o.id}`}
                position={[westX, o.centerZ]}
                width={o.width}
                spansX={false}
              />
            ))}
            {westOpenings.map((o) => (
              <Door
                key={`west-door-${o.id}`}
                position={[westX, o.centerZ]}
                width={o.width}
                spansX={false}
                blocking={o.closed}
                open={!o.closed}
                openDirection={o.openDirection}
              />
            ))}
          </>
        )
      })()}

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
