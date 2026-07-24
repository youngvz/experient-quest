import { useEffect, useRef } from 'react'

export interface KeyboardState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  running: boolean
  interactPressed: boolean
  interactConsumed: boolean
  rollPressed: boolean
  wavePressed: boolean
  yawLeft: boolean
  yawRight: boolean
  zoomIn: boolean
  zoomOut: boolean
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp'])
const BACK_KEYS = new Set(['KeyS', 'ArrowDown'])
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft'])
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight'])
const INTERACT_KEYS = new Set(['KeyF'])
const RUN_TOGGLE_KEYS = new Set(['KeyR'])
const ROLL_KEYS = new Set(['Space'])
const WAVE_KEYS = new Set(['KeyC'])
const YAW_LEFT_KEYS = new Set(['KeyQ'])
const YAW_RIGHT_KEYS = new Set(['KeyE'])
// "+" is Shift+Equal on US layouts; also accept the numpad "+". "-" covers
// both the main-row minus and the numpad minus.
const ZOOM_IN_KEYS = new Set(['Equal', 'NumpadAdd'])
const ZOOM_OUT_KEYS = new Set(['Minus', 'NumpadSubtract'])

// Mutable state ref updated by DOM listeners; useFrame reads it every frame.
// interactPressed is edge-triggered — consumer calls `consumeInteract()` to clear the pulse.
export function useKeyboard(): {
  state: React.MutableRefObject<KeyboardState>
  consumeInteract: () => boolean
  consumeRoll: () => boolean
  consumeWave: () => boolean
} {
  const state = useRef<KeyboardState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    running: false,
    interactPressed: false,
    interactConsumed: false,
    rollPressed: false,
    wavePressed: false,
    yawLeft: false,
    yawRight: false,
    zoomIn: false,
    zoomOut: false,
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      const s = state.current
      if (FORWARD_KEYS.has(event.code)) s.forward = true
      else if (BACK_KEYS.has(event.code)) s.back = true
      else if (LEFT_KEYS.has(event.code)) s.left = true
      else if (RIGHT_KEYS.has(event.code)) s.right = true
      else if (INTERACT_KEYS.has(event.code)) {
        if (!s.interactConsumed) s.interactPressed = true
      }
      else if (RUN_TOGGLE_KEYS.has(event.code)) s.running = !s.running
      else if (ROLL_KEYS.has(event.code)) {
        s.rollPressed = true
        // Space would otherwise scroll the page.
        event.preventDefault()
      }
      else if (WAVE_KEYS.has(event.code)) s.wavePressed = true
      else if (YAW_LEFT_KEYS.has(event.code)) s.yawLeft = true
      else if (YAW_RIGHT_KEYS.has(event.code)) s.yawRight = true
      else if (ZOOM_IN_KEYS.has(event.code)) s.zoomIn = true
      else if (ZOOM_OUT_KEYS.has(event.code)) s.zoomOut = true
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const s = state.current
      if (FORWARD_KEYS.has(event.code)) s.forward = false
      else if (BACK_KEYS.has(event.code)) s.back = false
      else if (LEFT_KEYS.has(event.code)) s.left = false
      else if (RIGHT_KEYS.has(event.code)) s.right = false
      else if (INTERACT_KEYS.has(event.code)) {
        s.interactConsumed = false
        s.interactPressed = false
      }
      else if (YAW_LEFT_KEYS.has(event.code)) s.yawLeft = false
      else if (YAW_RIGHT_KEYS.has(event.code)) s.yawRight = false
      else if (ZOOM_IN_KEYS.has(event.code)) s.zoomIn = false
      else if (ZOOM_OUT_KEYS.has(event.code)) s.zoomOut = false
    }
    const onBlur = () => {
      const s = state.current
      s.forward = s.back = s.left = s.right = false
      s.interactPressed = false
      s.interactConsumed = false
      s.rollPressed = false
      s.wavePressed = false
      s.yawLeft = false
      s.yawRight = false
      s.zoomIn = false
      s.zoomOut = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const consumeInteract = () => {
    const s = state.current
    if (!s.interactPressed) return false
    s.interactPressed = false
    s.interactConsumed = true
    return true
  }

  const consumeRoll = () => {
    const s = state.current
    if (!s.rollPressed) return false
    s.rollPressed = false
    return true
  }

  const consumeWave = () => {
    const s = state.current
    if (!s.wavePressed) return false
    s.wavePressed = false
    return true
  }

  return { state, consumeInteract, consumeRoll, consumeWave }
}
