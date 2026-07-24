import { describe, expect, it, vi } from 'vitest'
import { InteractionManager } from '../src/game/interactions/InteractionManager'
import type { PresentationStop } from '../src/game/interactions/interactionTypes'

const stop: PresentationStop = {
  id: 'events-tv',
  label: 'Events Television',
  prompt: 'Press E to view meeting information',
  overlayTitle: 'Technology Status Meeting',
  position: [0, 0, 0],
  interactionZone: { size: [4, 3.5] },
  content: { type: 'events', events: [] },
}

const zone = { x: 100, y: 100, width: 50, height: 50 }

function build() {
  const onAvailable = vi.fn()
  const onUnavailable = vi.fn()
  const onTriggered = vi.fn()
  const manager = new InteractionManager({ onAvailable, onUnavailable, onTriggered })
  manager.registerZone(zone, stop)
  return { manager, onAvailable, onUnavailable, onTriggered }
}

describe('InteractionManager', () => {
  it('does not fire available when the player is outside all zones', () => {
    const { manager, onAvailable, onUnavailable } = build()
    manager.update({ x: 0, y: 0 })
    expect(onAvailable).not.toHaveBeenCalled()
    expect(onUnavailable).not.toHaveBeenCalled()
    expect(manager.getActiveId()).toBeNull()
  })

  it('fires available exactly once when the player enters a zone', () => {
    const { manager, onAvailable } = build()
    manager.update({ x: 120, y: 120 })
    manager.update({ x: 125, y: 125 })
    expect(onAvailable).toHaveBeenCalledTimes(1)
    expect(onAvailable).toHaveBeenCalledWith(stop)
    expect(manager.getActiveId()).toBe('events-tv')
  })

  it('fires unavailable when the player leaves the zone', () => {
    const { manager, onUnavailable } = build()
    manager.update({ x: 120, y: 120 })
    manager.update({ x: 0, y: 0 })
    expect(onUnavailable).toHaveBeenCalledTimes(1)
    expect(manager.getActiveId()).toBeNull()
  })

  it('trigger returns the active stop and calls onTriggered', () => {
    const { manager, onTriggered } = build()
    manager.update({ x: 120, y: 120 })
    const result = manager.trigger()
    expect(result).toBe(stop)
    expect(onTriggered).toHaveBeenCalledWith(stop)
  })

  it('trigger returns null when no zone is active', () => {
    const { manager, onTriggered } = build()
    manager.update({ x: 0, y: 0 })
    expect(manager.trigger()).toBeNull()
    expect(onTriggered).not.toHaveBeenCalled()
  })

  it('disabled manager does not trigger and clears any active zone', () => {
    const { manager, onTriggered, onUnavailable } = build()
    manager.update({ x: 120, y: 120 })
    manager.disable()
    expect(onUnavailable).toHaveBeenCalledTimes(1)
    expect(manager.trigger()).toBeNull()
    expect(onTriggered).not.toHaveBeenCalled()
    expect(manager.getActiveId()).toBeNull()
  })

  it('re-enabling picks the zone back up on next update', () => {
    const { manager, onAvailable } = build()
    manager.update({ x: 120, y: 120 })
    manager.disable()
    manager.enable()
    manager.update({ x: 120, y: 120 })
    expect(onAvailable).toHaveBeenCalledTimes(2)
    expect(manager.getActiveId()).toBe('events-tv')
  })
})
