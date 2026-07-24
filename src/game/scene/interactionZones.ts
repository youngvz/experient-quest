import { INTERACTION_ZONE } from '../constants/gameConstants'
import type { RectLike } from '../interactions/InteractionManager'

// The InteractionManager rect is 2D (top-left origin). We treat the world XZ
// plane as its 2D space: X → x, Z → y.
export function getEventsTvZoneRect(): RectLike {
  const [cx, , cz] = INTERACTION_ZONE.center
  const [w, d] = INTERACTION_ZONE.size
  return {
    x: cx - w / 2,
    y: cz - d / 2,
    width: w,
    height: d,
  }
}
