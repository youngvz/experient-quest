import {
  DOOR,
  ROOM_DEPTH,
  ROOM_WIDTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { DoorHeader, WallPanel } from './wallPrimitives'

// The conference room's four perimeter walls and its front-doorway lintel.
// Every other room now owns its own walls in its own scene file; this one
// stays authored here because the doorway math is entangled with the front
// wall segments.
export function ConferenceRoom() {
  const y = WALL_HEIGHT / 2
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2

  const doorLeft = DOOR.centerX - DOOR.width / 2
  const doorRight = DOOR.centerX + DOOR.width / 2
  const frontLeftWidth = doorLeft - -halfW
  const frontRightWidth = halfW - doorRight
  const frontLeftCenterX = (-halfW + doorLeft) / 2
  const frontRightCenterX = (doorRight + halfW) / 2

  return (
    <>
      {/* back wall — glass, 3 sections */}
      <WallPanel
        position={[0, y, -halfD]}
        size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]}
        glass
        divisions={3}
      />
      {/* front wall — glass west of the doorway, opaque east of it (shared
          with the NE alcove's north wall) */}
      <WallPanel
        position={[frontLeftCenterX, y, halfD]}
        size={[frontLeftWidth, WALL_HEIGHT, WALL_THICKNESS]}
        glass
      />
      <WallPanel
        position={[frontRightCenterX, y, halfD]}
        size={[frontRightWidth, WALL_HEIGHT, WALL_THICKNESS]}
      />
      {/* west wall — glass */}
      <WallPanel
        position={[-halfW, y, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]}
        glass
      />
      {/* east wall — opaque so the TV reads clearly */}
      <WallPanel
        position={[halfW, y, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]}
      />
      {/* header lintel over the front doorway */}
      <DoorHeader position={[DOOR.centerX, halfD]} width={DOOR.width} spansX />
    </>
  )
}
