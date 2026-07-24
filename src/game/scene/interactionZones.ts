import type { PresentationStop } from '../interactions/interactionTypes'
import type { RectLike } from '../interactions/InteractionManager'

// The InteractionManager rect is 2D (top-left origin). We treat the world XZ
// plane as its 2D space: X → x, Z → y.
export function getStopZoneRect(stop: PresentationStop): RectLike {
  const [cx, , cz] = stop.position
  const [w, d] = stop.interactionZone.size
  return {
    x: cx - w / 2,
    y: cz - d / 2,
    width: w,
    height: d,
  }
}
