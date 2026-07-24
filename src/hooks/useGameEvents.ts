import { useEffect } from 'react'
import { gameEvents } from '../game/events/GameEventBus'
import type { GameEventMap } from '../game/events/gameEvents'

export function useGameEvent<K extends keyof GameEventMap & string>(
  name: K,
  handler: (payload: GameEventMap[K]) => void,
): void {
  useEffect(() => {
    return gameEvents.on(name, handler)
  }, [name, handler])
}
