import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { DOOR_HEIGHT } from '../constants/gameConstants'

interface DoorProps {
  // Doorway center in world XZ — same signature as DoorHeader / DoorBlocker.
  position: [number, number]
  width: number
  // True if the wall segment spans X (door faces N/S), false if spans Z.
  spansX: boolean
  // If true, adds a static collider so the player can't walk through.
  // Defaults to true — a glass door is still a door. Ignored when `open`
  // is true (an open door doesn't seal the doorway).
  blocking?: boolean
  // If true, the slab pivots 90° around its hinge — reads as a door left
  // standing open. Skips the collider so the player can walk through.
  open?: boolean
  // Which edge of the doorway the door hinges on. `low` = -width/2 side
  // (west for spansX doors, north for spansZ). `high` = +width/2 side.
  // Defaults to `low`.
  hingeSide?: 'low' | 'high'
  // Which way an open door swings, relative to the wall's normal.
  // `inward` swings toward +normal (+Z for spansX, +X for spansZ);
  // `outward` swings toward -normal. Defaults to `inward`.
  openDirection?: 'inward' | 'outward'
}

// Slim glass slab (~6 cm thick) so the pane reads as a door rather than a
// window mullion — reduce if you want it even more restaurant-y.
const DOOR_THICKNESS = 0.06

// A visible glass door with a vertical metal pull handle. Fills the
// bottom of a doorway opening (up to DOOR_HEIGHT); the surrounding wall
// segments and DoorHeader still render the rest of the opening. Distinct
// from <DoorBlocker>, which is an invisible full-height collider used on
// locked/exterior openings that shouldn't visibly exist.
//
// Set `open` to render the same slab + handle rotated 90° around its
// hinge — same geometry, different pose.
export function Door({
  position,
  width,
  spansX,
  blocking = true,
  open = false,
  hingeSide = 'low',
  openDirection = 'inward',
}: DoorProps) {
  const [px, pz] = position
  const centerY = DOOR_HEIGHT / 2

  const size: [number, number, number] = spansX
    ? [width, DOOR_HEIGHT, DOOR_THICKNESS]
    : [DOOR_THICKNESS, DOOR_HEIGHT, width]

  // Hinge sits at one edge of the slab; the slab extends toward the
  // opposite edge in the hinge-local frame. `sign` flips both the world
  // hinge position and the local slab/handle offsets so the free edge
  // stays on the far side of the doorway.
  const sign = hingeSide === 'low' ? 1 : -1
  const hingeWorld: [number, number, number] = spansX
    ? [px - (width / 2) * sign, 0, pz]
    : [px, 0, pz - (width / 2) * sign]

  const slabLocal: [number, number, number] = spansX
    ? [(width / 2) * sign, centerY, 0]
    : [0, centerY, (width / 2) * sign]

  // Handle: original design was 0.25 m in from the free edge, standing off
  // the +normal face at Y=1.1 world. Re-expressed in hinge-local coords.
  const handleRadius = 0.025
  const handleLength = 0.7
  const handleStandoff = DOOR_THICKNESS / 2 + 0.06
  const handleAlong = (width - 0.25) * sign
  const handleLocal: [number, number, number] = spansX
    ? [handleAlong, 1.1, handleStandoff]
    : [handleStandoff, 1.1, handleAlong]

  // Rotation angle: hinge sign sets which direction the free edge naturally
  // rotates when we spin by +π/2 (a `low` hinge rotates the slab toward
  // +normal, a `high` hinge toward -normal). `outward` inverts that.
  const swingSign = openDirection === 'inward' ? 1 : -1
  const rotationY = open ? (Math.PI / 2) * sign * swingSign : 0

  return (
    <>
      {blocking && !open ? (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[size[0] / 2, size[1] / 2, size[2] / 2]}
            position={[px, centerY, pz]}
          />
        </RigidBody>
      ) : null}

      <group position={hingeWorld} rotation={[0, rotationY, 0]}>
        <mesh position={slabLocal} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshPhysicalMaterial
            color="#eaf3f9"
            roughness={0.05}
            metalness={0}
            transmission={1}
            thickness={0.15}
            ior={1.05}
            attenuationColor="#cfe0ee"
            attenuationDistance={12}
            transparent
            opacity={0.55}
          />
        </mesh>

        <mesh position={handleLocal} castShadow>
          <cylinderGeometry
            args={[handleRadius, handleRadius, handleLength, 12]}
          />
          <meshStandardMaterial color="#b8bcc4" metalness={0.75} roughness={0.22} />
        </mesh>
      </group>
    </>
  )
}
