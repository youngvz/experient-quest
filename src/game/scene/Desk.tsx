import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../constants/gameConstants'

// A workstation desk. Solid top on four legs. Physics collider so the player
// can't walk through it. Colors default to the shared hardwood palette.
export function Desk({
  position,
  size,
  topColor = COLORS.tableTop,
  legColor = COLORS.tableLegs,
}: {
  position: [number, number]
  size: [number, number, number]
  topColor?: string
  legColor?: string
}) {
  const [x, z] = position
  const [w, h, d] = size
  const topThickness = 0.05
  const legThickness = 0.08
  const legInset = 0.1
  const legHeight = h - topThickness

  const legXOffset = w / 2 - legInset - legThickness / 2
  const legZOffset = d / 2 - legInset - legThickness / 2

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[x, 0, z]}>
        <mesh castShadow receiveShadow position={[0, h - topThickness / 2, 0]}>
          <boxGeometry args={[w, topThickness, d]} />
          <meshStandardMaterial color={topColor} roughness={0.6} />
        </mesh>
        {[
          [-legXOffset, -legZOffset],
          [legXOffset, -legZOffset],
          [-legXOffset, legZOffset],
          [legXOffset, legZOffset],
        ].map(([lx, lz], i) => (
          <mesh key={i} castShadow position={[lx, legHeight / 2, lz]}>
            <boxGeometry args={[legThickness, legHeight, legThickness]} />
            <meshStandardMaterial color={legColor} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}
