import { RigidBody } from '@react-three/rapier'
import { COLORS, WALL_THICKNESS } from '../constants/gameConstants'

const DEFAULT_DEPTH = 0.08

// A single wall-mounted whiteboard. `facing` picks which side of the wall
// the board mounts on: +1 = facing +Z, -1 = facing -Z. `wallZ` is the
// wall's midplane; the board sits flush against the interior surface.
export function Whiteboard({
  centerX,
  centerY,
  width,
  height,
  wallZ,
  facing,
  depth = DEFAULT_DEPTH,
}: {
  centerX: number
  centerY: number
  width: number
  height: number
  wallZ: number
  facing: 1 | -1
  depth?: number
}) {
  const surfaceZ = wallZ + facing * (WALL_THICKNESS / 2 + depth / 2)
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[centerX, centerY, surfaceZ]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={COLORS.whiteboardFrame} />
        </mesh>
        <mesh position={[0, 0, facing * (depth / 2 + 0.005)]}>
          <planeGeometry args={[width - 0.15, height - 0.15]} />
          <meshStandardMaterial
            color={COLORS.whiteboardSurface}
            side={facing === 1 ? undefined : 1 /* THREE.BackSide */}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
