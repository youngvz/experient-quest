import { CHARACTERS, getCharacter, type Character, type CharacterId } from './characters'
import { useGameStore } from '../state/gameStore'

// Characters the player can pick on the CharacterSelect screen.
// Excluded from selection:
//   - Distasi anchors the weekly-status-meeting quest unlock.
//   - Catherine's dialogue is what completes the meeting's
//     `company-updates` task — the player has to talk to her.
//   - Tenant is a fixed-pose focus-room character with no wave clip.
// Anyone here can be safely swapped with youngvz at their office spot
// without breaking the quest chain.
export const SELECTABLE_CHARACTER_IDS: readonly CharacterId[] = [
  'youngvz',
  'jacquelyn',
  'juan',
  'sarah',
  'logan',
] as const

// Sentinel speakerId used by dialogue lines that represent "the player
// speaking". Resolved at render time to whichever character was picked
// on the CharacterSelect screen. Any dialogue line authored FROM the
// player's perspective should use this instead of a hardcoded id.
export const PLAYER_SPEAKER_ID = 'player'

// Resolve a dialogue line's speakerId against the currently-selected
// character. The rules:
//   - PLAYER_SPEAKER_ID → the picked character (youngvz by default)
//   - if the line is anchored to the same character the player picked
//     (e.g. Jacquelyn's own dialogue while the player IS Jacquelyn),
//     swap to youngvz — the stand-in model is who's actually there.
//   - otherwise → speaker is unchanged
export function resolveSpeaker(
  speakerId: string,
  selected: CharacterId,
): Character {
  if (speakerId === PLAYER_SPEAKER_ID) return getCharacter(selected)
  if (speakerId === selected && selected !== 'youngvz') {
    return getCharacter('youngvz')
  }
  return getCharacter(speakerId)
}

// Replace {player} placeholders in dialogue / narration text with the
// picked character's display name. Case-preserving variants ({Player},
// {PLAYER}) exist for capitalized / all-caps sentence positions.
export function substitutePlayerName(text: string, playerName: string): string {
  return text
    .replaceAll('{player}', playerName.toLowerCase())
    .replaceAll('{Player}', playerName)
    .replaceAll('{PLAYER}', playerName.toUpperCase())
}

// Where each role stands in the world, keyed by the character normally
// placed there. `role` is the id passed by the room component; `selected`
// is the character the player picked. When `selected` matches a role,
// youngvz takes their spot so the world always has someone at every
// PresentationStop anchor.
export function resolveCharacterUrl(
  role: CharacterId,
  selected: CharacterId,
): string {
  if (selected === 'youngvz') return CHARACTERS[role].glbUrl
  if (role === selected) return CHARACTERS.youngvz.glbUrl
  return CHARACTERS[role].glbUrl
}

// Hook wrapper — rooms call this instead of reading CHARACTERS[role].glbUrl
// directly so the model swaps when the selected character matches this role.
export function useEmployeeUrl(role: CharacterId): string {
  const selected = useGameStore((s) => s.selectedCharacterId)
  return resolveCharacterUrl(role, selected)
}
