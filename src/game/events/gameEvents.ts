export interface InteractionAvailablePayload {
  stopId: string
  prompt: string
}

export interface InteractionTriggeredPayload {
  stopId: string
}

export interface QuestTaskCompletedPayload {
  questId: string
  taskId: string
  label: string
}

export interface ZoneEnteredPayload {
  zoneId: string
  label: string
}

export interface GameEventMap {
  'interaction:available': InteractionAvailablePayload
  'interaction:unavailable': undefined
  'interaction:triggered': InteractionTriggeredPayload
  'overlay:closed': undefined
  'quest:task-completed': QuestTaskCompletedPayload
  // Player crossed into a new zone. Only fires when the zone id actually
  // changes; the initial fallback ('office') is suppressed so the world
  // doesn't toast the moment it loads.
  'zone:entered': ZoneEnteredPayload
  // Teleport the player back to PLAYER_SPAWN and clear their velocity.
  // Emitted by the failure "Try Again" flow.
  'player:respawn': undefined
}

export type GameEventName = keyof GameEventMap
