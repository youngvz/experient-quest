import type { PresentationStop } from './interactionTypes'

export interface RectLike {
  x: number
  y: number
  width: number
  height: number
}

export interface InteractionManagerEvents {
  onAvailable: (stop: PresentationStop) => void
  onUnavailable: () => void
  onTriggered: (stop: PresentationStop) => void
}

interface RegisteredZone {
  id: string
  zone: RectLike
  stop: PresentationStop
}

// Rect origins are top-left (x,y is a corner, not a center). The scene passes X/Z
// positions here — kept renderer-agnostic so Vitest can exercise it without R3F.
export class InteractionManager {
  private readonly zones = new Map<string, RegisteredZone>()
  private readonly events: InteractionManagerEvents
  private activeId: string | null = null
  private enabled = true

  constructor(events: InteractionManagerEvents) {
    this.events = events
  }

  registerZone(zone: RectLike, stop: PresentationStop): void {
    this.zones.set(stop.id, { id: stop.id, zone, stop })
  }

  clearZones(): void {
    this.zones.clear()
    if (this.activeId !== null) {
      this.activeId = null
      this.events.onUnavailable()
    }
  }

  update(playerCenter: { x: number; y: number }): void {
    if (!this.enabled) {
      if (this.activeId !== null) {
        this.activeId = null
        this.events.onUnavailable()
      }
      return
    }

    const next = this.findActiveZone(playerCenter)
    const nextId = next ? next.id : null

    if (nextId === this.activeId) return

    this.activeId = nextId
    if (next) {
      this.events.onAvailable(next.stop)
    } else {
      this.events.onUnavailable()
    }
  }

  trigger(): PresentationStop | null {
    if (!this.enabled) return null
    if (this.activeId === null) return null
    const registered = this.zones.get(this.activeId)
    if (!registered) return null
    this.events.onTriggered(registered.stop)
    return registered.stop
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    if (!this.enabled) return
    this.enabled = false
    if (this.activeId !== null) {
      this.activeId = null
      this.events.onUnavailable()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getActiveId(): string | null {
    return this.activeId
  }

  private findActiveZone(point: { x: number; y: number }): RegisteredZone | null {
    for (const registered of this.zones.values()) {
      const { zone } = registered
      if (
        point.x >= zone.x &&
        point.x <= zone.x + zone.width &&
        point.y >= zone.y &&
        point.y <= zone.y + zone.height
      ) {
        return registered
      }
    }
    return null
  }
}
