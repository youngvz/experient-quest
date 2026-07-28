import { Children, useCallback, useEffect, useMemo, useRef } from 'react'
import { gameEvents } from '../../game/events/GameEventBus'
import { useGameEvent } from '../../hooks/useGameEvents'
import type { InteractionTriggeredPayload } from '../../game/events/gameEvents'
import { findStop, type PresentationStop } from '../../game/interactions/interactionTypes'
import {
  PLAYER_SPEAKER_ID,
  resolveSpeaker,
  substitutePlayerName,
} from '../../game/characters/roster'
import { getQuest } from '../../game/quests/quests'
import { useGameStore, useSelectedCharacter } from '../../game/state/gameStore'
import { usePaginatedChildren } from '../../hooks/usePaginatedChildren'
import './ContentOverlay.css'

export function ContentOverlay() {
  const activeStopId = useGameStore((s) => s.activeStopId)
  const setActiveStop = useGameStore((s) => s.setActiveStop)
  const markCompleted = useGameStore((s) => s.markCompleted)
  const resetProgress = useGameStore((s) => s.resetProgress)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  useGameEvent(
    'interaction:triggered',
    useCallback(
      (payload: InteractionTriggeredPayload) => {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null
        setActiveStop(payload.stopId)
      },
      [setActiveStop],
    ),
  )

  const stop = activeStopId ? findStop(activeStopId) : null
  const shouldRender = stop && stop.content.type !== 'dialogue'

  const completedTaskIds = useGameStore((s) => s.completedTaskIds)
  const selectedCharacterId = useSelectedCharacter()
  const playerName = useMemo(
    () => resolveSpeaker(PLAYER_SPEAKER_ID, selectedCharacterId).name,
    [selectedCharacterId],
  )
  // Meeting stops with any incomplete task are a "fail" — the close button
  // becomes a "Try Again" that resets progression and respawns the player.
  const isFailedMeeting =
    stop?.content.type === 'meeting' &&
    !isMeetingSuccess(stop.content.questId, completedTaskIds)

  const restoreFocus = useCallback(() => {
    const previous = previouslyFocusedRef.current
    if (previous && typeof previous.focus === 'function') {
      previous.focus()
    } else {
      document.getElementById('game-container')?.focus()
    }
    previouslyFocusedRef.current = null
  }, [])

  const handleClose = useCallback(() => {
    if (isFailedMeeting) {
      // Try Again: wipe quest progression, snap the player back to spawn.
      // The stop is NOT marked completed — the player has to redo the run.
      resetProgress()
      gameEvents.emit('player:respawn', undefined)
    } else if (activeStopId) {
      markCompleted(activeStopId)
    }
    setActiveStop(null)
    gameEvents.emit('overlay:closed', undefined)
    restoreFocus()
  }, [activeStopId, isFailedMeeting, markCompleted, resetProgress, restoreFocus, setActiveStop])
  const bodyChildren = useMemo(() => {
    if (!shouldRender || !stop) return []
    return Children.toArray(renderStopBody(stop, completedTaskIds, playerName))
  }, [shouldRender, stop, completedTaskIds, playerName])

  const { pages, pageIndex, pageCount, hasNext, hasPrev, next, prev } = usePaginatedChildren({
    viewportRef,
    measureRef,
    contentKey: activeStopId ?? '',
  })

  const advanceOrClose = useCallback(() => {
    if (hasNext) next()
    else handleClose()
  }, [hasNext, next, handleClose])

  useEffect(() => {
    if (!shouldRender) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
        return
      }
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        advanceOrClose()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shouldRender, handleClose, advanceOrClose, prev])

  if (!shouldRender || !stop) return null

  const headingId = `overlay-title-${stop.id}`
  const bodyId = `overlay-body-${stop.id}`
  const visibleIndexes = pages[pageIndex] ?? []
  const visibleSet = new Set(visibleIndexes)

  return (
    <div className="content-overlay" role="presentation" onClick={handleClose}>
      <div
        className="content-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={bodyId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={headingId} className="content-overlay__title">
          {stop.overlayTitle}
        </h2>
        <div id={bodyId} className="content-overlay__body" ref={viewportRef}>
          <div className="content-overlay__body-visible">
            {bodyChildren.map((child, i) =>
              visibleSet.has(i) ? (
                <div key={`visible-${i}`} className="content-overlay__body-item">
                  {child}
                </div>
              ) : null,
            )}
            {visibleIndexes.length === 0 && bodyChildren.length === 0 ? (
              <p className="content-overlay__empty">No content yet.</p>
            ) : null}
          </div>
          <div className="content-overlay__body-measure" ref={measureRef} aria-hidden="true">
            {bodyChildren.map((child, i) => (
              <div key={`measure-${i}`} className="content-overlay__body-item">
                {child}
              </div>
            ))}
          </div>
        </div>
        <div className="content-overlay__actions">
          {pageCount > 1 ? (
            <div className="content-overlay__pager" aria-live="polite">
              <button
                type="button"
                className="content-overlay__pager-btn"
                onClick={prev}
                disabled={!hasPrev}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="content-overlay__pager-label">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <button
                type="button"
                className="content-overlay__pager-btn"
                onClick={next}
                disabled={!hasNext}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          ) : (
            <span className="content-overlay__pager-spacer" aria-hidden="true" />
          )}
          <button
            ref={closeButtonRef}
            type="button"
            className="content-overlay__close"
            onClick={handleClose}
          >
            {isFailedMeeting && !hasNext
              ? 'Try Again'
              : hasNext
                ? 'Skip (Esc)'
                : 'Close (Esc)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Returns a fragment whose top-level children are the block units the
// paginator groups. Kept flat (no wrapper element around intro + list) so
// each paragraph and list can spill onto its own page independently.
function renderStopBody(
  stop: PresentationStop,
  completedTaskIds: ReadonlySet<string>,
  playerName: string,
) {
  const introParas = stop.intro
    ? stop.intro.split('\n\n').map((paragraph, index) => (
        <p key={`intro-${index}`}>{substitutePlayerName(paragraph, playerName)}</p>
      ))
    : []

  switch (stop.content.type) {
    case 'events': {
      const events = stop.content.events
      if (events.length === 0)
        return introParas.length > 0 ? <>{introParas}</> : <p>No upcoming events yet.</p>
      return (
        <>
          {introParas}
          <ul>
            {events.map((e) => (
              <li key={e.id}>
                <strong>{e.title}</strong> — {e.date}
                {e.blurb ? <> — {e.blurb}</> : null}
              </li>
            ))}
          </ul>
        </>
      )
    }
    case 'new-hires': {
      const people = stop.content.people
      if (people.length === 0)
        return introParas.length > 0 ? <>{introParas}</> : <p>No new hires this week.</p>
      return (
        <>
          {introParas}
          <ul>
            {people.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> — {p.role}
                {p.blurb ? <> — {p.blurb}</> : null}
              </li>
            ))}
          </ul>
        </>
      )
    }
    case 'projects': {
      const projects = stop.content.projects
      if (projects.length === 0)
        return introParas.length > 0 ? <>{introParas}</> : <p>No project updates.</p>
      return (
        <>
          {introParas}
          <ul>
            {projects.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> — {p.status}
                {p.blurb ? <> — {p.blurb}</> : null}
              </li>
            ))}
          </ul>
        </>
      )
    }
    case 'joke':
      return (
        <>
          {introParas}
          <p>{stop.content.setup}</p>
          <p>
            <em>{stop.content.punchline}</em>
          </p>
        </>
      )
    case 'media':
      return (
        <>
          {introParas}
          <p>Media asset: {stop.content.assetId}</p>
          {stop.content.caption ? <p>{stop.content.caption}</p> : null}
        </>
      )
    case 'meeting': {
      const outcome = describeMeetingOutcome(
        stop.content.questId,
        completedTaskIds,
        playerName,
      )
      return (
        <>
          {introParas}
          <p>{outcome}</p>
        </>
      )
    }
    case 'dialogue':
      // Handled by <DialogueOverlay>; parent returns before we get here.
      return null
  }
}

