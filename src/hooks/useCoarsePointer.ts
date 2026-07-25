import { useEffect, useState } from 'react'

// Returns `true` when the primary pointer is coarse (touchscreen, no mouse).
// Also honors `?touch=1` / `?touch=0` in the URL as a hard override so we can
// test the touch HUD on a desktop without emulating a mobile device.
//
// Modeled on the useReducedMotion pattern prescribed in docs/accessibility.md
// (matchMedia + change subscription). Guards against `typeof window` for
// safety in non-browser environments, though this app is client-only.
export function useCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState<boolean>(() => detect())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const override = readOverride()
    if (override !== null) {
      setIsCoarse(override)
      return
    }
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = () => setIsCoarse(mq.matches)
    setIsCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isCoarse
}

function detect(): boolean {
  if (typeof window === 'undefined') return false
  const override = readOverride()
  if (override !== null) return override
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: coarse)').matches
}

function readOverride(): boolean | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('touch')
  if (raw === '1') return true
  if (raw === '0') return false
  return null
}
