// Area-of-interest filter. Mirrors the zones the client registers in
// src/game/scene/Player.tsx: each named region + which regions are
// walk-adjacent to it. Two players hear each other iff their active
// zones are the same OR share an edge in this graph.
//
// Kept as a static graph (not derived from the client's rect list) so
// the server has zero dependency on room geometry constants — new
// zones are added here explicitly. Unknown zone ids fall back to a
// permissive "office" bucket (see resolveZone below).

export type ZoneId =
  | 'office'
  | 'the-bakery'
  | 'central-corridor'
  | 'east-corridor'
  | 'corridor-pocket'
  | 'north-east-corridor'
  | 'the-lab'
  | 'the-station'
  | 'the-boardroom'
  | 'the-garage'
  | 'outdoor'

// Each entry lists the zones a player in that zone can also see. The
// graph is intentionally symmetric — assertSymmetric() in the tests
// (when we add them) will guard against typos.
const ADJACENCY: Record<ZoneId, ReadonlyArray<ZoneId>> = {
  // The fallback bucket. Anything not inside a specific rect (spawn,
  // exterior scaffold, unregistered) sees the corridor + immediate
  // neighbors.
  office: ['central-corridor', 'the-bakery', 'east-corridor', 'outdoor'],

  'the-bakery': ['office', 'central-corridor'],

  'central-corridor': [
    'office',
    'the-bakery',
    'east-corridor',
    'corridor-pocket',
    'north-east-corridor',
    'the-lab',
    'the-station',
    'the-garage',
  ],

  'east-corridor': ['office', 'central-corridor', 'corridor-pocket'],

  'corridor-pocket': ['central-corridor', 'east-corridor'],

  'north-east-corridor': ['central-corridor', 'the-lab', 'the-station'],

  'the-lab': ['central-corridor', 'north-east-corridor'],

  'the-station': ['central-corridor', 'north-east-corridor', 'the-boardroom'],

  'the-boardroom': ['the-station'],

  'the-garage': ['central-corridor'],

  outdoor: ['office'],
}

const KNOWN_ZONES = new Set<string>(Object.keys(ADJACENCY))

// Coerce an arbitrary client-supplied zone id into one the graph knows.
// New rooms should be added to ADJACENCY before their zone id appears
// on the wire, but a defensive fallback keeps things sane if a client
// ships a new zone before the server does.
export function resolveZone(id: string): ZoneId {
  return (KNOWN_ZONES.has(id) ? id : 'office') as ZoneId
}

// True iff a viewer in `viewerZone` should see a player in `otherZone`.
// Same-zone always visible; adjacency is symmetric so order doesn't
// matter, but we accept both args for readability at call sites.
export function isVisible(viewerZone: string, otherZone: string): boolean {
  const a = resolveZone(viewerZone)
  const b = resolveZone(otherZone)
  if (a === b) return true
  const neighbors = ADJACENCY[a]
  return neighbors.includes(b as ZoneId)
}

// Test-only: returns a sorted list of every (a, b) adjacency edge for
// symmetry / coverage asserts. Not called at runtime.
export function _debugAdjacencyEdges(): Array<[ZoneId, ZoneId]> {
  const edges: Array<[ZoneId, ZoneId]> = []
  for (const [zone, neighbors] of Object.entries(ADJACENCY) as Array<
    [ZoneId, ReadonlyArray<ZoneId>]
  >) {
    for (const n of neighbors) edges.push([zone, n])
  }
  edges.sort(([a1, a2], [b1, b2]) => (a1 + a2).localeCompare(b1 + b2))
  return edges
}
