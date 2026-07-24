import type { GameEventMap } from './gameEvents'

export class TypedEventBus<EventMap> {
  private readonly target = new EventTarget()

  on<K extends keyof EventMap & string>(
    name: K,
    handler: (payload: EventMap[K]) => void,
  ): () => void {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<EventMap[K]>).detail
      handler(detail)
    }
    this.target.addEventListener(name, listener)
    return () => this.target.removeEventListener(name, listener)
  }

  emit<K extends keyof EventMap & string>(name: K, payload: EventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(name, { detail: payload }))
  }
}

export const gameEvents = new TypedEventBus<GameEventMap>()
