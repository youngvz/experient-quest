# Assets and Content

## Hybrid visual strategy

Use the cheapest asset type that communicates the idea well.

| Content | Preferred representation |
|---|---|
| Office shell, walls, floor, rooms | Low-poly 3D GLB |
| Desks, chairs, TVs, signs, plants, decor | Simple reusable 3D props |
| Most employees | 2D transparent sprites or illustrated billboards |
| Player character | Rigged GLB when animation adds value |
| Important presenter | Rigged GLB or a high-quality animated billboard |
| Slides, project updates, events | React overlay or texture on an in-world screen |
| New-hire wall | Billboard cards or a UI panel anchored in 3D |

Do not turn every employee into a rigged 3D model.

## Canonical formats

Shipping formats:

- `.glb` for 3D geometry, rigs, and clips
- `.ktx2` where texture compression is worth the pipeline cost
- `.png` or `.webp` for transparent 2D characters and UI art
- `.json` or TypeScript modules for presentation data
- Browser-supported compressed audio formats with a fallback when necessary

Do not ship FBX or OBJ to the browser. Convert source files during the offline pipeline.

## 3D pipeline

```text
Source or generated model
  -> Blender cleanup
  -> glTF 2.0 / GLB export
  -> glTF-Validator
  -> glTF-Transform optimization
  -> texture compression where appropriate
  -> size and metadata checks
  -> versioned public asset path
```

Use Meshopt as the normal starting point for geometry compression. Use Draco selectively for static geometry when its size benefit justifies decode cost.

## Blender conventions

- Keep scale and orientation consistent.
- Apply or deliberately manage transforms.
- Use descriptive node and material names.
- Separate render meshes, collision meshes, and navmeshes.
- Store runtime metadata in custom properties exported to glTF `extras`.
- Organize animation clips using actions or NLA tracks.
- Avoid excessive material count.
- Prefer shared atlases or reusable materials for low-poly office kits.

Example metadata:

```json
{
  "kind": "presentationStation",
  "stationId": "new-hires",
  "interactionLabel": "Meet the new hires"
}
```

## Runtime loading

Use `useGLTF` or `useLoader` so assets participate in loader caching.

Use `gltfjsx` for important reusable models when typed node access, material replacement, animation access, or conditional meshes improve maintainability.

Preload only critical assets:

- Office shell
- Player model
- First presentation stop
- Essential UI fonts and icons

Stream optional decorations, later stops, and non-critical media after the initial scene is usable.

## Billboard characters

Recommended implementation:

- A plane or sprite with transparent texture
- A fixed world-space size appropriate to the office scale
- Camera-facing rotation, optionally constrained to the Y axis
- Separate collider or interaction volume
- Texture atlases when many characters share dimensions
- Optional 2-6 frame idle animation, not large sprite sheets by default

Handle transparency carefully. Test overlapping billboards, depth sorting, outlines, and shadows on representative devices.

## Asset sourcing

Strong starting sources:

- Kenney for CC0 prototyping and simple production assets
- Quaternius for stylized low-poly environments and props
- Mixamo for temporary humanoid rigs and clips

Track provenance for every external asset:

```ts
export interface AssetProvenance {
  assetId: string
  source: string
  creator?: string
  license: string
  acquiredAt: string
  commercialUseAllowed: boolean
  attributionRequired: boolean
  modifications?: string[]
}
```

Do not merge assets with unclear commercial rights.

## AI-assisted assets

AI tools are suitable for first passes, concepts, and source material.

Potential uses:

- Meshy or Tripo for initial 3D props and character concepts
- DeepMotion or Rokoko for video-to-animation
- Avaturn for avatar-style characters when its visual style and license fit

Required review before shipping:

1. Confirm commercial usage rights for the account and generated output.
2. Inspect topology, normals, UVs, and material count.
3. Remove hidden or unnecessary geometry.
4. Normalize scale and transforms.
5. Simplify textures and resize them.
6. Standardize skeleton and clip names.
7. Export clean GLB.
8. Validate and optimize.
9. Test on low-end mobile hardware.

Do not adopt Ready Player Me as a new service dependency. Its official services were discontinued in January 2026.

## Content authoring

Keep business content separate from scene code.

Suggested structure:

```text
src/game/content/meetings/
  2026-technology-status.ts
  people.ts
  projects.ts
  events.ts
public/assets/
  employees/
  office/
  props/
  presenters/
  media/
```

Content records should reference asset IDs from an asset manifest rather than hardcoded URLs spread through components.
