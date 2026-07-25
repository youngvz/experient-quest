import { THE_GARAGE, THE_LAB, THE_STATION } from '../../constants/gameConstants'
import type { ProximityAnchor } from './ProximityManager'

// Radii in meters: how far *outside* a room's bounding rect the player
// can be before the room mounts. Sized generously so the chunk fetches,
// parses, and *renders* well before the room enters the player's sight
// line — the branch rooms are visible through glass storefront walls
// from the central corridor, so a pop-in inside the radius still reads
// as stark. At PLAYER_RUN_SPEED (16.25 m/s) these give ~2-3s of
// headroom past the nearest glass line-of-sight. FadeIn wraps each
// branch to smooth the final transition once the chunk parses.
const LAB_RADIUS = 30
const STATION_RADIUS = 30
const GARAGE_RADIUS = 30

// The Bakery is eagerly imported in OfficeWorld (spawn-adjacent, must be
// present frame 1) so it has no proximity anchor here. Lab and Station
// stream in as the player walks north.
export const PROXIMITY_ANCHORS: readonly ProximityAnchor[] = [
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
  {
    id: 'the-garage',
    minX: THE_GARAGE.westX,
    maxX: THE_GARAGE.eastX,
    minZ: THE_GARAGE.conference.northZ,
    maxZ: THE_GARAGE.southZ,
    radius: GARAGE_RADIUS,
  },
]
