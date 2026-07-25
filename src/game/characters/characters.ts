// Central registry for playable/spawnable characters. Each entry ties a
// GLB (used by <Player> or <Employee>) to a portrait PNG (used by the
// pixel-art DialogueOverlay). Dialogue lines reference speakers by id here.

export interface Character {
  id: string
  name: string
  glbUrl: string
  portraitUrl: string
}

const BASE = import.meta.env.BASE_URL

export const CHARACTERS = {
  youngvz: {
    id: 'youngvz',
    name: 'Youngvz',
    glbUrl: `${BASE}assets/player/youngvz.glb`,
    portraitUrl: `${BASE}assets/player/youngvz.png`,
  },
  distasi: {
    id: 'distasi',
    name: 'Distasi',
    glbUrl: `${BASE}assets/employees/distasi.glb`,
    portraitUrl: `${BASE}assets/employees/distasi.png`,
  },
} as const satisfies Record<string, Character>

export type CharacterId = keyof typeof CHARACTERS

export function getCharacter(id: string): Character {
  const c = (CHARACTERS as Record<string, Character>)[id]
  if (!c) throw new Error(`Unknown character id: ${id}`)
  return c
}
