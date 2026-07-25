import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  NORTH_EAST_CORRIDOR,
  NORTH_EAST_POCKET,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { Door } from './Door'
import { Sofa } from './Sofa'
import { DoorHeader, WallPanel } from './wallPrimitives'

// East-running corridor branching off the central corridor between TheLab
// and TheStation. Composed of a 6×7 pocket at the mouth (fills the full
// gap between the two rooms) that narrows to a 3 m corridor flush with
// TheStation's south wall, running east to a sealed dead-end door.
//
// Coplanar walls (NOT re-rendered here):
//  - Pocket + corridor north wall (Z=-39) — TheStation.tsx owns it.
//  - Pocket south wall (Z=-32) — TheLab.tsx owns it.
//  - Pocket west wall (X=-10) — CentralCorridor.tsx carves a cutout there
//    via its `gaps` array.
export function NorthEastCorridor() {
  const y = WALL_HEIGHT / 2

  const pocketCenterX = (NORTH_EAST_POCKET.westX + NORTH_EAST_POCKET.eastX) / 2
  const pocketCenterZ = (NORTH_EAST_POCKET.northZ + NORTH_EAST_POCKET.southZ) / 2
  const pocketWidth = NORTH_EAST_POCKET.eastX - NORTH_EAST_POCKET.westX
  const pocketDepth = NORTH_EAST_POCKET.southZ - NORTH_EAST_POCKET.northZ

  const corridorCenterX = (NORTH_EAST_CORRIDOR.westX + NORTH_EAST_CORRIDOR.eastX) / 2
  const corridorCenterZ = (NORTH_EAST_CORRIDOR.northZ + NORTH_EAST_CORRIDOR.southZ) / 2
  const corridorLength = NORTH_EAST_CORRIDOR.eastX - NORTH_EAST_CORRIDOR.westX
  const corridorDepth = NORTH_EAST_CORRIDOR.southZ - NORTH_EAST_CORRIDOR.northZ

  const { eastX, northZ, southZ, eastDoorZ, eastDoorWidth } = NORTH_EAST_CORRIDOR
  const doorLo = eastDoorZ - eastDoorWidth / 2
  const doorHi = eastDoorZ + eastDoorWidth / 2

  return (
    <>
      {/* pocket floor slab (6×7) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[pocketCenterX, -0.05, pocketCenterZ]}>
          <boxGeometry args={[pocketWidth, 0.1, pocketDepth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* narrow corridor floor slab (24×3) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[corridorCenterX, -0.05, corridorCenterZ]}>
          <boxGeometry args={[corridorLength, 0.1, corridorDepth]} />
          <meshStandardMaterial color={COLORS.floor} />
        </mesh>
      </RigidBody>

      {/* narrow corridor south wall (opaque). North wall is coplanar with
          TheStation's south wall and rendered by TheStation.tsx. */}
      <WallPanel
        position={[corridorCenterX, y, southZ]}
        size={[corridorLength, WALL_HEIGHT, WALL_THICKNESS]}
      />

      {/* step wall at X=westX between the narrow corridor's south edge
          (Z=-36) and the pocket's south edge (Z=-32). Seals the strip
          south of the corridor mouth so the pocket's extra depth doesn't
          leak into the narrow section. No step is needed on the north
          side — the corridor and pocket share Z=-39. */}
      <WallPanel
        position={[
          NORTH_EAST_CORRIDOR.westX,
          y,
          (southZ + NORTH_EAST_POCKET.southZ) / 2,
        ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, NORTH_EAST_POCKET.southZ - southZ]}
      />

      {/* east wall — split around the dead-end doorway */}
      <WallPanel
        position={[eastX, y, (northZ + doorLo) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, doorLo - northZ]}
      />
      <WallPanel
        position={[eastX, y, (doorHi + southZ) / 2]}
        size={[WALL_THICKNESS, WALL_HEIGHT, southZ - doorHi]}
      />
      <DoorHeader position={[eastX, eastDoorZ]} width={eastDoorWidth} spansX={false} />

      {/* visible-open, passable glass door at the east end. */}
      <Door
        position={[eastX, eastDoorZ]}
        width={eastDoorWidth}
        spansX={false}
        blocking={false}
        open
      />

      {/* Two 3-seat sofas forming an L in the pocket's SE corner. One
          backs against the south wall (Z=-32, TheLab-owned) facing north;
          the other backs against the east step wall (X=-4, Z ∈ [-36, -32])
          facing west. Sofa depth = 0.9, wall thickness = 0.4, so
          wall-inner-face + 0.45 seats the backrest against the wall. */}
      <Sofa
        position={[pocketCenterX, NORTH_EAST_POCKET.southZ - WALL_THICKNESS / 2 - 0.45]}
        rotationY={Math.PI}
        seatCount={3}
      />
      <Sofa
        position={[
          NORTH_EAST_CORRIDOR.westX - WALL_THICKNESS / 2 - 0.45,
          (NORTH_EAST_CORRIDOR.southZ + NORTH_EAST_POCKET.southZ) / 2,
        ]}
        rotationY={-Math.PI / 2}
        seatCount={3}
      />
    </>
  )
}
