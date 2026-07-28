import { useEffect, useState } from 'react'
import { useEnvironment } from '@react-three/drei'
import './BiosSplash.css'

const CAT_URL = `${import.meta.env.BASE_URL}assets/title/bios-cat.webp`

// Kick off the sunset HDR fetch as soon as the splash mounts. This is the
// biggest external asset the game loads (~2 MB from drei's CDN) and pmrem
// cubemap compilation on top of it visibly hitches the moment Player
// spawns. Preloading here means the network round-trip is done before
// the user even sees the title, so <Environment>'s eventual mount only
// pays the pmrem compile — and that runs behind the still-opaque title.
useEnvironment.preload({ preset: 'sunset' })

// Fixed on-screen time before the splash begins its exit sequence.
const HOLD_MS = 1600
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
    const holdTimer = window.setTimeout(() => setDimming(true), HOLD_MS)
    const dismissAny = () => setDimming(true)
    document.addEventListener('keydown', dismissAny)
    document.addEventListener('pointerdown', dismissAny)
    return () => {
      window.clearTimeout(holdTimer)
      document.removeEventListener('keydown', dismissAny)
      document.removeEventListener('pointerdown', dismissAny)
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
        <img
          className="bios-splash__cat"
          src={CAT_URL}
          alt=""
          draggable={false}
        />
        <div className="bios-splash__wordmark">youngvz creations</div>
      </div>
    </div>
  )
}
