import { useCallback, useEffect, useRef } from 'react'
import { gameEvents } from '../../game/events/GameEventBus'
import { useGameEvent } from '../../hooks/useGameEvents'
import type { InteractionTriggeredPayload } from '../../game/events/gameEvents'
import { findStop, type PresentationStop } from '../../game/interactions/interactionTypes'
import { useGameStore } from '../../game/state/gameStore'
import './ContentOverlay.css'

export function ContentOverlay() {
  const activeStopId = useGameStore((s) => s.activeStopId)
  const setActiveStop = useGameStore((s) => s.setActiveStop)
  const markCompleted = useGameStore((s) => s.markCompleted)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

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

  const handleClose = useCallback(() => {
    if (activeStopId) markCompleted(activeStopId)
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

  useEffect(() => {
    if (!activeStopId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    // Focus the close button so a keyboard user can dismiss immediately;
    // simple focus containment — no full trap needed for a single control.
    closeButtonRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeStopId, handleClose])

  if (!activeStopId) return null
  const stop = findStop(activeStopId)
  if (!stop) return null
  // Dialogue stops are rendered by <DialogueOverlay> instead.
  if (stop.content.type === 'dialogue') return null

  const headingId = `overlay-title-${stop.id}`

  return (
    <div className="content-overlay" role="presentation" onClick={handleClose}>
      <div
        className="content-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={headingId} className="content-overlay__title">
          {stop.overlayTitle}
        </h2>
        <div className="content-overlay__body">
          <StopBody stop={stop} />
        </div>
        <div className="content-overlay__actions">
          <button
            ref={closeButtonRef}
            type="button"
            className="content-overlay__close"
            onClick={handleClose}
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  )
}

function StopBody({ stop }: { stop: PresentationStop }) {
  const intro = stop.intro ? (
    <>
      {stop.intro.split('\n\n').map((paragraph, index) => (
        <p key={`intro-${index}`}>{paragraph}</p>
      ))}
    </>
  ) : null

  switch (stop.content.type) {
    case 'events': {
      const events = stop.content.events
      if (events.length === 0) return intro ?? <p>No upcoming events yet.</p>
      return (
        <>
          {intro}
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
      if (people.length === 0) return intro ?? <p>No new hires this week.</p>
      return (
        <>
          {intro}
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
      if (projects.length === 0) return intro ?? <p>No project updates.</p>
      return (
        <>
          {intro}
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
          {intro}
          <p>{stop.content.setup}</p>
          <p>
            <em>{stop.content.punchline}</em>
          </p>
        </>
      )
    case 'media':
      return (
        <>
          {intro}
          <p>Media asset: {stop.content.assetId}</p>
          {stop.content.caption ? <p>{stop.content.caption}</p> : null}
        </>
      )
    case 'dialogue':
      // Handled by <DialogueOverlay>; the parent already returned null.
      return null
  }
}
