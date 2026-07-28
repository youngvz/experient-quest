import { useEffect, useState } from 'react'
import { useGameStore, usePhase } from '../../game/state/gameStore'
import { gameEvents } from '../../game/events/GameEventBus'
import './TitleScreen.css'

// User-supplied title art. Missing file just falls through to the CSS
// fallback title (the <h1>).
const TITLE_ART_URL = `${import.meta.env.BASE_URL}assets/title/title.webp`

// Minimum time the title is visible before Enter unlocks. Keeps the flash
// short on fast connections without making the screen feel cheap. Anything
// still downloading (character GLBs, HDR, apron props) continues loading
// behind the title art and behind gameplay after Start — Suspense at each
// mount site fades those in as they arrive.
const READY_MIN_DISPLAY_MS = 400

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
  const [ready, setReady] = useState(false)
  const [fading, setFading] = useState(false)
  const [artLoaded, setArtLoaded] = useState(false)
  const [artFailed, setArtFailed] = useState(false)

  // Unlock Start after a fixed minimum display time. We intentionally do
  // NOT wait on useProgress: with OfficeWorld mounted during title, the
  // loader queue tracks every GLB the whole world needs. Blocking Start
  // on all of that reintroduces the load-time wait we're trying to avoid.
  // Rooms and NPCs Suspense-fade in as their assets arrive; they don't
  // gate Start. Not gated on <img>'s onLoad either — cached images can
  // fire onLoad before React attaches the handler, and the fallback <h1>
  // is legible anyway.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), READY_MIN_DISPLAY_MS)
    return () => window.clearTimeout(t)
  }, [])

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
    // Flip to 'starting' — OfficeScene mounts under the still-opaque title.
    // The effect above owns the fade + final commit.
    setPhase('starting')
  }

  useEffect(() => {
    if (!ready || fading || phase !== 'title') return
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
  }, [ready, fading, phase])

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
            className={`title-screen__art${artLoaded ? ' title-screen__art--loaded' : ''}`}
            src={TITLE_ART_URL}
            alt=""
            onLoad={() => setArtLoaded(true)}
            onError={() => setArtFailed(true)}
            draggable={false}
          />
        )}
        {artFailed && (
          <h1 className="title-screen__title">Experient Quest</h1>
        )}
        <p className={`title-screen__hint${ready ? ' title-screen__hint--ready' : ''}`}>
          {ready ? (
            <>
              Press <kbd>Enter</kbd> to begin
            </>
          ) : (
            'Preparing the office…'
          )}
        </p>
      </div>
    </div>
  )
}
