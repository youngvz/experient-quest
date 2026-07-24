import { THE_BAKERY_EAST_CABINETS } from '../constants/gameConstants'
import { CabinetRow } from './CabinetRow'

// Row of white base cabinets along the east wall of The Bakery, in the
// stretch south of the NE alcoves. The northmost cabinet holds a sink.
// All geometry lives in <CabinetRow>; this file just picks a config.
export function TheBakeryCabinets() {
  return <CabinetRow config={THE_BAKERY_EAST_CABINETS} />
}
