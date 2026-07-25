// World is measured in meters. One "tile" from the top-down layout = 1m.

export const TILE_SIZE = 1

export const ROOM_WIDTH = 20
export const ROOM_DEPTH = 14
export const WALL_HEIGHT = 3
export const WALL_THICKNESS = 0.4

// Player + NPC scale. Both use PLAYER_HEIGHT as the GLB auto-fit target
// (see Employee.tsx), so bumping these grows every character uniformly.
export const PLAYER_RADIUS = 0.4375
export const PLAYER_HEIGHT = 2.0
export const PLAYER_SPEED = 6
export const PLAYER_RUN_SPEED = 16.25
// Spawn just south of the central corridor's south doorway (exterior side),
// centered on the corridor's X midline. The corridor's south wall is at
// Z = CENTRAL_CORRIDOR.southZ (=20) with WALL_THICKNESS=0.4 (south face at
// 20.2). Player radius is 0.35 — Z=21 keeps the capsule clear of the wall
// on the outside, facing north through the doorway into the corridor.
export const PLAYER_SPAWN: [number, number, number] = [-11.5, PLAYER_HEIGHT / 2 + 0.05, 21]

// Initial facing (radians around Y). 0 = +Z (south); Math.PI = -Z (north,
// into the corridor through the south doorway).
export const PLAYER_SPAWN_FACING = Math.PI

// Multiplier on top of the auto-fit that sizes the player GLB to PLAYER_HEIGHT.
// 1.0 = human-height; adjust 0.8–1.2 to taste.
export const PLAYER_MODEL_SCALE = 1

// Doorway opening height (floor → underside of the header lintel).
export const DOOR_HEIGHT = 2.6

// Front-wall doorway. Cuts the front wall into two segments around this gap.
export const DOOR = {
  centerX: 3.5,
  width: 2,
}

// The Bakery extending south of the conference room. Same width as the
// conference room so the two rooms share their full front/back boundary.
// North side is sealed by the conference room's front wall (with the
// doorway as the only passage between rooms).
export const THE_BAKERY = {
  centerX: 0,
  width: ROOM_WIDTH,
  depth: 13,
}

// The Bakery west-wall doorway (near the south end).
export const THE_BAKERY_WEST_DOOR = {
  centerZ: 17.5,
  width: 2,
}

// Long north-running corridor west of the office. Enters from the south
// The Bakery via `THE_BAKERY_WEST_DOOR`; runs ~20 m north; ends with a gap-only
// doorway on its east wall near the north end that leads nowhere yet.
//
// The corridor's east wall sits at X = -ROOM_WIDTH/2 — coplanar with the
// office/The Bakery west walls (glass). We render it as its own panels split
// around the two doorways; the duplicate glass at the coplanar overlap is
// invisible from either side and cheap enough for a prototype.
export const CENTRAL_CORRIDOR = {
  width: 3,
  eastX: -ROOM_WIDTH / 2, // -10
  westX: -ROOM_WIDTH / 2 - 3, // -13
  // Corridor runs from `southZ` (aligned with The Bakery south face for a clean
  // visual seam) north to `northZ` — long enough to feel like a corridor and
  // to place the dead-end door past the conference room's north wall so the
  // door reads as a real opening, not a doorway pressed against glass.
  southZ: ROOM_DEPTH / 2 + 13, // 20
  // Long north extension — ~90 m corridor. Gives room for many future
  // branch doorways along the east wall (see BRANCH_DOORS below).
  northZ: -70,
  // Dead-end doorway near (but not at) the north end, on the east side (the
  // player's right as they walk north). "Does nothing" — sealed with a
  // DoorBlocker. Positioned safely north of the conf-room's north face
  // (Z=-7) so it isn't coplanar with the conference-room back glass wall.
  deadEndDoorZ: -68,
  deadEndDoorWidth: 1.6,
  // Open doorway on the south wall — the player's spawn-side entrance to
  // the building. Centered on the corridor's X midline. No blocker.
  southDoorWidth: 2,
}