// True iff every task on the given quest is complete. Used to switch the
// content-overlay close button between "Close" and "Try Again".
export function isMeetingSuccess(
  questId: string,
  completedTaskIds: ReadonlySet<string>,
): boolean {
  let quest
  try {
    quest = getQuest(questId)
  } catch {
    return false
  }
  return quest.tasks.every((t) => completedTaskIds.has(`${questId}:${t.id}`))
}

// Picks the meeting-outcome text based on which of the quest's tasks are
// unchecked. Priority: all-missing > joke > updates > demo. If everything
// is done, we don't have a "success" copy yet — surface a placeholder so
// the overlay never renders blank.
function describeMeetingOutcome(
  questId: string,
  completedTaskIds: ReadonlySet<string>,
  playerName: string,
): string {
  let quest
  try {
    quest = getQuest(questId)
  } catch {
    return 'The meeting happened.'
  }
  const missing = quest.tasks.filter((t) => !completedTaskIds.has(`${questId}:${t.id}`))
  const raw = (() => {
    if (missing.length === quest.tasks.length) {
      return 'The meeting was a complete failure, no jokes, no updates and no demo. {player} was fired shortly after'
    }
    const missingIds = new Set(missing.map((t) => t.id))
    if (missingIds.has('joke-of-week')) {
      return "The meeting was a complete failure. There wasn't a joke of the week so nobody cared to listen. {player} was put on a PIP plan"
    }
    if (missingIds.has('company-updates')) {
      return 'The meeting was a complete failure. {player} forgot to tell the team about the happy hour event and everyone left early.'
    }
    if (missingIds.has('download-demo')) {
      return 'The meeting was a complete failure. Nobody learned anything! {player} was put on a PIP plan'
    }
    return 'The meeting went off without a hitch. Nice work, {player}.'
  })()
  return substitutePlayerName(raw, playerName)
}
