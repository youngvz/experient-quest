import { RigidBody } from '@react-three/rapier'
import { COLORS, CONFERENCE_TABLE } from '../constants/gameConstants'

export function ConferenceTable() {
  const [cx, cy, cz] = CONFERENCE_TABLE.center
  const [w, h, d] = CONFERENCE_TABLE.size
  const legInset = 0.4
  const legThickness = 0.1
  const legHeight = h - 0.05
  const legs: [number, number][] = [
    [-w / 2 + legInset, -d / 2 + legInset],
    [w / 2 - legInset, -d / 2 + legInset],
    [-w / 2 + legInset, d / 2 - legInset],
    [w / 2 - legInset, d / 2 - legInset],
  ]

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[cx, cy, cz]}>
        <mesh castShadow receiveShadow position={[0, h - 0.025, 0]}>
          <boxGeometry args={[w, 0.05, d]} />
          <meshStandardMaterial color={COLORS.tableTop} roughness={0.55} metalness={0.05} />
        </mesh>
        {legs.map(([lx, lz], i) => (
          <mesh key={i} castShadow position={[lx, legHeight / 2, lz]}>
            <boxGeometry args={[legThickness, legHeight, legThickness]} />
            <meshStandardMaterial color={COLORS.tableLegs} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}