// East-running corridor branching off the central corridor at its north end.
// Runs parallel to the conference room's north wall, length = ROOM_WIDTH
// (matches the conf room's east–west extent). The south wall is coplanar
// with the conf room's north (glass) wall and is not rendered — the conf
// room's own wall serves as the visual boundary. The east corridor
// connects to the central corridor through CORRIDOR_POCKET at its NW corner,
// not through its own west doorway.
export const EAST_CORRIDOR = {
  width: 3, // north–south extent
  southZ: -ROOM_DEPTH / 2, // -7 (coplanar w/ conf-room north wall)
  northZ: -ROOM_DEPTH / 2 - 3, // -10
  westX: -ROOM_WIDTH / 2, // -10 (coplanar w/ central corridor east wall)
  eastX: ROOM_WIDTH / 2, // +10 (matches conf-room east wall X)
  // Sealed dead-end doorway on the east wall — mirrors CENTRAL_CORRIDOR.deadEndDoor.
  eastDoorZ: -8.5,
  eastDoorWidth: 1.6,
}

// 6×6 open pocket at the T-junction between the west and east corridors.
// Widens the central corridor eastward for 6 m along Z ∈ [northZ, southZ],
// creating a landing that flows south into the east corridor. No doorways:
// the pocket's west side is open into the central corridor and its south
// side is open into the east corridor.
export const CORRIDOR_POCKET = {
  westX: -ROOM_WIDTH / 2, // -10 (coplanar w/ central corridor east wall)
  eastX: -ROOM_WIDTH / 2 + 6, // -4
  northZ: -ROOM_DEPTH / 2 - 3 - 6, // -16
  southZ: -ROOM_DEPTH / 2 - 3, // -10 (coplanar w/ east corridor north wall)
}

// TheLab — first branch room off the central corridor's east wall.
// L-shaped: full width matches the east corridor's length (20 m along X).
// Its south boundary reuses the *existing* north walls of CORRIDOR_POCKET
// and EAST_CORRIDOR — no separate south wall is rendered in TheLab. The
// pocket's east wall (X=-4, Z:-16..-10) fills the inside-corner of the L.
//
//   X:  -10       -4                        +10
//        ┌─────────────────────────────────┐   Z=-32 (north wall)
//        │                                 │
//        │  west portion    east portion   │
//        │  X:-10..-4       X:-4..+10      │
//        │                                 │
//        │                                 │
//        └────────────┐                    │   Z=-16 (pocket north wall)
//                     │                    │
//        ← pocket →   └────────────────────┘   Z=-10 (east-corridor n. wall)
//        (not part of TheLab)
export const THE_LAB = {
  // Bounding rect (used for the corridor-side doorway math + zone rect).
  westX: -ROOM_WIDTH / 2, // -10 (coplanar with central corridor east wall)
  eastX: ROOM_WIDTH / 2, // +10
  northZ: -32,
  // Southern edges — L-shape. `westSouthZ` is the north wall of the pocket;
  // `eastSouthZ` is the north wall of the east corridor. The "step" at
  // X = stepX is the pocket's east wall.
  westSouthZ: -16,
  eastSouthZ: -10,
  stepX: -4,
  // Doorway on the shared west wall (with central corridor). Centered on
  // the west rect of the L (Z ∈ [northZ, westSouthZ] = [-32, -16]).
  doorCenterZ: -24,
  doorWidth: 2,
  // Doorway on the shared south wall (with east corridor's north wall).
  // Centered on the east rect of the L (X ∈ [-4, +10], midpoint X=+3).
  southDoorX: 3,
  southDoorWidth: 1.6,
}

// The Station — second room off the central corridor, halfway between
// TheLab's doorway (Z=-24) and the corridor's north dead-end (Z=-68).
// 20 m × 12 m rectangle east of the corridor. West wall coincides with
// the corridor's east wall (rendered as glass along this Z-span by
// CentralCorridor.tsx, with an open glass door at doorCenterZ).
export const THE_STATION = {
  westX: -ROOM_WIDTH / 2, // -10 (coplanar with central corridor east wall)
  // Extended east from the default ROOM_WIDTH so the east-side alcoves
  // sit clear of Alcove C's doorway on the north wall.
  eastX: ROOM_WIDTH / 2 + 4, // +14
  // Shifted 6 m north from TheLab so the corridor has real separation
  // between the two rooms. Room is 23 m along Z (to fit 3 east alcoves).
  northZ: -62,
  southZ: -39,
  // Doorway near the south end of the west wall.
  doorCenterZ: -42,
  doorWidth: 2,
}

