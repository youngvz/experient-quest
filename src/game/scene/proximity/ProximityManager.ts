// Engine-agnostic proximity tracker. Owns a list of named XZ rectangles
// with per-anchor radii; each frame the caller pushes the player's XZ and
// the manager fires a callback whenever the *set* of anchors in range
// changes. Multiple anchors sharing the same id represent one logical
// room made of multiple rects (L-shapes, split floors, etc.) — the room
// is "nearby" if ANY of its anchors is in range.
//
// Mirrors ZoneManager's shape (registerX / clearX / update / onChange
// on-change-only) so consumers use the same mental model.

export interface ProximityAnchor {
  id: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  radius: number
}

export interface ProximityManagerOptions {
  onChange: (nearby: ReadonlySet<string>) => void
}

export class ProximityManager {
  private anchors: ProximityAnchor[] = []
  private current: ReadonlySet<string> = new Set()
  private enabled = true
  private readonly onChange: (nearby: ReadonlySet<string>) => void

  constructor({ onChange }: ProximityManagerOptions) {
    this.onChange = onChange
  }

  registerAnchor(anchor: ProximityAnchor) {
    this.anchors.push(anchor)
  }

  clearAnchors() {
    this.anchors = []
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  // Called each frame from the player's useFrame. Cheap: N rect checks.
  // Returns via onChange only when membership actually changes.
  update(x: number, z: number) {
    if (!this.enabled) return
    const next = new Set<string>()
    for (const a of this.anchors) {
      if (next.has(a.id)) continue
      const dx = x < a.minX ? a.minX - x : x > a.maxX ? x - a.maxX : 0
      const dz = z < a.minZ ? a.minZ - z : z > a.maxZ ? z - a.maxZ : 0
      // Compare squared distance to avoid sqrt in the hot path.
      if (dx * dx + dz * dz <= a.radius * a.radius) {
        next.add(a.id)
      }
    }
    if (!setsEqual(this.current, next)) {
      this.current = next
      this.onChange(next)
    }
  }

  getCurrent(): ReadonlySet<string> {
    return this.current
  }
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a === b) return true
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}
