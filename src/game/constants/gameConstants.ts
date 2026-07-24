// World is measured in meters. One "tile" from the top-down layout = 1m.

export const TILE_SIZE = 1

export const ROOM_WIDTH = 20
export const ROOM_DEPTH = 14
export const WALL_HEIGHT = 3
export const WALL_THICKNESS = 0.4

export const PLAYER_RADIUS = 0.35
export const PLAYER_HEIGHT = 1.6
export const PLAYER_SPEED = 6
export const PLAYER_SPAWN: [number, number, number] = [5, PLAYER_HEIGHT / 2 + 0.05, 6]

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
  position: [6, 17.3] as [number, number], // centerX, centerZ
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

export const CAMERA_OFFSET: [number, number, number] = [0, 8, 8]
export const CAMERA_LOOK_HEIGHT = 0.5

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
