import { useEffect, useState } from 'react'
import { useEnvironment } from '@react-three/drei'
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
// let the shine animation (2.4s cycle in AnimatedCatLogo.css) play at
// least once end-to-end on fast connections. On slow connections the
// load gate below dominates.
const MIN_HOLD_MS = 2400
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
    // Race a min-hold timer against the load gate; dismiss when both are
    // done. Fast connection → min-hold dominates and the shine gets a
    // full cycle. Slow connection → the load gate dominates and the cat
    // keeps looping until title art + sprite are ready.
    let cancelled = false
    const minHold = new Promise<void>((resolve) =>
      window.setTimeout(resolve, MIN_HOLD_MS),
    )
    Promise.all([minHold, titleArtReady, spriteReady]).then(() => {
      if (!cancelled) setDimming(true)
    })
    return () => {
      cancelled = true
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
