import {
  ROOM_DEPTH,
  THE_BAKERY,
  THE_LAB,
  THE_STATION,
} from '../../constants/gameConstants'
import type { ProximityAnchor } from './ProximityManager'

// Radii in meters: how far *outside* a room's bounding rect the player
// can be before the room mounts. Sized so the chunk starts fetching
// before the player reaches the room — enough headroom for the ~50-500ms
// network round-trip even at run speed (PLAYER_RUN_SPEED = 16.25 m/s).
const BAKERY_RADIUS = 10
const LAB_RADIUS = 15
const STATION_RADIUS = 15

// Spawn is at Z=21, just 1m south of THE_BAKERY.southZ (=20). The 10m
// buffer here means the Bakery chunk is already fetching as the shell
// paints — matches the user's request that the spawn-adjacent room load
// immediately while further rooms stay dormant.
export const PROXIMITY_ANCHORS: readonly ProximityAnchor[] = [
  {
    id: 'the-bakery',
    minX: THE_BAKERY.centerX - THE_BAKERY.width / 2,
    maxX: THE_BAKERY.centerX + THE_BAKERY.width / 2,
    minZ: ROOM_DEPTH / 2,
    maxZ: ROOM_DEPTH / 2 + THE_BAKERY.depth,
    radius: BAKERY_RADIUS,
  },
  // TheLab is L-shaped — register both rects under one id.
  {
    id: 'the-lab',
    minX: THE_LAB.westX,
    maxX: THE_LAB.stepX,
    minZ: THE_LAB.northZ,
    maxZ: THE_LAB.westSouthZ,
    radius: LAB_RADIUS,
  },
  {
    id: 'the-lab',
    minX: THE_LAB.stepX,
    maxX: THE_LAB.eastX,
    minZ: THE_LAB.northZ,
    maxZ: THE_LAB.eastSouthZ,
    radius: LAB_RADIUS,
  },
  {
    id: 'the-station',
    minX: THE_STATION.westX,
    maxX: THE_STATION.eastX,
    minZ: THE_STATION.northZ,
    maxZ: THE_STATION.southZ,
    radius: STATION_RADIUS,
  },
]
