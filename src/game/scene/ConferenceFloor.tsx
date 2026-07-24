import { RigidBody } from '@react-three/rapier'
import { COLORS, ROOM_DEPTH, ROOM_WIDTH } from '../constants/gameConstants'

// The conference room's floor slab. Other rooms author their own slabs in
// their own scene files.
export function ConferenceFloor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[ROOM_WIDTH, 0.1, ROOM_DEPTH]} />
        <meshStandardMaterial color={COLORS.floor} />
      </mesh>
    </RigidBody>
  )
}
