import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gameEvents } from '../../game/events/GameEventBus'
import { useGameEvent } from '../../hooks/useGameEvents'
import type { InteractionTriggeredPayload } from '../../game/events/gameEvents'
import { findStop, type DialogueLine } from '../../game/interactions/interactionTypes'
import { getCharacter } from '../../game/characters/characters'
import { useGameStore } from '../../game/state/gameStore'
import { usePaginatedChildren } from '../../hooks/usePaginatedChildren'
import './DialogueOverlay.css'

export function DialogueOverlay() {
  const activeStopId = useGameStore((s) => s.activeStopId)
  const setActiveStop = useGameStore((s) => s.setActiveStop)
  const markCompleted = useGameStore((s) => s.markCompleted)
  const [lineIndex, setLineIndex] = useState(0)
  // Frozen at trigger time so `markCompleted` on close doesn't swap the
  // script under us on the last frame. Held in a ref because the reader
  // (the render) only needs it while `activeStopId` is set.
  const activeScriptRef = useRef<DialogueLine[] | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  useGameEvent(
    'interaction:triggered',
    useCallback(
      (payload: InteractionTriggeredPayload) => {
        const nextStop = findStop(payload.stopId)
        if (nextStop?.content.type !== 'dialogue') {
          activeScriptRef.current = null
          return
        }
        // Reading completedStopIds directly (not via a subscribed selector)
        // means we snapshot the "have I met them?" flag at trigger time.
        const seen = useGameStore.getState().completedStopIds.has(payload.stopId)
        activeScriptRef.current =
          seen && nextStop.content.repeatScript
            ? nextStop.content.repeatScript
            : nextStop.content.script
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null
        setActiveStop(payload.stopId)
        setLineIndex(0)
      },
      [setActiveStop],
    ),
  )

  const handleClose = useCallback(() => {
    if (activeStopId) {
      const stop = findStop(activeStopId)
      // Unlock BEFORE marking completed — unlockQuest() is a no-op if the
      // quest is already unlocked, so the ordering only matters for the
      // "first close" path. Firing before markCompleted keeps the mental
      // model "closing revealed the quest" intact even if a future stop
      // ever reads completedStopIds inside its own unlock hook.
      if (stop?.questUnlock) {
        useGameStore.getState().unlockQuest(stop.questUnlock)
      }
      markCompleted(activeStopId)
    }
    setActiveStop(null)
    gameEvents.emit('overlay:closed', undefined)
    const previous = previouslyFocusedRef.current
    if (previous && typeof previous.focus === 'function') {
      previous.focus()
    } else {
      document.getElementById('game-container')?.focus()
    }
    previouslyFocusedRef.current = null
  }, [activeStopId, markCompleted, setActiveStop])

  const script: DialogueLine[] | null = activeStopId
    ? activeScriptRef.current
    : null

  const line = script ? script[lineIndex] : null
  const segments = useMemo(() => (line ? line.text.split('\n') : []), [line])

  const contentKey = `${activeStopId ?? ''}:${lineIndex}`
  const { pages, pageIndex, pageCount, hasNext, hasPrev, next, prev } = usePaginatedChildren({
    viewportRef,
    measureRef,
    contentKey,
  })

  const advance = useCallback(() => {
    if (!script) return
    if (hasNext) {
      next()
      return
    }
    if (lineIndex >= script.length - 1) handleClose()
    else setLineIndex((i) => i + 1)
  }, [script, hasNext, next, lineIndex, handleClose])

  useEffect(() => {
    if (!script) return
    panelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault()
        advance()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        if (hasPrev) prev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [script, advance, handleClose, hasPrev, prev])

  if (!script || !line) return null
  const speaker = getCharacter(line.speakerId)
  const isLastLine = lineIndex >= script.length - 1
  const hasMore = hasNext || !isLastLine
  const visibleIndexes = pages[pageIndex] ?? []
  const visibleSet = new Set(visibleIndexes)

  return (
    <div className="dialogue-overlay" role="presentation" onClick={handleClose}>
      <div
        ref={panelRef}
        className="dialogue-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Dialogue with ${speaker.name}`}
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation()
          advance()
        }}
      >
        <div className="dialogue-overlay__portrait-frame">
          <img
            className="dialogue-overlay__portrait"
            src={speaker.portraitUrl}
            alt={speaker.name}
            draggable={false}
          />
        </div>
        <div className="dialogue-overlay__text">
          <div className="dialogue-overlay__speaker">{speaker.name.toUpperCase()}</div>
          <div className="dialogue-overlay__body" ref={viewportRef}>
            <div className="dialogue-overlay__body-visible">
              {segments.map((segment, i) =>
                visibleSet.has(i) ? (
                  <div key={`visible-${i}`} className="dialogue-overlay__line">
                    {segment}
                  </div>
                ) : null,
              )}
            </div>
            <div
              className="dialogue-overlay__body-measure"
              ref={measureRef}
              aria-hidden="true"
            >
              {segments.map((segment, i) => (
                <div key={`measure-${i}`} className="dialogue-overlay__line">
                  {segment}
                </div>
              ))}
            </div>
          </div>
          {pageCount > 1 ? (
            <div
              className="dialogue-overlay__pager"
              aria-live="polite"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="dialogue-overlay__pager-btn"
                onClick={prev}
                disabled={!hasPrev}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="dialogue-overlay__pager-label">
                {pageIndex + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="dialogue-overlay__pager-btn"
                onClick={next}
                disabled={!hasNext}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          ) : null}
          <div
            className={
              hasMore
                ? 'dialogue-overlay__indicator dialogue-overlay__indicator--more'
                : 'dialogue-overlay__indicator dialogue-overlay__indicator--end'
            }
            aria-hidden="true"
          >
            {hasMore ? '▼' : '×'}
          </div>
        </div>
      </div>
    </div>
  )
}
