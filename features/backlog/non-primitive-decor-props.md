---
id: non-primitive-decor-props
status: backlog
created: 2026-07-26
owner: unassigned
---

# Non-primitive decor props (GLBs + billboards)

## Why

The current decor prop set (`FilingCabinet`, `WaterCooler`, `FaxMachine`,
`Telephone`, `Mug`, `Sofa`, `Painting`) is 100% Three.js primitives —
zero asset bytes, but the trade-off is that anything with organic or
irregular geometry (plants, curved phone handsets, layered ornaments,
kettles, coat racks, framed art with actual imagery) either looks
blocky or can't be represented at all. The infrastructure for both
GLB loading (via drei `useGLTF`, decoded with Meshopt or Draco) and
textured planes (via drei `useTexture`, first wired in `Painting.tsx`)
already exists. This item captures the remaining work needed to bring
GLB props and billboard sprites online as first-class content types
without breaking the primitives-first authoring style or the
performance budget from `docs/performance.md` (draw-call bands,
avoiding 4K textures on small props).

## Scope

Two independent tracks — pick either or both per pass:

### Track 1: GLB decor props

- Source CC0 / AI-generated GLBs from a small allowlist (Kenney office
  kit, Poly Haven, Sketchfab CC0, Meshy/Rodin exports). Treat as
  untrusted per non-negotiable rule 6 — inspect via
  `npm run optimize-glb -- --inspect` and Blender before shipping.
- Strip unused animation clips and materials; ensure a single shared
  material per prop family where possible.
- Run `npm run optimize-glb` (Meshopt default; both Meshopt and Draco
  are decoded by drei's `useGLTF` with no loader changes — see
  `scripts/README.md`).
- Target ≤ 50 KB per untextured decorative GLB; drop into
  `public/assets/props/` (directory already exists, currently empty).
- Add loader components alongside existing primitive props in
  `src/game/scene/`. Signature should mirror `Laptop.tsx` (`position:
  [x, z]`, `deskTopY?` / `floorY`, `rotationY`, optional `scale`) so
  room authors can swap primitive ↔ GLB without touching call sites.
- Preload critical props in `OfficeWorld.tsx` next to the existing
  character `useGLTF.preload` calls; leave decorative-only GLBs on
  demand-load.
- Candidate first props: potted plant, coat rack, hanging pendant
  lamp, kettle, curved-handset phone (replaces `Telephone.tsx` when
  ready).

### Track 2: Billboard / textured-plane decor

- Extend the `useTexture` pattern established by `Painting.tsx` to
  cover: wall posters, framed photos with real imagery, ceiling
  vents (drei `Decal`), floor tile patterns, and cross-billboard
  plants (two crossed alpha-clipped planes for a stylized fern).
- Ship a small shared atlas (`public/assets/props/*-atlas.webp`) per
  prop family; each variant picks a UV window via a `tile` index —
  the tile-mode branch in `Painting.tsx` already implements this.
  Add `useTexture.preload(...)` in `OfficeWorld.tsx` for each atlas.
- Author the first painting atlas so `Painting` call sites can
  migrate off the `color` placeholder branch.
- Add a `Plant.tsx` cross-billboard component: two alpha-clipped
  `<planeGeometry>` planes crossed at 90°, textured from a plant
  sprite sheet. `~10–30 KB` per plant per `docs/performance.md`.

## Non-goals

- No KTX2/Basis loader wiring — the current baseline caps atlases at
  well below 200 KB. Revisit only if a single atlas exceeds that.
- No new instancing / batching infrastructure — drei's `Instances` /
  `Instance` (already used in `Exterior.tsx`) is sufficient for
  primitive families that repeat; GLB props that repeat can use
  drei's `Merged` if a specific room needs it, but don't scaffold
  ahead of need.
- No `PropRegistry` / prefab layer per `docs/architecture.md` —
  remains aspirational.
