import { RigidBody } from '@react-three/rapier'
import {
  ALCOVE_WHITEBOARDS,
  COLORS,
  ROOM_DEPTH,
  WALL_THICKNESS,
  WHITEBOARD,
} from '../constants/gameConstants'

const DEFAULT_DEPTH = 0.08

// A wall-mounted whiteboard. `facing` picks which side of the wall the board
// mounts on: +1 = facing +Z, -1 = facing -Z. `wallZ` is the wall's midplane;
// the board sits flush against the interior surface.
export function WhiteboardPanel({
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

// Conference-room whiteboard (back wall, facing into the room) + one per alcove
// mounted on the alcove's interior north wall (facing south, into the office).
export function Whiteboard() {
  const backWallZ = -ROOM_DEPTH / 2

  return (
    <>
      <WhiteboardPanel
        centerX={WHITEBOARD.centerX}
        centerY={WHITEBOARD.centerY}
        width={WHITEBOARD.width}
        height={WHITEBOARD.height}
        wallZ={backWallZ}
        facing={1}
        depth={WHITEBOARD.depth}
      />
      {ALCOVE_WHITEBOARDS.map((wb, i) => (
        <WhiteboardPanel
          key={`alcove-wb-${i}`}
          centerX={wb.centerX}
          centerY={wb.centerY}
          width={wb.width}
          height={wb.height}
          wallZ={wb.northZ}
          facing={1}
        />
      ))}
    </>
  )
}
