import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import {
  COLORS,
  DOOR_HEIGHT,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'

// One shared material for all glass panes. Restores the original
// transmission=1 look (screen-space refraction, subtle color tint with
// distance) — the visual pop from that shader is worth its per-fragment
// cost. The important perf win here is *sharing the instance* across
// every WallPanel: previously each pane allocated its own physical
// material inline in JSX, so 25+ storefront panels compiled distinct
// shader/uniform pairings that couldn't batch. One module-scope
// instance means one draw state for every glass pane in the world.
const GLASS_MATERIAL = new MeshPhysicalMaterial({
  color: '#eaf3f9',
  roughness: 0.05,
  metalness: 0,
  transmission: 1,
  thickness: 0.15,
  ior: 1.05,
  attenuationColor: '#cfe0ee',
  attenuationDistance: 12,
  transparent: true,
  opacity: 0.6,
  // A crisp secondary specular layer on top of the transmissive base.
  // Reads as the polished-glass highlight when the sunset HDR catches
  // the pane at glancing angles — separates the surface from the
  // refracted room behind it so the pane doesn't disappear.
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  // Bump the environment reflection so the HDR shows up on the surface.
  envMapIntensity: 1.6,
})
// One shared opaque wall material — was allocated fresh at every
// <WallPanel /> render (four rails + N mullions per glass panel × 25+
// panels + every opaque wall in the world = hundreds of duplicate
// materials). Sharing lets the renderer batch draw states.
const WALL_MATERIAL = new MeshStandardMaterial({ color: COLORS.wall })

// Invisible full-height physics blocker sized to a doorway opening. Used to
// seal exterior doorways so the player can't leave the office. When a door
// should instead trigger a level change, swap this for a sensor collider that
// emits an event.
export function DoorBlocker({
  position,
  width,
  spansX,
}: {
  position: [number, number]
  width: number
  spansX: boolean
}) {
  const [px, pz] = position
  const half: [number, number, number] = spansX
    ? [width / 2, WALL_HEIGHT / 2, WALL_THICKNESS / 2]
    : [WALL_THICKNESS / 2, WALL_HEIGHT / 2, width / 2]
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={half} position={[px, WALL_HEIGHT / 2, pz]} />
    </RigidBody>
  )
}

// A rectangular "lintel" spanning the top of a doorway. Static — no collider,
// because the player physics box is shorter than the lintel is tall.
export function DoorHeader({
  position,
  width,
  spansX,
}: {
  position: [number, number]
  width: number
  spansX: boolean
}) {
  const headerHeight = WALL_HEIGHT - DOOR_HEIGHT
  const centerY = DOOR_HEIGHT + headerHeight / 2
  const [px, pz] = position
  const size: [number, number, number] = spansX
    ? [width, headerHeight, WALL_THICKNESS]
    : [WALL_THICKNESS, headerHeight, width]
  return (
    <mesh
      castShadow
      receiveShadow
      position={[px, centerY, pz]}
      material={WALL_MATERIAL}
    >
      <boxGeometry args={size} />
    </mesh>
  )
}

interface WallPanelProps {
  position: [number, number, number]
  size: [number, number, number]
  glass?: boolean
  // Number of visual sections the glass is split into. 3 sections = 2 mullions.
  // Defaults to auto (~1 mullion per MULLION_SPACING meters).
  divisions?: number
}

const FRAME_THICKNESS = 0.18
const MULLION_THICKNESS = 0.1
// One vertical divider per ~4 m of pane, minimum 1 divider per panel.
const MULLION_SPACING = 4

// Swap the face-width dimension so the frame math works whether the panel's
// wide axis is X (front/back walls) or Z (side walls).
function orient(
  isXFace: boolean,
  faceOffset: number,
  yOffset: number,
  thicknessOffset: number,
): [number, number, number] {
  return isXFace
    ? [faceOffset, yOffset, thicknessOffset]
    : [thicknessOffset, yOffset, faceOffset]
}

