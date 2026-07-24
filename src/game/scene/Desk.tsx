import { RigidBody } from '@react-three/rapier'
import { COLORS, DESK } from '../constants/gameConstants'

export function Desk() {
  const [cx, cy, cz] = DESK.center
  const [w, h, d] = DESK.size
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[cx, cy, cz]}>
        <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={COLORS.desk} />
        </mesh>
        <mesh position={[0, h + 0.005, 0]}>
          <boxGeometry args={[w - 0.05, 0.02, d - 0.05]} />
          <meshStandardMaterial color={COLORS.deskTop} />
        </mesh>
      </group>
    </RigidBody>
  )
}
