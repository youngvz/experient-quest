// World is measured in meters. One "tile" from the 2D prototype = 1m.

export const TILE_SIZE = 1

export const ROOM_WIDTH = 20
export const ROOM_DEPTH = 14
export const WALL_HEIGHT = 3
export const WALL_THICKNESS = 0.4

export const PLAYER_RADIUS = 0.35
export const PLAYER_HEIGHT = 1.6
export const PLAYER_SPEED = 4
export const PLAYER_SPAWN: [number, number, number] = [0, PLAYER_HEIGHT / 2 + 0.05, 2]

export const DESK = {
  center: [-4, 0, -1] as [number, number, number],
  size: [4, 0.9, 2] as [number, number, number],
}

export const TV = {
  center: [0, 1.6, -ROOM_DEPTH / 2 + WALL_THICKNESS / 2 + 0.15] as [number, number, number],
  size: [2.4, 1.4, 0.15] as [number, number, number],
}

export const INTERACTION_ZONE = {
  center: [0, 0, TV.center[2] + 2.5] as [number, number, number],
  size: [4, 3.5] as [number, number],
}

export const CAMERA_OFFSET: [number, number, number] = [0, 8, 8]
export const CAMERA_LOOK_HEIGHT = 0.5

export const COLORS = {
  floor: '#2f3540',
  floorAccent: '#3a4150',
  wall: '#1a1d24',
  desk: '#8a5a3c',
  deskTop: '#a26a44',
  tvBezel: '#0a0a0a',
  tvScreen: '#3aa0ff',
  player: '#4a90e2',
  playerFace: '#f0f5ff',
} as const
