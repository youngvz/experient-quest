import { RigidBody } from '@react-three/rapier'
import { DoubleSide } from 'three'
import {
  COLORS,
  NE_ALCOVE,
  ROOM_WIDTH,
  TV,
  WALL_THICKNESS,
} from '../constants/gameConstants'

// A wall-mounted TV. `wallAxis` says which world axis the wall runs along:
//   'x' → wall is a Z-facing wall (front/back/alcove-north). Width runs along X.
//   'z' → wall is an X-facing wall (east/west). Width runs along Z.
// `wallCoord` is the wall's midplane coordinate on the fixed axis.
// `facing` = +1 or -1 (which side of the wall the screen sits on).
export function TVPanel({
  wallAxis,
  wallCoord,
  facing,
  centerAlong,
  centerY,
  width,
  height,
  depth,
}: {
  wallAxis: 'x' | 'z'
  wallCoord: number
  facing: 1 | -1
  centerAlong: number
  centerY: number
  width: number
  height: number
  depth: number
}) {
  const isXWall = wallAxis === 'x'
  const surfaceCoord = wallCoord + facing * (WALL_THICKNESS / 2 + depth / 2)
  const position: [number, number, number] = isXWall
    ? [centerAlong, centerY, surfaceCoord]
    : [surfaceCoord, centerY, centerAlong]
  // Local box has width along X and its screen normal along +Z. Rotate so
  // local +Z points along the world `facing` direction, so the screen faces
  // out of the wall toward viewers.
  const rotationY = isXWall
    ? facing === 1
      ? 0
      : Math.PI
    : facing === 1
      ? Math.PI / 2
      : -Math.PI / 2

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position} rotation={[0, rotationY, 0]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={COLORS.tvBezel} />
        </mesh>
        <mesh position={[0, 0, depth / 2 + 0.005]}>
          <planeGeometry args={[width - 0.2, height - 0.2]} />
          <meshStandardMaterial
            color="#2b6cb0"
            emissive="#3fa4ff"
            emissiveIntensity={1.2}
            roughness={0.3}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}

export function Television() {
  const eastWallX = ROOM_WIDTH / 2
  // Alcove upper office's north wall is the conference-room front wall east
  // segment at Z = ROOM_DEPTH/2 (world Z=+7). The TV mounts on its south face,
  // facing into the alcove (+Z).
  const alcoveNorthWallZ = NE_ALCOVE.upper.northZ
  const alcoveWidth = NE_ALCOVE.eastX - NE_ALCOVE.westX
  const alcoveCenterX = (NE_ALCOVE.westX + NE_ALCOVE.eastX) / 2

  return (
    <>
      {/* main conference-room TV on the east wall */}
      <TVPanel
        wallAxis="z"
        wallCoord={eastWallX}
        facing={-1}
        centerAlong={TV.centerZ}
        centerY={TV.centerY}
        width={TV.width}
        height={TV.height}
        depth={TV.depth}
      />
      {/* small TV on the north alcove's north wall — raised above the desk */}
      <TVPanel
        wallAxis="x"
        wallCoord={alcoveNorthWallZ}
        facing={1}
        centerAlong={alcoveCenterX}
        centerY={2}
        width={Math.min(3, alcoveWidth - 1)}
        height={1.4}
        depth={0.12}
      />
    </>
  )
}
