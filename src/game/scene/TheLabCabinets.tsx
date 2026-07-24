import { THE_LAB_CABINETS } from '../constants/gameConstants'
import { CabinetRow } from './CabinetRow'

// Row of white base cabinets along the outside (west) face of Alcove A's
// wall inside TheLab. Same kitchen visual as The Bakery's row.
export function TheLabCabinets() {
  return <CabinetRow config={THE_LAB_CABINETS} />
}
