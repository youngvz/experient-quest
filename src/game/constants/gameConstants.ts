// World is measured in meters. One "tile" from the top-down layout = 1m.

export const TILE_SIZE = 1

export const ROOM_WIDTH = 20
export const ROOM_DEPTH = 14
export const WALL_HEIGHT = 3
export const WALL_THICKNESS = 0.4

export const PLAYER_RADIUS = 0.35
export const PLAYER_HEIGHT = 1.6
export const PLAYER_SPEED = 6
export const PLAYER_RUN_SPEED = 13
// Spawn just inside the hallway's south doorway (centerX = HALLWAY_SOUTH_DOOR.centerX,
// close to the south wall at Z = ROOM_DEPTH/2 + HALLWAY.depth = 20).
// Spawn just north of the south doorway blocker: south wall is centered at
// Z=20 with WALL_THICKNESS=0.4 (north face at 19.8), and the player has
// radius 0.35 — 19.4 keeps the capsule clear of the blocker.
export const PLAYER_SPAWN: [number, number, number] = [-7.5, PLAYER_HEIGHT / 2 + 0.05, 19.4]

// Initial facing (radians around Y). 0 = +Z (south, out the door);
// Math.PI = -Z (north, into the office).
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

// Hallway extending south of the conference room. Same width as the
// conference room so the two rooms share their full front/back boundary.
// North side is sealed by the conference room's front wall (with the
// doorway as the only passage between rooms).
export const HALLWAY = {
  centerX: 0,
  width: ROOM_WIDTH,
  depth: 13,
}

// Hallway west-wall doorway (near the south end).
export const HALLWAY_WEST_DOOR = {
  centerZ: 17.5,
  width: 2,
}

// Long north-running corridor west of the office. Enters from the south
// hallway via `HALLWAY_WEST_DOOR`; runs ~20 m north; ends with a gap-only
// doorway on its east wall near the north end that leads nowhere yet.
//
// The corridor's east wall sits at X = -ROOM_WIDTH/2 — coplanar with the
// office/hallway west walls (glass). We render it as its own panels split
// around the two doorways; the duplicate glass at the coplanar overlap is
// invisible from either side and cheap enough for a prototype.
export const WEST_CORRIDOR = {
  width: 3,
  eastX: -ROOM_WIDTH / 2, // -10
  westX: -ROOM_WIDTH / 2 - 3, // -13
  // Corridor runs from `southZ` (aligned with hallway south face for a clean
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
}

// East-running corridor branching off the west corridor at its north end.
// Runs parallel to the conference room's north wall, length = ROOM_WIDTH
// (matches the conf room's east–west extent). The south wall is coplanar
// with the conf room's north (glass) wall and is not rendered — the conf
// room's own wall serves as the visual boundary. The east corridor
// connects to the west corridor through CORRIDOR_POCKET at its NW corner,
// not through its own west doorway.
export const EAST_CORRIDOR = {
  width: 3, // north–south extent
  southZ: -ROOM_DEPTH / 2, // -7 (coplanar w/ conf-room north wall)
  northZ: -ROOM_DEPTH / 2 - 3, // -10
  westX: -ROOM_WIDTH / 2, // -10 (coplanar w/ west corridor east wall)
  eastX: ROOM_WIDTH / 2, // +10 (matches conf-room east wall X)
  // Sealed dead-end doorway on the east wall — mirrors WEST_CORRIDOR.deadEndDoor.
  eastDoorZ: -8.5,
  eastDoorWidth: 1.6,
}

// 6×6 open pocket at the T-junction between the west and east corridors.
// Widens the west corridor eastward for 6 m along Z ∈ [northZ, southZ],
// creating a landing that flows south into the east corridor. No doorways:
// the pocket's west side is open into the west corridor and its south
// side is open into the east corridor.
export const CORRIDOR_POCKET = {
  westX: -ROOM_WIDTH / 2, // -10 (coplanar w/ west corridor east wall)
  eastX: -ROOM_WIDTH / 2 + 6, // -4
  northZ: -ROOM_DEPTH / 2 - 3 - 6, // -16
  southZ: -ROOM_DEPTH / 2 - 3, // -10 (coplanar w/ east corridor north wall)
}

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

