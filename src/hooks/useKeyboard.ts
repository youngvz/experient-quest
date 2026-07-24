import { useEffect, useRef } from 'react'

export interface KeyboardState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  interactPressed: boolean
  interactConsumed: boolean
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp'])
const BACK_KEYS = new Set(['KeyS', 'ArrowDown'])
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft'])
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight'])
const INTERACT_KEYS = new Set(['KeyE'])

// Mutable state ref updated by DOM listeners; useFrame reads it every frame.
// interactPressed is edge-triggered — consumer calls `consumeInteract()` to clear the pulse.
export function useKeyboard(): {
  state: React.MutableRefObject<KeyboardState>
  consumeInteract: () => boolean
} {
  const state = useRef<KeyboardState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    interactPressed: false,
    interactConsumed: false,
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

  return { state, consumeInteract }
}
