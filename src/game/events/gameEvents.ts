export interface InteractionAvailablePayload {
  id: string
  prompt: string
}

export interface InteractionTriggeredPayload {
  id: string
  title: string
  body: string
}

export interface GameEventMap {
  'interaction:available': InteractionAvailablePayload
  'interaction:unavailable': undefined
  'interaction:triggered': InteractionTriggeredPayload
  'overlay:closed': undefined
}

export type GameEventName = keyof GameEventMap
