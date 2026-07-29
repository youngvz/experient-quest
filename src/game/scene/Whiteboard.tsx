import { RigidBody } from '@react-three/rapier'
import { COLORS, WALL_THICKNESS } from '../constants/gameConstants'

const DEFAULT_DEPTH = 0.08

// A single wall-mounted whiteboard. Two mounting modes:
//   - X-running wall (Z-facing): pass `wallZ`. Board width runs along X.
//     `facing` picks +Z or -Z. (Original default.)
//   - Z-running wall (X-facing): pass `wallX` and `centerZ` instead of
//     `centerX` + `wallZ`. Board width runs along Z. `facing` picks +X
//     or -X.
export function Whiteboard(
  props:
    | {
        centerX: number
        centerY: number
        width: number
        height: number
        wallZ: number
        facing: 1 | -1
        depth?: number
      }
    | {
        centerZ: number
        centerY: number
        width: number
        height: number
        wallX: number
        facing: 1 | -1
        depth?: number
      },
) {
  const depth = props.depth ?? DEFAULT_DEPTH
  const isXWall = 'wallZ' in props
  const centerY = props.centerY
  const width = props.width
  const height = props.height
  const facing = props.facing

  let position: [number, number, number]
  let rotationY: number
  if (isXWall) {
    const surfaceZ = props.wallZ + facing * (WALL_THICKNESS / 2 + depth / 2)
    position = [props.centerX, centerY, surfaceZ]
    rotationY = facing === 1 ? 0 : Math.PI
  } else {
    const surfaceX = props.wallX + facing * (WALL_THICKNESS / 2 + depth / 2)
    position = [surfaceX, centerY, props.centerZ]
    rotationY = facing === 1 ? Math.PI / 2 : -Math.PI / 2
  }

  // In local space (before rotation), width runs along X, height along Y,
  // depth (normal) along +Z. Rotation aligns local +Z with world `facing`.
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position} rotation={[0, rotationY, 0]}>
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={COLORS.whiteboardFrame} />
        </mesh>
        <mesh position={[0, 0, depth / 2 + 0.005]}>
          <planeGeometry args={[width - 0.15, height - 0.15]} />
          <meshStandardMaterial color={COLORS.whiteboardSurface} />
        </mesh>
      </group>
    </RigidBody>
  )
}
