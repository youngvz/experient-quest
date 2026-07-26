import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { COLORS, SOUTH_APRON, WALL_HEIGHT } from '../constants/gameConstants'

type Patch = { westX: number; eastX: number; northZ: number; southZ: number }

// Grass slabs are the walkable floor for the whole apron — they carry the
// collider. Sidewalks are decorative overlays a hair above (top of grass =
// y=0, overlay at y=0.01) so they read as painted surface without
// z-fighting or duplicate physics.
const GRASS_Y = -0.05
const OVERLAY_Y = 0.01

function GrassSlab({ patch }: { patch: Patch }) {
  const width = patch.eastX - patch.westX
  const depth = patch.southZ - patch.northZ
  const centerX = (patch.westX + patch.eastX) / 2
  const centerZ = (patch.northZ + patch.southZ) / 2
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[centerX, GRASS_Y, centerZ]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={COLORS.grass} />
      </mesh>
    </RigidBody>
  )
}

function SidewalkSlab({ patch }: { patch: Patch }) {
  const width = patch.eastX - patch.westX
  const depth = patch.southZ - patch.northZ
  const centerX = (patch.westX + patch.eastX) / 2
  const centerZ = (patch.northZ + patch.southZ) / 2
  return (
    <mesh receiveShadow position={[centerX, OVERLAY_Y, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={COLORS.sidewalk} />
    </mesh>
  )
}

// Invisible perimeter walls that bound the outdoor L-shape to the authored
// grass footprint. The building's own opaque south walls already block the
// north edge (Z=+18 for TheCommons, Z=+20 for corridor/bakery), so we only
// need east/south/west and the small "step" between the L-pocket and the
// building's south face east of X=-13.
//
// L-shape footprint mirror of SOUTH_APRON.grass:
//   Main strip: X ∈ [-13, +10], Z ∈ [+20, +32]
//   L-pocket:   X ∈ [-19, -13], Z ∈ [+18, +32]
const APRON_WALL_THICKNESS = 0.4
const HALF_H = WALL_HEIGHT / 2
const HALF_T = APRON_WALL_THICKNESS / 2

function ApronBounds() {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* East wall — X=+10, spans main strip's Z ∈ [+20, +32] */}
      <CuboidCollider args={[HALF_T, HALF_H, 6]} position={[10 + HALF_T, HALF_H, 26]} />
      {/* South wall — Z=+32, spans full L width X ∈ [-19, +10] */}
      <CuboidCollider args={[14.5, HALF_H, HALF_T]} position={[-4.5, HALF_H, 32 + HALF_T]} />
      {/* West wall — X=-19, spans pocket + main Z ∈ [+18, +32] */}
      <CuboidCollider args={[HALF_T, HALF_H, 7]} position={[-19 - HALF_T, HALF_H, 25]} />
      {/* Step between L-pocket and main strip. The pocket extends
          Z ∈ [+18, +20] at X ∈ [-19, -13]; east of X=-13 in that Z-band
          is the building's south wall (already collided). Nothing extra
          needed here — TheCommons south wall at Z=+18 blocks the north
          edge of the pocket, and the corridor's SW corner opaque panel
          + door blocker cover the rest. */}
    </RigidBody>
  )
}

export function SouthApron() {
  return (
    <group>
      {SOUTH_APRON.grass.map((p, i) => (
        <GrassSlab key={`grass-${i}`} patch={p} />
      ))}
      {SOUTH_APRON.sidewalk.map((p, i) => (
        <SidewalkSlab key={`sidewalk-${i}`} patch={p} />
      ))}
      <ApronBounds />
    </group>
  )
}
