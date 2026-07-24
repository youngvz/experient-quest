import { RigidBody } from '@react-three/rapier'
import { COLORS, ROOM_DEPTH, ROOM_WIDTH } from '../constants/gameConstants'

export function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[ROOM_WIDTH, 0.1, ROOM_DEPTH]} />
        <meshStandardMaterial color={COLORS.floor} />
      </mesh>
    </RigidBody>
  )
}
