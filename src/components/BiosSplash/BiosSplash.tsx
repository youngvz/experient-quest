import { useEffect, useState } from 'react'
import { useEnvironment, useProgress } from '@react-three/drei'
import { AnimatedCatLogo } from '../AnimatedCatLogo/AnimatedCatLogo'
import './BiosSplash.css'

const TITLE_ART_URL = `${import.meta.env.BASE_URL}assets/title/title.webp`
const SPRITE_URL = `${import.meta.env.BASE_URL}assets/title/spritesheet.webp`

// Kick off the sunset HDR fetch as soon as the splash mounts. This is the
// biggest external asset the game loads (~2 MB from drei's CDN) and pmrem
// cubemap compilation on top of it visibly hitches the moment Player
// spawns. Preloading here means the network round-trip is done before
// the user even sees the title, so <Environment>'s eventual mount only
// pays the pmrem compile — and that runs behind the still-opaque title.
useEnvironment.preload({ preset: 'sunset' })

// Preload + decode the two images the splash / title depend on. We
// resolve when decode() finishes (or falls back to the load event) so
// dismissal actually waits for pixels-ready, not just headers. Decode
// failure resolves too — we don't want to hang the splash on a 404.
function preloadImage(src: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const img = new Image()
  img.src = src
  const decodePromise =
    typeof img.decode === 'function'
      ? img.decode().catch(() => undefined)
      : new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
  return decodePromise.then(() => undefined)
}

// Kicked off at module scope so the fetch starts alongside the app's
// first paint, in parallel with the splash mounting.
const titleArtReady = preloadImage(TITLE_ART_URL)
const spriteReady = preloadImage(SPRITE_URL)

// Minimum on-screen time before the splash begins its exit. Sized to
// let the shine animation (2.6s cycle in AnimatedCatLogo.css) play at
// least once end-to-end on fast connections. On slow connections the
// load gate below dominates.
const MIN_HOLD_MS = 2700
// Upper bound so a stalled / failing loader (bad CDN, offline asset)
// can't strand the user on the splash forever. Beyond this we dismiss
// regardless of load state and let downstream Suspense handle whatever
// hasn't arrived yet.
const MAX_HOLD_MS = 12000
// After a loader flips active=true at least once, we consider a period
// of sustained inactivity ("no loader has fired in this long") to mean
// the game-side preload queue has drained. This tolerates the tiny
// idle gaps between overlapping loaders finishing at slightly different
// times without prematurely dismissing.
const IDLE_SETTLE_MS = 400
// Phase 1 — cat + wordmark fade to a black card. Kept synced with the
// transition on `.bios-splash__stack` in the CSS.
const DIM_MS = 350
// Phase 2 — the black card itself fades away, revealing the title. Kept
// synced with the transition on `.bios-splash--out` and with
// TitleScreen's mount-in fade so the two crossfade cleanly.
const FADE_MS = 500

interface BiosSplashProps {
  // Fires when phase 2 begins — the black card is about to dissolve, so
  // the title screen should mount and fade in against it.
  onLeaving: () => void
  // Fires after phase 2 completes — safe to unmount the splash.
  onDone: () => void
}

// Lightweight pre-title studio splash. Renders as HTML/CSS only.
// Exit sequence is two phases:
//   1. Cat + wordmark fade out against the still-opaque black background.
//   2. Black background fades out, crossfading into the title screen.
// This avoids the jarring "revealed mid-transition" look of a single fade.
export function BiosSplash({ onLeaving, onDone }: BiosSplashProps) {
  const [dimming, setDimming] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Compose four gates. The splash dismisses when all the required
    // gates resolve, OR when the hard cap fires — whichever comes first.
    //
    //   minHold       — floor, so fast connections still see a full
    //                   shine cycle before dismissal.
    //   splashAssets  — the splash's own images (title art + sprite)
    //                   have decoded, so the crossfade won't reveal a
    //                   half-loaded TitleScreen.
    //   sceneIdle     — after at least one three.js loader has fired,
    //                   wait for useProgress.active to stay false for
    //                   IDLE_SETTLE_MS. This drains drei's queue: HDR,
    //                   preloaded GLBs, textures, etc.
    //   hardCap       — MAX_HOLD_MS backstop against a broken loader.
    let cancelled = false
    const cleanups: Array<() => void> = []

    const minHold = new Promise<void>((resolve) => {
      const id = window.setTimeout(resolve, MIN_HOLD_MS)
      cleanups.push(() => window.clearTimeout(id))
    })
    const hardCap = new Promise<void>((resolve) => {
      const id = window.setTimeout(resolve, MAX_HOLD_MS)
      cleanups.push(() => window.clearTimeout(id))
    })

    // useProgress starts active=false before anything has queued, so a
    // naive "not active" check would resolve immediately. Require at
    // least one active=true edge first, then wait for active to stay
    // false for IDLE_SETTLE_MS. That drains drei's loader queue.
    const sceneIdle = new Promise<void>((resolve) => {
      let hasLoadedSomething = useProgress.getState().active
      let idleTimer: number | null = null
      const check = () => {
        const { active } = useProgress.getState()
        if (active) hasLoadedSomething = true
        if (idleTimer !== null) {
          window.clearTimeout(idleTimer)
          idleTimer = null
        }
        if (!active && hasLoadedSomething) {
          idleTimer = window.setTimeout(() => resolve(), IDLE_SETTLE_MS)
        }
      }
      const unsubscribe = useProgress.subscribe(check)
      check()
      cleanups.push(() => {
        unsubscribe()
        if (idleTimer !== null) window.clearTimeout(idleTimer)
      })
    })

    const ready = Promise.all([
      minHold,
      titleArtReady,
      spriteReady,
      sceneIdle,
    ])
    Promise.race([ready, hardCap]).then(() => {
      if (!cancelled) setDimming(true)
    })
    return () => {
      cancelled = true
      for (const fn of cleanups) fn()
    }
  }, [])

  // After phase 1 (content fade) completes, start phase 2 (bg fade).
  useEffect(() => {
    if (!dimming) return
    const t = window.setTimeout(() => setLeaving(true), DIM_MS)
    return () => window.clearTimeout(t)
  }, [dimming])

  // Fire callbacks tied to phase 2.
  useEffect(() => {
    if (!leaving) return
    onLeaving()
    const t = window.setTimeout(onDone, FADE_MS)
    return () => window.clearTimeout(t)
  }, [leaving, onLeaving, onDone])

  const cls = [
    'bios-splash',
    dimming && 'bios-splash--dim',
    leaving && 'bios-splash--out',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} role="presentation" aria-hidden="true">
      <div className="bios-splash__stack">
        <AnimatedCatLogo className="bios-splash__cat" ariaLabel="" />
        <div className="bios-splash__wordmark">youngvz creations</div>
      </div>
    </div>
  )
}
