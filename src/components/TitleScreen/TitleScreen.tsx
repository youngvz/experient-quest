import { useEffect, useState } from 'react'
import { useGameStore, usePhase } from '../../game/state/gameStore'
import { gameEvents } from '../../game/events/GameEventBus'
import './TitleScreen.css'

// User-supplied title art. Missing file just falls through to the CSS
// fallback title (the <h1>). The bios splash preloads this URL so the
// <img> below hits the browser cache on first paint.
const TITLE_ART_URL = `${import.meta.env.BASE_URL}assets/title/title.webp`

// How long the mount hitch is allowed to run behind the still-opaque
// title art before we start the fade. Long enough for Rapier's world
// init + first-frame shader compiles to finish on a typical laptop; the
// browser will already be doing that work on the main thread so this is
// a *maximum* — the fade will simply overlap with any late shader spikes.
const MOUNT_SETTLE_MS = 220

// Fade duration; matches the CSS transition on `.title-screen`.
const FADE_MS = 420

export function TitleScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const phase = usePhase()
  const [fading, setFading] = useState(false)
  const [artFailed, setArtFailed] = useState(false)

  // Once we're in the 'starting' phase, OfficeScene has been swapped in
  // behind the still-opaque title. Give the mount + Rapier init a short
  // window to run, then start the fade. When the fade completes, flip to
  // 'playing' (which unmounts this component) and respawn the player.
  useEffect(() => {
    if (phase !== 'starting') return
    const fadeTimer = window.setTimeout(() => setFading(true), MOUNT_SETTLE_MS)
    const commitTimer = window.setTimeout(() => {
      setPhase('playing')
      gameEvents.emit('player:respawn', undefined)
    }, MOUNT_SETTLE_MS + FADE_MS)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(commitTimer)
    }
  }, [phase, setPhase])

  const startPlay = () => {
    if (phase !== 'title') return
    // Flip to 'character-select' — CharacterSelect mounts on top of the
    // still-opaque title chrome. The picker owns the transition to
    // 'starting' once the player confirms.
    setPhase('character-select')
  }

  useEffect(() => {
    if (fading || phase !== 'title') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      startPlay()
    }
    // A pointer press anywhere on the overlay also advances — friendly for
    // touch devices where a keyboard prompt would be a dead end.
    const onPointer = () => startPlay()
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
    // startPlay is intentionally omitted — it's a stable inline closure
    // over setPhase (referentially stable Zustand action). Rebinding on
    // every render would still be safe, just needless work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fading, phase])

  return (
    <div
      className={`title-screen${fading ? ' title-screen--fading' : ''}`}
      role="dialog"
      aria-label="Experient Quest — title screen"
    >
      <div className="title-screen__scrim" aria-hidden="true" />
      <div className="title-screen__content">
        {!artFailed && (
          <img
            className="title-screen__art title-screen__art--loaded"
            src={TITLE_ART_URL}
            alt=""
            onError={() => setArtFailed(true)}
            draggable={false}
          />
        )}
        {artFailed && (
          <h1 className="title-screen__title">Experient Quest</h1>
        )}
        <p className="title-screen__hint title-screen__hint--ready">
          Press <kbd>Enter</kbd> to begin
        </p>
      </div>
    </div>
  )
}
