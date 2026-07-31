import { useCallback, useEffect, useRef } from 'react'
import { gameEvents } from '../../game/events/GameEventBus'
import type { ZoneEnteredPayload } from '../../game/events/gameEvents'
import { useGameEvent } from '../../hooks/useGameEvents'
import { presentationStops } from '../../game/interactions/interactionTypes'
import { useGameStore } from '../../game/state/gameStore'

// Let the RoomToast fully fade in (0.22s) and hold for a beat before the
// dialogue paints over it. Toast keeps running underneath — this is just
// long enough that the player registers the room label first.
const TOAST_CLEAR_MS = 1000

// Signal-only listener: on zone entry, look up any presentation stop
// bound to that zone via `autoTriggerOnZone` and — if not already seen
// and no overlay is currently active — fire the same interaction event
// a manual Enter-press would, so DialogueOverlay handles the rest.
// Delayed so the RoomToast has time to play; cancelled if the player
// leaves the zone or another overlay opens first.
export function AutoZoneDialogue() {
  const pendingRef = useRef<{ stopId: string; timerId: number } | null>(null)

  const cancelPending = useCallback(() => {
    const pending = pendingRef.current
    if (!pending) return
    window.clearTimeout(pending.timerId)
    pendingRef.current = null
  }, [])

  const handle = useCallback(
    (payload: ZoneEnteredPayload) => {
      // Any zone change (including leaving the target zone) invalidates a
      // queued auto-trigger — we don't want to pop a "you're in the garage"
      // line after the player has already walked back out.
      cancelPending()
      const stop = presentationStops.find(
        (s) => s.autoTriggerOnZone === payload.zoneId,
      )
      if (!stop) return
      const store = useGameStore.getState()
      if (store.activeStopId) return
      if (store.completedStopIds.has(stop.id)) return
      if (stop.requiresQuest && !store.unlockedQuestIds.includes(stop.requiresQuest))
        return
      const timerId = window.setTimeout(() => {
        pendingRef.current = null
        // Re-check invariants at fire time — the player could have opened
        // another overlay (or somehow completed this stop) during the wait.
        const now = useGameStore.getState()
        if (now.activeStopId) return
        if (now.completedStopIds.has(stop.id)) return
        if (now.activeZone !== payload.zoneId) return
        gameEvents.emit('interaction:triggered', { stopId: stop.id })
      }, TOAST_CLEAR_MS)
      pendingRef.current = { stopId: stop.id, timerId }
    },
    [cancelPending],
  )

  useGameEvent('zone:entered', handle)
  // Any overlay opening from another source (e.g. player walked into an
  // NPC's zone during the delay) also cancels — the dialogue would just
  // interrupt whatever they're now reading.
  useGameEvent('interaction:triggered', cancelPending)

  useEffect(() => cancelPending, [cancelPending])
  return null
}
