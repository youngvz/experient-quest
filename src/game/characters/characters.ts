// Central registry for playable/spawnable characters. Each entry ties a
// GLB (used by <Player> or <Employee>) to a portrait PNG (used by the
// pixel-art DialogueOverlay). Dialogue lines reference speakers by id here.

export interface Character {
  id: string
  name: string
  glbUrl: string
  portraitUrl: string
}

export const CHARACTERS = {
  youngvz: {
    id: 'youngvz',
    name: 'Youngvz',
    glbUrl: '/assets/player/youngvz.glb',
    portraitUrl: '/assets/player/youngvz.png',
  },
  distasi: {
    id: 'distasi',
    name: 'Distasi',
    glbUrl: '/assets/employees/distasi.glb',
    portraitUrl: '/assets/employees/distasi.png',
  },
} as const satisfies Record<string, Character>

export type CharacterId = keyof typeof CHARACTERS

export function getCharacter(id: string): Character {
  const c = (CHARACTERS as Record<string, Character>)[id]
  if (!c) throw new Error(`Unknown character id: ${id}`)
  return c
}
