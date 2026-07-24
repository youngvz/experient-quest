// Engine-agnostic zone tracker. Owns a list of named XZ rectangles; each
// frame the caller pushes the player's XZ position and the manager fires a
// callback whenever the *most-specific* rect the point falls inside
// changes. If the point isn't inside any rect, it falls back to a default
// zone (the "outer" zone, typically 'office' or 'corridor').
//
// Mirrors the InteractionManager design: kept out of React/Rapier so it's
// unit-testable and reusable if we ever add non-3D presentations.

export interface ZoneRect {
  id: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface ZoneManagerOptions {
  fallback: string
  onChange: (zoneId: string) => void
}

export class ZoneManager {
  private zones: ZoneRect[] = []
  private current: string
  private readonly fallback: string
  private readonly onChange: (zoneId: string) => void

  constructor({ fallback, onChange }: ZoneManagerOptions) {
    this.fallback = fallback
    this.current = fallback
    this.onChange = onChange
  }

  registerZone(zone: ZoneRect) {
    this.zones.push(zone)
  }

  clearZones() {
    this.zones = []
  }

  // Called each frame from the player's useFrame. Cheap: N rect checks.
  // If more than one rect contains the point, the *first* registered one
  // wins — register more specific zones first if that matters.
  update(x: number, z: number) {
    let hit: string = this.fallback
    for (const zone of this.zones) {
      if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
        hit = zone.id
        break
      }
    }
    if (hit !== this.current) {
      this.current = hit
      this.onChange(hit)
    }
  }

  getCurrent(): string {
    return this.current
  }
}