- No player-facing quest / interaction hookup on the new props.

## Acceptance criteria

- At least one GLB decor prop shipped end-to-end: sourced, optimized,
  loaded via `useGLTF`, placed in ≥ 1 room. Bundle asset ≤ 50 KB
  untextured (or ≤ 150 KB textured with a shared atlas).
- At least one billboard/textured-plane prop shipped end-to-end —
  either the paintings atlas migration or a `Plant.tsx` component
  with a small sprite sheet.
- `docs/assets-and-content.md` updated: (a) note `useTexture` is now
  a supported pattern with `Painting.tsx` as the reference, (b) add
  a short GLB-sourcing checklist referencing `optimize-glb` and the
  untrusted-asset rule.
- `npm run build`, `npm run lint`, `npm run test`, and
  `npm run test:e2e` all pass. Draw-call counts stay within the bands
  from `docs/performance.md` (mobile 150–250, desktop 250–400) with
  the new props placed.
- No 4K textures shipped on small props; each texture atlas sits at
  the display-size-driven resolution recommended in
  `docs/performance.md`.

## Implementation notes

- `Painting.tsx` already loads its atlas lazily — the `useTexture`
  call sits inside `TileCanvas`, only rendered when a caller passes
  `tile`. The `color` branch stays useful as a placeholder for
  in-progress art. Follow the same lazy-branch pattern for any new
  atlas-backed component so a missing atlas doesn't hard-fail the
  whole room.
- Rooms consume prop components directly today (no room-authoring
  grid marker for decor). If a room ends up placing > 3 of one prop
  type, add a marker to `docs/room-authoring.md`'s legend and hoist
  the placement list into `gameConstants.ts` following the
  `THE_STATION_WEST_WORKSTATIONS` pattern.
- Alpha-clip billboards (plants, foliage) should use
  `alphaTest: 0.5` on a `meshBasicMaterial`, not blended
  transparency — blended surfaces sort against the transmission
  glass panes and are expensive. `docs/performance.md` calls out
  "minimize transparent surfaces" specifically.
- `SkeletonUtils.clone` is only needed for rigged GLBs; decorative
  static meshes can share the drei-loaded scene directly (see the
  Player/Employee usage for the rigged case).
- Colors for GLB props should still read from `COLORS` in
  `gameConstants.ts` when the model exposes overrideable materials,
  so the palette stays centralized.

## Rough estimate

- Track 1 (GLB): 1 focused pass per prop family — sourcing +
  optimization is often the slow step.
- Track 2 (billboards): 1 pass to author the first atlas and the
  `Plant.tsx` component; subsequent atlases are additive.

## Related

- `docs/assets-and-content.md` — hybrid strategy table + prop
  conventions; needs the follow-up edits described in the
  acceptance criteria.
- `docs/performance.md` — draw-call bands, texture-size guidance,
  transparency budget.
- `scripts/optimize-glb.mjs` + `scripts/README.md` — Meshopt / Draco
  pipeline used by every GLB.
- `src/game/scene/Painting.tsx` — first `useTexture` prop, reference
  for tile-mode atlas UV math.
- `src/game/scene/Exterior.tsx` — canonical `Instances` / `Instance`
  pattern for repeated primitives (and, if needed later, repeated
  GLBs via `Merged`).
- `src/game/scene/{Player,Employee}.tsx` — canonical `useGLTF` +
  `SkeletonUtils.clone` recipe; static GLB props won't need the
  skeleton clone.
- `public/assets/props/` — currently empty; destination for new GLB
  and atlas files.
- Prior turns 2026-07-25 – 2026-07-26: introduced the primitives-only
  decor set (`FilingCabinet`, `WaterCooler`, `FaxMachine`, `Telephone`,
  `Mug`, `Sofa`, `Painting`) and the plan doc at
  `~/.claude/plans/i-want-to-start-mighty-hanrahan.md`.