export const BRANCH_DOORS: BranchDoor[] = [
  // First branch — placeholder near the middle of the corridor. No scene
  // built yet, but the doorway + zone trigger are wired.
  {
    id: 'branch-alpha',
    centerZ: -30,
    width: 1.6,
    // A ~4 m x 5 m rect just east of the doorway (inside the branch space
    // we haven't built yet). Adjust when the branch geometry lands.
    activationRect: { minX: -10, maxX: -6, minZ: -32.5, maxZ: -27.5 },
  },
]

// Hallway south-wall doorway (near the west/left end).
export const HALLWAY_SOUTH_DOOR = {
  centerX: -7.5,
  width: 2,
}

// Hallway south-wall glass windows (opaque wall elsewhere). Each entry is
// [centerX, width].
export const HALLWAY_SOUTH_WINDOWS: [number, number][] = [
  [-4.5, 4], // wide window west of center
  [1.5, 2],
  [4.5, 2],
  [7.5, 2],
]

// NE alcove: two small offices stacked north-south, entered from the hallway
// via their west walls. The alcove's east wall coincides with the hallway's
// east wall (opaque, already exists). The alcove's north wall coincides with
// the conf-room's front-wall east segment (now opaque instead of glass).
export const NE_ALCOVE = {
  westX: 4.5,
  eastX: ROOM_WIDTH / 2,
  upper: { northZ: 7, southZ: 11, doorZ: 10, doorWidth: 1 },
  lower: { northZ: 11, southZ: 15, doorZ: 12, doorWidth: 1 },
}

// Hallway desk clusters (shared workbench-style, 2m wide × 3m deep).
export const HALLWAY_DESKS: [number, number][] = [
  [-6.5, 10],
  [-3.5, 10],
  [-6.5, 14],
  [-3.5, 14],
]
export const HALLWAY_DESK_SIZE: [number, number, number] = [2, 0.75, 3]

// Alcove desks (3m wide × 2m deep).
// Upper alcove: pushed flush against the north wall.
// Lower alcove: centered.
export const ALCOVE_DESKS: [number, number][] = [
  [7.25, 8.2],
  [7.25, 13.5],
]
export const ALCOVE_DESK_SIZE: [number, number, number] = [3, 0.75, 2]

// Desk chairs: [x, z, facing] where facing = angle in radians around Y.
// Positive rotation turns local +Z toward +X, so PI/2 faces east.
export const HALLWAY_DESK_CHAIRS: [number, number, number][] = [
  [-8, 10, Math.PI / 2], // west of NW cluster, facing east
  [-2, 10, -Math.PI / 2], // east of NE-cluster, facing west
  [-8, 14, Math.PI / 2],
  [-2, 14, -Math.PI / 2],
]

// Long prep-style table parked west of the sink cabinets, oriented long
// along X so it sits perpendicular to the (north-south) cabinet row with a
// walking gap between them. Same visual treatment as the alcove desks
// (white top, light-grey legs).
export const HALLWAY_KITCHEN_TABLE = {
  position: [6, 18.4] as [number, number], // centerX, centerZ
  size: [4, 0.75, 1.1] as [number, number, number], // [w, h, d]
}

// White base cabinets running along the east wall of the south hallway, in
// the exposed section south of the NE alcoves. The northmost cabinet has a
// drop-in sink set into the shared countertop.
export const HALLWAY_EAST_CABINETS = {
  wallX: ROOM_WIDTH / 2, // east wall midplane
  count: 7,
  unitWidth: 0.6, // per-cabinet width along Z
  depth: 0.6, // body depth into the hallway (west from the wall)
  bodyHeight: 0.85,
  counterThickness: 0.05,
  counterOverhang: 0.04, // countertop overhangs the door face
  // Northmost cabinet's center-Z. Cabinets run south from here.
  startZ: NE_ALCOVE.lower.southZ + WALL_THICKNESS / 2 + 0.3,
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
export const ALCOVE_WHITEBOARDS: {
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
