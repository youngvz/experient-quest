import { describe, expect, it, vi } from 'vitest'
import { ProximityManager } from '../src/game/scene/proximity/ProximityManager'

function build() {
  const onChange = vi.fn<(nearby: ReadonlySet<string>) => void>()
  const pm = new ProximityManager({ onChange })
  return { pm, onChange }
}

describe('ProximityManager', () => {
  it('starts with an empty membership set', () => {
    const { pm } = build()
    expect(pm.getCurrent().size).toBe(0)
  })

  it('adds a room when the player enters its rect + radius', () => {
    const { pm, onChange } = build()
    pm.registerAnchor({ id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10, radius: 5 })
    // Player at (12, 5): dx = 2, dz = 0, distance 2 <= 5 → inside range.
    pm.update(12, 5)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(pm.getCurrent().has('a')).toBe(true)
  })

  it('does not fire onChange while membership stays the same', () => {
    const { pm, onChange } = build()
    pm.registerAnchor({ id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10, radius: 5 })
    pm.update(5, 5) // inside
    pm.update(6, 6) // still inside
    pm.update(11, 5) // dx=1 → still inside
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('drops a room when the player leaves its radius', () => {
    const { pm, onChange } = build()
    pm.registerAnchor({ id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10, radius: 5 })
    pm.update(5, 5) // inside
    pm.update(20, 5) // dx=10 > 5 → out
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(pm.getCurrent().size).toBe(0)
  })

  it('treats a shared id across multiple anchors as one logical room', () => {
    const { pm, onChange } = build()
    // Two disjoint rects both tagged 'lab' — L-shape scenario.
    pm.registerAnchor({ id: 'lab', minX: 0, maxX: 5, minZ: 0, maxZ: 20, radius: 3 })
    pm.registerAnchor({ id: 'lab', minX: 5, maxX: 15, minZ: 15, maxZ: 20, radius: 3 })
    pm.update(2, 5) // inside first rect only
    expect(pm.getCurrent().has('lab')).toBe(true)
    onChange.mockClear()
    pm.update(10, 17) // inside second rect only — membership unchanged
    expect(pm.getCurrent().has('lab')).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('tracks multiple rooms independently', () => {
    const { pm, onChange } = build()
    pm.registerAnchor({ id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10, radius: 2 })
    pm.registerAnchor({ id: 'b', minX: 50, maxX: 60, minZ: 0, maxZ: 10, radius: 2 })
    pm.update(5, 5) // in a
    pm.update(55, 5) // now in b, left a
    expect(onChange).toHaveBeenCalledTimes(2)
    const last = onChange.mock.calls.at(-1)![0]
    expect(last.has('a')).toBe(false)
    expect(last.has('b')).toBe(true)
  })

  it('respects rect-distance geometry, not centroid-distance', () => {
    const { pm } = build()
    // Long thin rect — centroid at (50, 5), radius 3.
    // A point at (0, 5) is 3m from the LEFT EDGE, not from the centroid.
    pm.registerAnchor({ id: 'r', minX: 3, maxX: 100, minZ: 0, maxZ: 10, radius: 3 })
    pm.update(0, 5)
    expect(pm.getCurrent().has('r')).toBe(true)
    pm.update(-5, 5)
    expect(pm.getCurrent().has('r')).toBe(false)
  })

  it('clearAnchors resets the anchor list without touching membership', () => {
    const { pm, onChange } = build()
    pm.registerAnchor({ id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10, radius: 3 })
    pm.update(5, 5)
    pm.clearAnchors()
    // Next update against no anchors → empty set.
    pm.update(5, 5)
    expect(pm.getCurrent().size).toBe(0)
    expect(onChange).toHaveBeenLastCalledWith(new Set())
  })

  it('disable() halts onChange emission', () => {
    const { pm, onChange } = build()
    pm.registerAnchor({ id: 'a', minX: 0, maxX: 10, minZ: 0, maxZ: 10, radius: 3 })
    pm.disable()
    pm.update(5, 5)
    expect(onChange).not.toHaveBeenCalled()
    pm.enable()
    pm.update(5, 5)
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
