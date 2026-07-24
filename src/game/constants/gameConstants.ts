export const TILE_SIZE = 32

export const MAP_WIDTH_TILES = 20
export const MAP_HEIGHT_TILES = 14

export const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE
export const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE

export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540

export const PLAYER_SPEED = 160

export const PLAYER_BODY_SIZE = 24

export const INTERACTION_ZONE_PADDING = 16

export const TEXTURE_KEYS = {
  Floor: 'floor',
  Wall: 'wall',
  Desk: 'desk',
  Tv: 'tv',
  Player: 'player',
  PlayerMarker: 'player-marker',
} as const

export const SCENE_KEYS = {
  Boot: 'BootScene',
  Office: 'OfficeScene',
} as const

export const COLORS = {
  background: 0x20252b,
  floor: 0x2f3540,
  floorAlt: 0x353b47,
  wall: 0x14171d,
  desk: 0x8a5a3c,
  deskTop: 0xa26a44,
  tvBezel: 0x0a0a0a,
  tvScreen: 0x3aa0ff,
  player: 0x4a90e2,
  playerMarker: 0xf0f5ff,
} as const