function orientSize(
  isXFace: boolean,
  faceSize: number,
  ySize: number,
  thicknessSize: number,
): [number, number, number] {
  return isXFace ? [faceSize, ySize, thicknessSize] : [thicknessSize, ySize, faceSize]
}

// A wall panel: physics collider is always present. When `glass` is true, the
// collider mesh is invisible and we build a framed window in its place — four
// opaque rails around the perimeter with a transmissive pane inside.
export function WallPanel({ position, size, glass = false, divisions }: WallPanelProps) {
  if (!glass) {
    return (
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={position}
          castShadow
          receiveShadow
          material={WALL_MATERIAL}
        >
          <boxGeometry args={size} />
        </mesh>
      </RigidBody>
    )
  }

  const [sx, sy, sz] = size
  const isXFace = sx >= sz
  const faceW = isXFace ? sx : sz
  const thickness = isXFace ? sz : sx
  const height = sy

  const F = FRAME_THICKNESS
  const paneFaceW = Math.max(0.01, faceW - 2 * F)
  const paneHeight = Math.max(0.01, height - 2 * F)
  const paneThickness = thickness * 0.55

  const [px, py, pz] = position

  const autoDivisions = Math.max(2, Math.round(paneFaceW / MULLION_SPACING))
  const sectionCount = Math.max(1, divisions ?? autoDivisions)
  const mullionCount = sectionCount - 1
  const mullionStep = paneFaceW / sectionCount
  const mullionOffsets = Array.from(
    { length: mullionCount },
    (_, i) => -paneFaceW / 2 + mullionStep * (i + 1),
  )

  return (
    <>
      {/* explicit collider — an invisible <mesh> would be skipped by auto-collider generation */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={position} />
      </RigidBody>

      {/* frame rails — opaque. Frame rails don't need to cast shadows (a
          top-down light through window frames wouldn't cast readable
          shadows against the walls they're mounted in); dropping cast
          keeps each glass panel out of the shadow pass except the pane
          itself, which is receive-only. */}
      <group position={[px, py, pz]}>
        {/* top */}
        <mesh
          receiveShadow
          position={orient(isXFace, 0, height / 2 - F / 2, 0)}
          material={WALL_MATERIAL}
        >
          <boxGeometry args={orientSize(isXFace, faceW, F, thickness)} />
        </mesh>
        {/* bottom */}
        <mesh
          receiveShadow
          position={orient(isXFace, 0, -height / 2 + F / 2, 0)}
          material={WALL_MATERIAL}
        >
          <boxGeometry args={orientSize(isXFace, faceW, F, thickness)} />
        </mesh>
        {/* left */}
        <mesh
          receiveShadow
          position={orient(isXFace, -faceW / 2 + F / 2, 0, 0)}
          material={WALL_MATERIAL}
        >
          <boxGeometry args={orientSize(isXFace, F, paneHeight, thickness)} />
        </mesh>
        {/* right */}
        <mesh
          receiveShadow
          position={orient(isXFace, faceW / 2 - F / 2, 0, 0)}
          material={WALL_MATERIAL}
        >
          <boxGeometry args={orientSize(isXFace, F, paneHeight, thickness)} />
        </mesh>

        {/* vertical mullions (dividers) — thin, opaque */}
        {mullionOffsets.map((offset, i) => (
          <mesh
            key={`mullion-${i}`}
            receiveShadow
            position={orient(isXFace, offset, 0, 0)}
            material={WALL_MATERIAL}
          >
            <boxGeometry
              args={orientSize(isXFace, MULLION_THICKNESS, paneHeight, paneThickness * 1.02)}
            />
          </mesh>
        ))}

        {/* Glass pane — shared physical material with transmission.
            Same shader as the original per-pane implementation, but
            one instance across every storefront so material state
            batches instead of compiling a distinct pipeline per pane. */}
        <mesh material={GLASS_MATERIAL}>
          <boxGeometry args={orientSize(isXFace, paneFaceW, paneHeight, paneThickness)} />
        </mesh>
      </group>
    </>
  )
}
