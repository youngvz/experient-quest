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

export interface GameEventMap {
  'interaction:available': InteractionAvailablePayload
  'interaction:unavailable': undefined
  'interaction:triggered': InteractionTriggeredPayload
  'overlay:closed': undefined
  'quest:task-completed': QuestTaskCompletedPayload
}

export type GameEventName = keyof GameEventMap
