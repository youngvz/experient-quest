export interface InteractionAvailablePayload {
  stopId: string
  prompt: string
}

export interface InteractionTriggeredPayload {
  stopId: string
}

export interface GameEventMap {
  'interaction:available': InteractionAvailablePayload
  'interaction:unavailable': undefined
  'interaction:triggered': InteractionTriggeredPayload
  'overlay:closed': undefined
}

export type GameEventName = keyof GameEventMap