// Alcoves carved into The Station's north wall. Each 6 m along X × 5 m
// along Z, south-facing doorway.
export const THE_STATION_ALCOVES = {
  northZ: -62, // coplanar with The Station's north wall
  southZ: -57, // 5 m deep
  bays: [
    { id: 'a', westX: -10, eastX: -4, doorX: -7, doorWidth: 1.4 },
    { id: 'b', westX: -4, eastX: 2, doorX: -1, doorWidth: 1.4 },
    { id: 'c', westX: 2, eastX: 10, doorX: 6, doorWidth: 1.4 },
  ],
} as const

// Three alcoves along The Station's east wall. Each 5 m along X × 6 m
// along Z (matches Alcove A/B footprint, just rotated). West-facing
// doorway on each bay opens back into The Station's main floor. Bays
// tile Z ∈ [-51, -33] to sit clear of the north-side alcoves.
// D and E are 5 m deep (X ∈ [+9, +14]). F is expanded to reach The
// Boardroom's east wall — see THE_STATION_F_EXPANSION for its westX
// (and the extra north-facing doorway on Z=-45).
export const THE_STATION_EAST_ALCOVES = {
  westX: 9, // default 5 m depth for D + E
  eastX: 14, // coplanar with The Station's east wall
  bays: [
    { id: 'd', northZ: -57, southZ: -51, doorZ: -54, doorWidth: 1.4 },
    { id: 'e', northZ: -51, southZ: -45, doorZ: -48, doorWidth: 1.4 },
    // F's westX is overridden by THE_STATION_F_EXPANSION.westX so it
    // stretches west to the Boardroom's east wall.
    { id: 'f', northZ: -45, southZ: -39, doorZ: -42, doorWidth: 1.4 },
  ],
} as const

// The Boardroom — carved into The Station's south interior, west of
// Alcove F. Perimeter walls: X=-4 (west), X=+5 (east), Z=-48 (north);
// south flush with The Station's south wall (Z=-39). West wall has a
// 2 m doorway centered at Z=-42 into the main floor. Wall-mounted TV
// on the north wall facing south, big conference table with 4 sitters.
export const THE_BOARDROOM = {
  westX: -4,
  eastX: 5,
  northZ: -48,
  southZ: -39, // coplanar with The Station's south wall
  // West-wall doorway centered at Z=-42 (2 m wide).
  doorCenterZ: -42,
  doorWidth: 2,
  // North-wall TV: 4 m wide (X-span), centered at X=+1, facing south.
  tv: {
    centerX: 1,
    centerY: 1.6,
    width: 4,
    height: 1.6,
    depth: 0.12,
  },
  // Table: X ∈ [-1, +2] (3 m), Z ∈ [-45, -40] (5 m).
  table: {
    centerX: 0.5,
    centerZ: -42.5,
    size: [3, 0.75, 5] as [number, number, number],
  },
  // 4 chairs — two pairs on the long (east/west) sides facing across.
  // West sitters at X=-2 face east (rotationY = +PI/2);
  // east sitters at X=+2 face west (rotationY = -PI/2).
  chairs: [
    [-2, -44, Math.PI / 2],
    [2, -44, -Math.PI / 2],
    [-2, -42, Math.PI / 2],
    [2, -42, -Math.PI / 2],
  ] as [number, number, number][],
} as const

// Two solo workstations along The Station's west (glass) wall. Each is a
// 2×3 desk with a chair on its west side facing east (toward the desk).
// The desks live in the north half of the main floor, between the
// corridor doorway and the north-side alcoves.
export const THE_STATION_WEST_WORKSTATIONS: readonly {
  deskCenter: [number, number]
  chair: [number, number, number]
  deskSize: [number, number, number]
}[] = [
  {
    // North workstation.
    deskCenter: [-7.5, -53],
    chair: [-9, -53, Math.PI / 2],
    deskSize: [2, 0.75, 3],
  },
  {
    // South workstation.
    deskCenter: [-7.5, -48],
    chair: [-9, -48, Math.PI / 2],
    deskSize: [2, 0.75, 3],
  },
]

