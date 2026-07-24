import { useCallback, useEffect, useRef, useState } from 'react'
import { gameEvents } from '../../game/events/GameEventBus'
import { useGameEvent } from '../../hooks/useGameEvents'
import type { InteractionTriggeredPayload } from '../../game/events/gameEvents'
import './ContentOverlay.css'

export function ContentOverlay() {
  const [content, setContent] = useState<InteractionTriggeredPayload | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useGameEvent(
    'interaction:triggered',
    useCallback((payload: InteractionTriggeredPayload) => {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null
      setContent(payload)
    }, []),
  )

  const handleClose = useCallback(() => {
    setContent(null)
    gameEvents.emit('overlay:closed', undefined)
    const previous = previouslyFocusedRef.current
    if (previous && typeof previous.focus === 'function') {
      previous.focus()
    } else {
      document.getElementById('game-container')?.focus()
    }
    previouslyFocusedRef.current = null
  }, [])

  useEffect(() => {
    if (!content) return

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
  }, [content, handleClose])

  if (!content) return null

  const headingId = `overlay-title-${content.id}`

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
          {content.title}
        </h2>
        <div className="content-overlay__body">
          {content.body.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
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
