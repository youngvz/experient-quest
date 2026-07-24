# Performance

## Target behavior

Prioritize stable frame pacing and fast startup over visual complexity.

Initial targets:

| Device class | Target FPS | Draw-call target | Notes |
|---|---:|---:|---|
| Low-end mobile | 30 | 100-150 | Low DPR, limited shadows, no expensive postprocessing |
| Mid mobile / low laptop | 45-60 | 150-250 | One primary shadow-casting light at most |
| Mainstream desktop | 60 | 250-400 | Higher DPR and effects only when measured safe |

These are working budgets, not guarantees.

## Frame-loop rules

Inside `useFrame`:

- Use `delta` for movement and interpolation.
- Mutate refs instead of calling React state setters.
- Reuse vectors, quaternions, matrices, and raycasters.
- Avoid array creation, object spreads, and repeated store reads.
- Avoid traversing the full scene each frame.
- Keep expensive queries at a lower frequency when possible.

Bad:

```ts
useFrame(() => setPosition([x + 1, y, z]))
```

Better:

```ts
const movement = new THREE.Vector3()

useFrame((_, delta) => {
  movement.set(input.x, 0, input.z).multiplyScalar(speed * delta)
  playerRef.current.position.add(movement)
})
```

In real code, keep reusable temporary objects outside the callback or in refs.

## Geometry and materials

- Reuse materials and geometry.
- Instance repeated desks, chairs, plants, lights, and decorative props.
- Merge static geometry only when it does not hurt culling or authoring flexibility.
- Minimize transparent surfaces.
- Keep material count low.
- Prefer baked lighting, ambient light, and simple directional lighting.
- Avoid each prop casting and receiving real-time shadows by default.

## Characters

- Use billboard characters for most employees.
- Keep visible skinned characters limited.
- Reuse skeleton-compatible models where possible.
- Pause mixers for offscreen or inactive animated characters.
- Use lower frame-rate sprite animation for ambient billboard motion.

## Textures

- Resize textures to their actual display needs.
- Avoid 4K textures for small office props.
- Use KTX2 for large or repeated 3D textures when supported by the pipeline.
- Use atlases for related low-poly props and employee sprites when it reduces material switches.
- Track approximate GPU memory, not only download size.

## Quality profiles

Define profiles rather than scattering conditionals.

```ts
export interface QualityProfile {
  id: 'low' | 'medium' | 'high'
  dprMax: number
  shadows: 'off' | 'basic' | 'full'
  postprocessing: boolean
  maxDynamicLights: number
  billboardAnimationFps: number
}
```

Select a starting profile through GPU/device capability detection, then allow the user to override it.

Reduced-motion mode should also reduce:

- Camera sway
- Large zoom transitions
- Parallax-heavy motion
- Screen shake
- Decorative sprite animation

## Loading strategy

The first interactive view should not wait for every asset.

1. Load the application shell.
2. Determine a quality profile.
3. Load the office shell, player, and first interaction.
4. Enter the scene.
5. Stream optional props and later presentation content.

Show meaningful progress for critical assets. Do not display false precision for the entire application download.

## Disposal

On scene or level teardown:

- Dispose obsolete geometries
- Dispose materials and textures not shared elsewhere
- Stop animation mixers
- Remove event listeners
- Release controls
- Remove Rapier bodies and colliders
- Clear application-owned cache entries only when intentional

Add a repeatable test that enters and exits the main scene multiple times and watches memory behavior.

## Performance review checklist

- No per-frame React state updates
- No obvious allocations in hot loops
- Repeated props use instancing where useful
- Asset sizes are reviewed
- Low quality mode disables expensive rendering
- Scene remains usable at narrow viewport sizes
- Startup and first interaction are measured on a real mobile device
