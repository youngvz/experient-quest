import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  ROOM_DEPTH,
  WALL_THICKNESS,
  WHITEBOARD,
} from '../constants/gameConstants'

// Mounted flush against the back wall (Z = -ROOM_DEPTH/2), facing +Z (into the room).
export function Whiteboard() {
  const backWallZ = -ROOM_DEPTH / 2
  const surfaceZ = backWallZ + WALL_THICKNESS / 2 + WHITEBOARD.depth / 2

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[WHITEBOARD.centerX, WHITEBOARD.centerY, surfaceZ]}>
        <mesh castShadow>
          <boxGeometry args={[WHITEBOARD.width, WHITEBOARD.height, WHITEBOARD.depth]} />
          <meshStandardMaterial color={COLORS.whiteboardFrame} />
        </mesh>
        <mesh position={[0, 0, WHITEBOARD.depth / 2 + 0.005]}>
          <planeGeometry args={[WHITEBOARD.width - 0.15, WHITEBOARD.height - 0.15]} />
          <meshStandardMaterial color={COLORS.whiteboardSurface} />
        </mesh>
      </group>
    </RigidBody>
  )
}
