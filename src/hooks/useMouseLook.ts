import { useEffect, useRef } from 'react'
import {
  CAMERA_INITIAL_YAW,
  MOUSE_LOOK_SENSITIVITY,
  TRACKPAD_LOOK_SENSITIVITY,
} from '../game/constants/gameConstants'

// Camera yaw input from multiple sources, unified into one ref that
// useFrame reads each frame:
//   • right/middle-mouse drag (external mice)
//   • two-finger horizontal scroll on trackpad (wheel `deltaX`)
//   • Q/E keyboard keys (see `useKeyboard`, applied in Player.tsx)
//
// Mutable ref so we don't cause React re-renders on every mouse move.
export function useMouseLook(): { yaw: React.MutableRefObject<number> } {
  const yaw = useRef(CAMERA_INITIAL_YAW)

  useEffect(() => {
    let dragging = false
    let lastX = 0

    const onMouseDown = (event: MouseEvent) => {
      // button 2 = right mouse; button 1 = middle. Left click passes through
      // for normal UI interactions.
      if (event.button !== 2 && event.button !== 1) return
      dragging = true
      lastX = event.clientX
      event.preventDefault()
    }
    const onMouseMove = (event: MouseEvent) => {
      if (!dragging) return
      const dx = event.clientX - lastX
      lastX = event.clientX
      // Drag right → world rotates left → yaw increases (CCW from above).
      yaw.current += dx * MOUSE_LOOK_SENSITIVITY
    }
    const stopDrag = () => {
      dragging = false
    }
    const onContextMenu = (event: MouseEvent) => {
      // Prevents the right-click menu from opening while orbiting.
      event.preventDefault()
    }
    const onWheel = (event: WheelEvent) => {
      // Two-finger horizontal trackpad swipes surface as `deltaX`. Only
      // orbit when the gesture is meaningfully horizontal — otherwise a
      // vertical scroll (`deltaY` dominates) shouldn't touch the camera.
      // The office is a single fullscreen canvas so eating the event is
      // safe; when we add scrollable UI, gate this on canvas focus.
      if (Math.abs(event.deltaX) < 1 || Math.abs(event.deltaX) < Math.abs(event.deltaY)) return
      yaw.current += event.deltaX * TRACKPAD_LOOK_SENSITIVITY
      event.preventDefault()
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('blur', stopDrag)
    window.addEventListener('contextmenu', onContextMenu)
    // `passive: false` is required to call preventDefault on wheel events —
    // browsers default wheel listeners to passive for smoother scrolling.
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('blur', stopDrag)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  return { yaw }
}
