import { useCallback, useEffect, useRef, useState } from 'react'
import type { ZoneEnteredPayload } from '../../game/events/gameEvents'
import { useGameEvent } from '../../hooks/useGameEvents'
import './RoomToast.css'

// Total on-screen duration; fade-out timing lives in CSS.
const TOAST_MS = 2400

interface ToastEntry {
  key: number
  label: string
}

// Transient "Now entering <Room>" banner, pinned bottom-center so it
// doesn't fight the top-center quest toasts. Fires whenever the player
// crosses into a labeled zone. Auto-dismisses; there's no persistent
// "current room" state — this is signal-only.
export function RoomToast() {
  const [entries, setEntries] = useState<ToastEntry[]>([])
  const nextKey = useRef(1)

  const handle = useCallback((payload: ZoneEnteredPayload) => {
    const key = nextKey.current++
    // Replace-latest, not stack: fast corridor→room→corridor transitions
    // shouldn't pile up multiple banners.
    setEntries([{ key, label: payload.label }])
    window.setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.key !== key))
    }, TOAST_MS)
  }, [])

  useGameEvent('zone:entered', handle)

  useEffect(() => () => setEntries([]), [])

  if (entries.length === 0) return null
  return (
    <div className="room-toast-stack" aria-live="polite" role="status">
      {entries.map((entry) => (
        <div key={entry.key} className="room-toast">
          <div className="room-toast__label">Now entering</div>
          <div className="room-toast__room">{entry.label}</div>
        </div>
      ))}
    </div>
  )
}
