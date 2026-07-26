import { useCallback, useEffect, useRef, useState } from 'react'
import type { QuestTaskCompletedPayload } from '../../game/events/gameEvents'
import { useGameEvent } from '../../hooks/useGameEvents'
import './QuestToast.css'

// Duration a toast stays fully visible; fade-out is CSS.
const TOAST_MS = 2600

interface ToastEntry {
  key: number
  label: string
}

// Top-center pinned toast that appears whenever a quest task first
// flips to done. Independent of the QuestLog (which lives top-right)
// and stacks vertically if several fire back-to-back.
export function QuestToast() {
  const [entries, setEntries] = useState<ToastEntry[]>([])
  const nextKey = useRef(1)

  const handle = useCallback((payload: QuestTaskCompletedPayload) => {
    const key = nextKey.current++
    setEntries((prev) => [...prev, { key, label: payload.label }])
    window.setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.key !== key))
    }, TOAST_MS)
  }, [])

  useGameEvent('quest:task-completed', handle)

  // Clean up timers on unmount (component is app-lifetime long, but
  // defensive against StrictMode double-invocation in dev).
  useEffect(() => () => setEntries([]), [])

  if (entries.length === 0) return null
  return (
    <div className="quest-toast-stack" aria-live="polite" role="status">
      {entries.map((entry) => (
        <div key={entry.key} className="quest-toast">
          <div className="quest-toast__label">Quest updated!</div>
          <div className="quest-toast__task">{entry.label}</div>
        </div>
      ))}
    </div>
  )
}
