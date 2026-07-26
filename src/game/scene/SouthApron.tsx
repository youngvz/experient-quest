import { RigidBody } from '@react-three/rapier'
import { COLORS, SOUTH_APRON } from '../constants/gameConstants'

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

export function SouthApron() {
  return (
    <group>
      {SOUTH_APRON.grass.map((p, i) => (
        <GrassSlab key={`grass-${i}`} patch={p} />
      ))}
      {SOUTH_APRON.sidewalk.map((p, i) => (
        <SidewalkSlab key={`sidewalk-${i}`} patch={p} />
      ))}
    </group>
  )
}