// Alcove F expansion: F now stretches west from X=+9 to X=+5, sharing
// its west wall with The Boardroom's east wall. The northern edge of
// F (Z=-45, X ∈ [+5, +9]) has a north-facing doorway at X=+6 (2 m
// wide) plus a 2 m glass panel at X ∈ [+8, +9]; the segment at X=+5..+6
// is opaque wall.
export const THE_STATION_F_EXPANSION = {
  // Extended west face of Alcove F.
  westX: 5,
  // Existing east face of Alcove F is unchanged at THE_STATION_EAST_ALCOVES.eastX = 14.
  // North doorway centered at X=+6.5, 2 m wide.
  northDoorX: 6.5,
  northDoorWidth: 2,
  // Workstation inside F: 2 m × 3 m table at X ∈ [+11, +12], Z ∈ [-43, -41],
  // chair at X=+13 facing west. Monitor + laptop + papers on the desk.
  workstation: {
    deskCenter: [11.5, -42] as [number, number],
    deskSize: [2, 0.75, 3] as [number, number, number],
    chair: [13, -42, -Math.PI / 2] as [number, number, number],
  },
} as const

// Row of base cabinets backed against the OUTSIDE (west-facing) face of
// Alcove A's west partition wall. Cabinets sit in TheLab's main open
// floor, fronts facing west into the room. Northmost cabinet holds a
// drop-in sink, matching The Bakery's kitchen row.
export const THE_LAB_CABINETS = {
  // Alcove A's west partition midplane (X=THE_LAB_ALCOVES.westX = 5).
  wallX: 5,
  // Cabinets push west (-X) from the wall into TheLab's main open area.
  facing: -1 as -1 | 1,
  count: 10,
  unitWidth: 0.6,
  depth: 0.6,
  bodyHeight: 0.85,
  counterThickness: 0.05,
  counterOverhang: 0.04,
  // Northmost cabinet's center-Z. Bodies extend south from here.
  startZ: -31.2,
  // Sink on the southmost cabinet (largest Z / lower on the Z axis).
  sinkIndex: 9,
  bodyColor: '#f4f2ee',
  counterColor: '#e6e2d8',
  sinkColor: '#c8cbcf',
  metalColor: '#a8adb3',
} as const

// Three small alcove offices carved into TheLab's east interior. Each
// alcove pushes 3 m west of TheLab's east wall; the doorway is on the
// alcove's west (open) side, facing back into TheLab. Divider walls
// between bays keep the alcoves separate. Bay Z-spans are chosen to
// sit inside TheLab's east rect (Z ∈ [northZ, eastSouthZ]) with a bit
// of clearance north and south.
export const THE_LAB_ALCOVES = {
  eastX: 10, // coplanar with THE_LAB.eastX (interior side)
  westX: 5, // 5 m alcove depth
  // Bays tile TheLab's east rect Z-span [-32, -10] with no gaps — first
  // and last bays are flush with TheLab's north and south walls
  // respectively, and adjacent bays share divider walls.
  bays: [
    { id: 'a', northZ: -32, southZ: -20, doorZ: -23, doorWidth: 1.4 },
    { id: 'b', northZ: -20, southZ: -15, doorZ: -17.5, doorWidth: 1.4 },
    { id: 'c', northZ: -15, southZ: -10, doorZ: -12.5, doorWidth: 1.4 },
  ],
} as const

// Future branch doorways along the corridor's east wall. Each entry is
// where a scene like a meeting room, project office, or joke corner will
// hang off the corridor. Rendered as a door-frame + invisible blocker for
// now; when a branch scene exists, drop the blocker and mount the branch
// contents in a <LazyBranch zone="<id>">.
export interface BranchDoor {
  id: string
  centerZ: number
  width: number
  // Zone rect that marks the player as "inside this branch". When the
  // player is in this rect, <LazyBranch zone={id}> mounts.
  activationRect: { minX: number; maxX: number; minZ: number; maxZ: number }
}

// TheLab has replaced the earlier `branch-alpha` placeholder; leaving
// the list empty for now. Add entries here for future sealed placeholder
// doors that don't yet have real rooms.
export const BRANCH_DOORS: BranchDoor[] = []

