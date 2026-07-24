import type { InteractionDefinition, InteractionId } from './interactionTypes'

export interface RectLike {
  x: number
  y: number
  width: number
  height: number
}

export interface InteractionManagerEvents {
  onAvailable: (definition: InteractionDefinition) => void
  onUnavailable: () => void
  onTriggered: (definition: InteractionDefinition) => void
}

interface RegisteredZone {
  id: InteractionId
  zone: RectLike
  definition: InteractionDefinition
}

// Uses rect origins that match Phaser's zone.getBounds(): x/y are the top-left corner.
// Kept Phaser-free so Vitest can exercise it without a renderer.
export class InteractionManager {
  private readonly zones = new Map<InteractionId, RegisteredZone>()
  private readonly events: InteractionManagerEvents
  private activeId: InteractionId | null = null
  private enabled = true

  constructor(events: InteractionManagerEvents) {
    this.events = events
  }

  registerZone(id: InteractionId, zone: RectLike, definition: InteractionDefinition): void {
    this.zones.set(id, { id, zone, definition })
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
      this.events.onAvailable(next.definition)
    } else {
      this.events.onUnavailable()
    }
  }

  trigger(): InteractionDefinition | null {
    if (!this.enabled) return null
    if (this.activeId === null) return null
    const registered = this.zones.get(this.activeId)
    if (!registered) return null
    this.events.onTriggered(registered.definition)
    return registered.definition
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

  getActiveId(): InteractionId | null {
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
