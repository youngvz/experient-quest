import { RigidBody } from '@react-three/rapier'
import { COLORS, ROOM_WIDTH, TV, WALL_THICKNESS } from '../constants/gameConstants'

// Mounted on the east wall (X = +ROOM_WIDTH/2), facing -X (into the room).
// The TV's local width axis runs along Z, so we rotate 90° about Y.
export function Television() {
  const eastWallX = ROOM_WIDTH / 2
  const surfaceX = eastWallX - WALL_THICKNESS / 2 - TV.depth / 2

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[surfaceX, TV.centerY, TV.centerZ]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[TV.width, TV.height, TV.depth]} />
          <meshStandardMaterial color={COLORS.tvBezel} />
        </mesh>
        <mesh position={[0, 0, TV.depth / 2 + 0.005]}>
          <planeGeometry args={[TV.width - 0.2, TV.height - 0.2]} />
          <meshStandardMaterial
            color={COLORS.tvScreen}
            emissive={COLORS.tvScreen}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
