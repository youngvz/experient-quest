import {
  ROOM_DEPTH,
  THE_BAKERY_ALCOVE_WHITEBOARDS,
  WHITEBOARD,
} from '../constants/gameConstants'
import { Whiteboard } from './Whiteboard'

// All whiteboards in the world: the conference-room whiteboard on the back
// wall (facing into the room) plus one per NE alcove on the alcove's
// interior north wall (facing south, into the office).
export function Whiteboards() {
  const backWallZ = -ROOM_DEPTH / 2

  return (
    <>
      <Whiteboard
        centerX={WHITEBOARD.centerX}
        centerY={WHITEBOARD.centerY}
        width={WHITEBOARD.width}
        height={WHITEBOARD.height}
        wallZ={backWallZ}
        facing={1}
        depth={WHITEBOARD.depth}
      />
      {THE_BAKERY_ALCOVE_WHITEBOARDS.map((wb, i) => (
        <Whiteboard
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