// The Bakery south-wall doorway (near the west/left end).
export const THE_BAKERY_SOUTH_DOOR = {
  centerX: -7.5,
  width: 2,
}

// The Bakery south-wall glass windows (opaque wall elsewhere). Each entry is
// [centerX, width]. West of the doorway: one 4m pane. East of the doorway:
// two 4m panes with a wall divider between them, matching the west pane's
// width for visual symmetry.
export const THE_BAKERY_SOUTH_WINDOWS: [number, number][] = [
  [-4.5, 4], // wide window west of center
  [2.5, 4],
  [6.5, 4],
]

// NE alcove: two small offices stacked north-south, entered from the The Bakery
// via their west walls. The alcove's east wall coincides with the The Bakery's
// east wall (opaque, already exists). The alcove's north wall coincides with
// the conf-room's front-wall east segment (now opaque instead of glass).
export const THE_BAKERY_NE_ALCOVE = {
  westX: 4.5,
  eastX: ROOM_WIDTH / 2,
  upper: { northZ: 7, southZ: 11, doorZ: 10, doorWidth: 1 },
  lower: { northZ: 11, southZ: 15, doorZ: 12, doorWidth: 1 },
}

// The Bakery desk clusters (shared workbench-style, 2m wide × 3m deep).
export const THE_BAKERY_DESKS: [number, number][] = [
  [-6.5, 10],
  [-3.5, 10],
  [-6.5, 14],
  [-3.5, 14],
]
export const THE_BAKERY_DESK_SIZE: [number, number, number] = [2, 0.75, 3]

// Alcove desks (3m wide × 2m deep).
// Upper alcove: pushed flush against the north wall.
// Lower alcove: centered.
export const THE_BAKERY_ALCOVE_DESKS: [number, number][] = [
  [7.25, 8.2],
  [7.25, 13.5],
]
export const THE_BAKERY_ALCOVE_DESK_SIZE: [number, number, number] = [3, 0.75, 2]

// Desk chairs: [x, z, facing] where facing = angle in radians around Y.
// Positive rotation turns local +Z toward +X, so PI/2 faces east.
export const THE_BAKERY_DESK_CHAIRS: [number, number, number][] = [
  [-8, 10, Math.PI / 2], // west of NW cluster, facing east
  [-2, 10, -Math.PI / 2], // east of NE-cluster, facing west
  [-8, 14, Math.PI / 2],
  [-2, 14, -Math.PI / 2],
]

// Long prep-style table parked west of the sink cabinets, oriented long
// along X so it sits perpendicular to the (north-south) cabinet row with a
// walking gap between them. Same visual treatment as the alcove desks
// (white top, light-grey legs).
export const THE_BAKERY_KITCHEN_TABLE = {
  position: [6, 18.4] as [number, number], // centerX, centerZ
  size: [4, 0.75, 1.1] as [number, number, number], // [w, h, d]
}

// White base cabinets running along the east wall of The Bakery, in
// the exposed section south of the NE alcoves. The northmost cabinet has a
// drop-in sink set into the shared countertop.
export const THE_BAKERY_EAST_CABINETS = {
  wallX: ROOM_WIDTH / 2, // east wall midplane
  // Cabinets sit west of the wall (into The Bakery). `facing = -1` picks
  // the -X side; see CabinetRow.tsx.
  facing: -1 as -1 | 1,
  count: 7,
  unitWidth: 0.6, // per-cabinet width along Z
  depth: 0.6, // body depth into the The Bakery (west from the wall)
  bodyHeight: 0.85,
  counterThickness: 0.05,
  counterOverhang: 0.04, // countertop overhangs the door face
  // Northmost cabinet's center-Z. Cabinets run south from here.
  startZ: THE_BAKERY_NE_ALCOVE.lower.southZ + WALL_THICKNESS / 2 + 0.3,
  bodyColor: '#f4f2ee',
  counterColor: '#e6e2d8',
  sinkColor: '#c8cbcf',
  metalColor: '#a8adb3',
}

// Wall-mounted whiteboard on the back wall (Z = -ROOM_DEPTH/2), centered.
export const WHITEBOARD = {
  centerX: 0,
  centerY: 1.5,
  width: 7,
  height: 1.8,
  depth: 0.08,
}

