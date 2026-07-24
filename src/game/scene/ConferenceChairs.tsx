import { CHAIR, CONFERENCE_TABLE } from '../constants/gameConstants'
import { Chair } from './Chair'

// The 10 chairs arranged around the conference table.
export function ConferenceChairs() {
  const tableCenterY = CONFERENCE_TABLE.center[1]
  const tableHalfW = CONFERENCE_TABLE.size[0] / 2
  const tableHalfD = CONFERENCE_TABLE.size[2] / 2

  return (
    <>
      {CHAIR.positions.map(([x, z], i) => {
        const dx = x < -tableHalfW ? 1 : x > tableHalfW ? -1 : 0
        const dz = z < -tableHalfD ? 1 : z > tableHalfD ? -1 : 0
        const facing = Math.atan2(dx, dz)
        return <Chair key={i} position={[x, tableCenterY, z]} rotationY={facing} />
      })}
    </>
  )
}
