import { useEffect, useRef } from 'react'

export interface KeyboardState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  running: boolean
  interactPressed: boolean
  interactConsumed: boolean
  jumpPressed: boolean
  clapPressed: boolean
  sitTogglePressed: boolean
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp'])
const BACK_KEYS = new Set(['KeyS', 'ArrowDown'])
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft'])
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight'])
const INTERACT_KEYS = new Set(['KeyE'])
const RUN_TOGGLE_KEYS = new Set(['KeyR'])
const JUMP_KEYS = new Set(['Space'])
const CLAP_KEYS = new Set(['KeyC'])
const SIT_KEYS = new Set(['KeyX'])

// Mutable state ref updated by DOM listeners; useFrame reads it every frame.
// interactPressed is edge-triggered — consumer calls `consumeInteract()` to clear the pulse.
export function useKeyboard(): {
  state: React.MutableRefObject<KeyboardState>
  consumeInteract: () => boolean
  consumeJump: () => boolean
  consumeClap: () => boolean
  consumeSitToggle: () => boolean
} {
  const state = useRef<KeyboardState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    running: false,
    interactPressed: false,
    interactConsumed: false,
    jumpPressed: false,
    clapPressed: false,
    sitTogglePressed: false,
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
      else if (JUMP_KEYS.has(event.code)) {
        s.jumpPressed = true
        // Space would otherwise scroll the page.
        event.preventDefault()
      }
      else if (CLAP_KEYS.has(event.code)) s.clapPressed = true
      else if (SIT_KEYS.has(event.code)) s.sitTogglePressed = true
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
    }
    const onBlur = () => {
      const s = state.current
      s.forward = s.back = s.left = s.right = false
      s.interactPressed = false
      s.interactConsumed = false
      s.jumpPressed = false
      s.clapPressed = false
      s.sitTogglePressed = false
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

  const consumeJump = () => {
    const s = state.current
    if (!s.jumpPressed) return false
    s.jumpPressed = false
    return true
  }

  const consumeClap = () => {
    const s = state.current
    if (!s.clapPressed) return false
    s.clapPressed = false
    return true
  }

  const consumeSitToggle = () => {
    const s = state.current
    if (!s.sitTogglePressed) return false
    s.sitTogglePressed = false
    return true
  }

  return { state, consumeInteract, consumeJump, consumeClap, consumeSitToggle }
}