// Alcove whiteboards — mounted on each alcove's interior north wall, facing
// south into the office. Sized to fit inside the alcove width (~5.5m) minus
// a margin. Centered on the alcove.
export const THE_BAKERY_ALCOVE_WHITEBOARDS: {
  centerX: number
  northZ: number
  width: number
  centerY: number
  height: number
}[] = [
  { centerX: 7.25, northZ: 11, width: 4, centerY: 1.5, height: 1.6 }, // lower alcove
]

// Wall-mounted TV on the east wall (X = +ROOM_WIDTH/2). Width runs along Z.
export const TV = {
  centerZ: 0,
  centerY: 1.5,
  width: 5,
  height: 1.8,
  depth: 0.15,
}

export const CONFERENCE_TABLE = {
  center: [0, 0, 0] as [number, number, number],
  size: [10, 0.75, 4] as [number, number, number],
}

export const CHAIR = {
  // Seat = thick horizontal slab. Local +Z faces the table.
  seat: { width: 0.5, thickness: 0.06, depth: 0.5, topY: 0.45 },
  // Back = thin vertical slab at the local -Z edge of the seat.
  back: { width: 0.5, height: 0.55, depth: 0.06, topY: 1.05 },
  // Four legs, insert offset from the seat's edges.
  leg: { thickness: 0.04, inset: 0.05 },
  positions: [
    // North side (5)
    [-4, -2.55],
    [-2, -2.55],
    [0, -2.55],
    [2, -2.55],
    [4, -2.55],
    // South side (5)
    [-4, 2.55],
    [-2, 2.55],
    [0, 2.55],
    [2, 2.55],
    [4, 2.55],
  ] as [number, number][],
}

// Interaction zone sits in front of the east-wall TV.
export const INTERACTION_ZONE = {
  center: [ROOM_WIDTH / 2 - 3, 0, TV.centerZ] as [number, number, number],
  size: [3.5, 5] as [number, number],
}

// Third-person camera orbits the player as polar coordinates:
// - CAMERA_DISTANCE: horizontal radius (metres) from the player.
// - CAMERA_HEIGHT: absolute Y (metres) of the camera in world space.
// - CAMERA_INITIAL_YAW: starting yaw in radians. 0 = camera directly south
//   of the player, looking north. Increasing yaw orbits CCW when viewed
//   from above.
// The old fixed offset [0, 8, 8] corresponds to distance=8, height=8, yaw=0.
export const CAMERA_DISTANCE = 8
export const CAMERA_HEIGHT = 8
export const CAMERA_INITIAL_YAW = 0
export const CAMERA_LOOK_HEIGHT = 0.5
// Zoom clamps and speed. Zoom scales the radial (distance) and height
// components of the polar camera together so the pitch angle stays fixed.
// The scale is multiplied against CAMERA_DISTANCE / CAMERA_HEIGHT.
export const CAMERA_ZOOM_MIN = 0.4
export const CAMERA_ZOOM_MAX = 2.5
// Multiplicative zoom rate per second while +/- is held. 1.6 = ~doubles or
// halves in about 1.3 s.
export const CAMERA_ZOOM_RATE = 1.6
// Radians of camera yaw per pixel of horizontal mouse drag.
// 0.005 ≈ a full 90° orbit per ~314 px — comfortable for slow inspection.
export const MOUSE_LOOK_SENSITIVITY = 0.005
// Radians of camera yaw per pixel of horizontal trackpad-scroll delta.
// Scroll deltas are much larger than drag pixels, so this is scaled down.
export const TRACKPAD_LOOK_SENSITIVITY = 0.003
// Radians per second while Q/E is held.
export const KEY_LOOK_SPEED = 2.2

export const COLORS = {
  floor: '#2f3540',
  floorAccent: '#3a4150',
  wall: '#1a1d24',
  tableLegs: '#2b1c12',
  tableTop: '#6b3f22',
  chair: '#111114',
  whiteboardFrame: '#2a2a2a',
  whiteboardSurface: '#f5f5f0',
  tvBezel: '#0a0a0a',
  tvScreen: '#3aa0ff',
  player: '#4a90e2',
  playerFace: '#f0f5ff',
} as const
