// Touch input singleton. Writes come from <TouchControls>; reads come from
// Player.tsx's useFrame and the InteractionPrompt tap handler. A plain
// module-level object (no reactivity) keeps this off the React re-render
// path, mirroring InteractionManager and gameEvents.

interface TouchInputState {
  moveX: number
  moveZ: number
  yawDelta: number
  zoomFactor: number
  interactPressed: boolean
}

const state: TouchInputState = {
  moveX: 0,
  moveZ: 0,
  yawDelta: 0,
  zoomFactor: 1,
  interactPressed: false,
}

export const touchInput = {
  setMove(x: number, z: number): void {
    state.moveX = x
    state.moveZ = z
  },
  getMove(): { x: number; z: number } {
    return { x: state.moveX, z: state.moveZ }
  },
  addYawDelta(radians: number): void {
    state.yawDelta += radians
  },
  consumeYawDelta(): number {
    const d = state.yawDelta
    state.yawDelta = 0
    return d
  },
  addZoomFactor(multiplier: number): void {
    state.zoomFactor *= multiplier
  },
  consumeZoomFactor(): number {
    const f = state.zoomFactor
    state.zoomFactor = 1
    return f
  },
  emitInteract(): void {
    state.interactPressed = true
  },
  consumeInteract(): boolean {
    if (!state.interactPressed) return false
    state.interactPressed = false
    return true
  },
  reset(): void {
    state.moveX = 0
    state.moveZ = 0
    state.yawDelta = 0
    state.zoomFactor = 1
    state.interactPressed = false
  },
}
