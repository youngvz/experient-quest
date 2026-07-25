import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TOUCH_JOYSTICK_BASE_RADIUS,
  TOUCH_JOYSTICK_DEADZONE,
  TOUCH_JOYSTICK_STICK_RADIUS,
  TOUCH_LOOK_SENSITIVITY,
  TOUCH_PINCH_SENSITIVITY,
} from '../../game/constants/gameConstants'
import { touchInput } from '../../game/input/touchInput'
import { useGameEvent } from '../../hooks/useGameEvents'
import './TouchControls.css'

// Module-scoped flag so Joystick/LookPad can suppress their single-touch
// output while a global pinch is active. Set by useGlobalPinch below.
const pinchState = { active: false }

export function TouchControls() {
  const [suppressed, setSuppressed] = useState(false)

  useGameEvent(
    'interaction:triggered',
    useCallback(() => {
      touchInput.reset()
      setSuppressed(true)
    }, []),
  )
  useGameEvent(
    'overlay:closed',
    useCallback(() => setSuppressed(false), []),
  )

  useEffect(() => {
    const onBlur = () => touchInput.reset()
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  useGlobalPinch(!suppressed)

  if (suppressed) return null

  return (
    <div className="touch-controls" aria-hidden="true">
      <Joystick />
      <LookPad />
    </div>
  )
}

// Tracks every active touch pointer globally so a pinch anywhere on screen —
// over the canvas, joystick, look pad, or overlays — feeds camera zoom.
// Listens at the window in the capture phase so it observes events even when
// a local surface calls setPointerCapture / stopPropagation. `pointerType`
// filter skips mouse/pen so a two-button mouse click can't accidentally
// register as a pinch.
function useGlobalPinch(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const pointers = new Map<number, { x: number; y: number }>()
    const pinchDistRef = { current: null as number | null }

    const pairDistance = () => {
      const pts = Array.from(pointers.values())
      if (pts.length < 2) return null
      // Use the first two live touches. If a third finger lands we ignore it
      // rather than jumping the baseline — simple and predictable.
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size >= 2) {
        pinchState.active = true
        pinchDistRef.current = pairDistance()
        // Cancel any pending single-touch move so a pinch doesn't drift the
        // player during the gesture.
        touchInput.setMove(0, 0)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      if (!pointers.has(event.pointerId)) return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size < 2) return
      const dist = pairDistance()
      const prev = pinchDistRef.current
      if (dist !== null && prev !== null && prev > 0 && dist > 0) {
        // Fingers spreading (dist > prev) means we're zooming out. `zoomRef`
        // scales CAMERA_DISTANCE, so spreading fingers should reduce
        // zoomRef — invert the ratio. The exponent tunes sensitivity.
        touchInput.addZoomFactor((prev / dist) ** TOUCH_PINCH_SENSITIVITY)
      }
      pinchDistRef.current = dist
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointers.delete(event.pointerId)
      if (pointers.size < 2) {
        pinchState.active = false
        pinchDistRef.current = null
      }
    }

    const opts: AddEventListenerOptions = { capture: true, passive: true }
    window.addEventListener('pointerdown', onPointerDown, opts)
    window.addEventListener('pointermove', onPointerMove, opts)
    window.addEventListener('pointerup', onPointerEnd, opts)
    window.addEventListener('pointercancel', onPointerEnd, opts)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, opts)
      window.removeEventListener('pointermove', onPointerMove, opts)
      window.removeEventListener('pointerup', onPointerEnd, opts)
      window.removeEventListener('pointercancel', onPointerEnd, opts)
      pinchState.active = false
    }
  }, [enabled])
}

function Joystick() {
  const baseRef = useRef<HTMLDivElement | null>(null)
  const stickRef = useRef<HTMLDivElement | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const applyStick = (dx: number, dy: number) => {
    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    }
  }

  const release = () => {
    pointerIdRef.current = null
    applyStick(0, 0)
    touchInput.setMove(0, 0)
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return
    const rect = baseRef.current?.getBoundingClientRect()
    if (!rect) return
    pointerIdRef.current = event.pointerId
    // Center the joystick response on the physical base center, not the touch
    // point. This lets the thumb rest slightly off-center without immediately
    // walking the player.
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    baseRef.current?.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return
    // While a global pinch is active, freeze move output so a rotating grip
    // doesn't walk the player. The stick also snaps to center for feedback.
    if (pinchState.active) {
      applyStick(0, 0)
      touchInput.setMove(0, 0)
      return
    }
    const center = centerRef.current
    let dx = event.clientX - center.x
    let dy = event.clientY - center.y
    const r = TOUCH_JOYSTICK_BASE_RADIUS
    const len = Math.hypot(dx, dy)
    if (len > r) {
      dx = (dx / len) * r
      dy = (dy / len) * r
    }
    applyStick(dx, dy)
    // Screen +Y = down; world +Z = "back" (south). Direct mapping: dy>0 → +z.
    let nx = dx / r
    let nz = dy / r
    // Deadzone at the resting thumb radius.
    if (Math.hypot(nx, nz) < TOUCH_JOYSTICK_DEADZONE) {
      nx = 0
      nz = 0
    }
    touchInput.setMove(nx, nz)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return
    release()
  }

  return (
    <div
      ref={baseRef}
      className="touch-controls__joystick"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={release}
      style={
        {
          '--joystick-base': `${TOUCH_JOYSTICK_BASE_RADIUS * 2}px`,
          '--joystick-stick': `${TOUCH_JOYSTICK_STICK_RADIUS * 2}px`,
        } as React.CSSProperties
      }
    >
      <div ref={stickRef} className="touch-controls__stick" />
    </div>
  )
}

function LookPad() {
  const padRef = useRef<HTMLDivElement | null>(null)
  const lastRef = useRef<{ id: number; x: number } | null>(null)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Only claim the first touch — additional fingers belong to the global
    // pinch tracker. Also skip if a pinch is already in flight.
    if (lastRef.current !== null || pinchState.active) return
    lastRef.current = { id: event.pointerId, x: event.clientX }
    padRef.current?.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const last = lastRef.current
    if (!last || last.id !== event.pointerId) return
    // Suppress yaw during a pinch — a slight rotation between fingers
    // shouldn't spin the camera. Refresh the baseline so we resume smoothly.
    if (pinchState.active) {
      lastRef.current = { id: event.pointerId, x: event.clientX }
      return
    }
    // Single-finger drag → camera yaw. Sign matches useMouseLook: dragging
    // right increases yaw (world rotates CCW under the camera).
    const dx = event.clientX - last.x
    lastRef.current = { id: event.pointerId, x: event.clientX }
    touchInput.addYawDelta(dx * TOUCH_LOOK_SENSITIVITY)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (lastRef.current?.id === event.pointerId) lastRef.current = null
  }

  return (
    <div
      ref={padRef}
      className="touch-controls__look"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )
}
