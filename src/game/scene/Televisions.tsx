import {
  ROOM_WIDTH,
  THE_BAKERY_NE_ALCOVE,
  TV,
} from '../constants/gameConstants'
import { Television } from './Television'

// All TVs in the world: the main conference-room TV on the east wall and
// a smaller one on the upper NE alcove's north wall.
export function Televisions() {
  const eastWallX = ROOM_WIDTH / 2
  // Alcove upper office's north wall is the conference-room front wall
  // east segment at Z = ROOM_DEPTH/2 (world Z=+7). The TV mounts on its
  // south face, facing into the alcove (+Z).
  const alcoveNorthWallZ = THE_BAKERY_NE_ALCOVE.upper.northZ
  const alcoveWidth =
    THE_BAKERY_NE_ALCOVE.eastX - THE_BAKERY_NE_ALCOVE.westX
  const alcoveCenterX =
    (THE_BAKERY_NE_ALCOVE.westX + THE_BAKERY_NE_ALCOVE.eastX) / 2

  return (
    <>
      {/* main conference-room TV on the east wall */}
      <Television
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
      <Television
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
