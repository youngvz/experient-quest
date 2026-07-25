import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TOUCH_JOYSTICK_BASE_RADIUS,
  TOUCH_JOYSTICK_DEADZONE,
  TOUCH_JOYSTICK_STICK_RADIUS,
  TOUCH_LOOK_SENSITIVITY,
} from '../../game/constants/gameConstants'
import { touchInput } from '../../game/input/touchInput'
import { useGameEvent } from '../../hooks/useGameEvents'
import './TouchControls.css'

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

  if (suppressed) return null

  return (
    <div className="touch-controls" aria-hidden="true">
      <Joystick />
      <LookPad />
    </div>
  )
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
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchDistRef = useRef<number | null>(null)

  const currentPinchDist = () => {
    const pts = Array.from(pointersRef.current.values())
    if (pts.length < 2) return null
    const [a, b] = pts
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    padRef.current?.setPointerCapture(event.pointerId)
    if (pointersRef.current.size >= 2) {
      pinchDistRef.current = currentPinchDist()
    }
    event.preventDefault()
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointersRef.current.get(event.pointerId)
    if (!prev) return
    const curr = { x: event.clientX, y: event.clientY }
    pointersRef.current.set(event.pointerId, curr)
    if (pointersRef.current.size >= 2) {
      // Two-finger pinch — camera zoom. Ignore yaw drag while pinching so a
      // slight rotation between fingers doesn't spin the camera.
      const dist = currentPinchDist()
      if (dist !== null && pinchDistRef.current !== null && pinchDistRef.current > 0) {
        // Fingers spreading (dist > previous) means we're zooming out. Player
        // camera zoom `zoomRef` scales CAMERA_DISTANCE, so spreading fingers
        // should decrease the zoom factor toward CAMERA_ZOOM_MIN — invert.
        touchInput.addZoomFactor(pinchDistRef.current / dist)
      }
      pinchDistRef.current = dist
      return
    }
    // Single-finger drag — camera yaw. Sign matches useMouseLook: dragging
    // right increases yaw (world rotates CCW under the camera).
    const dx = curr.x - prev.x
    touchInput.addYawDelta(dx * TOUCH_LOOK_SENSITIVITY)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchDistRef.current = null
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
