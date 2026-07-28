import { BiosSplash } from '../components/BiosSplash/BiosSplash'
import { ContentOverlay } from '../components/ContentOverlay/ContentOverlay'
import { DialogueOverlay } from '../components/DialogueOverlay/DialogueOverlay'
import { GameCanvas } from '../components/GameCanvas/GameCanvas'
import { InteractionPrompt } from '../components/InteractionPrompt/InteractionPrompt'
import { QuestLog } from '../components/QuestLog/QuestLog'
import { QuestToast } from '../components/QuestToast/QuestToast'
import { QuestUnlockedModal } from '../components/QuestUnlockedModal/QuestUnlockedModal'
import { RoomToast } from '../components/RoomToast/RoomToast'
import { TitleScreen } from '../components/TitleScreen/TitleScreen'
import { TouchControls } from '../components/TouchControls/TouchControls'
import { useGameStore, usePhase } from '../game/state/gameStore'
import { useCoarsePointer } from '../hooks/useCoarsePointer'
import { useCallback, useEffect, useState } from 'react'
import './App.css'

// Test/dev escape hatch: `?skipTitle=1` bypasses the title screen so the
// smoke test doesn't depend on drei's useProgress timing. Read once at
// mount to avoid re-triggering on rerenders.
function useSkipTitleParam() {
  const setPhase = useGameStore((s) => s.setPhase)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('skipTitle') === '1') setPhase('playing')
  }, [setPhase])
}

// Same escape hatch for the studio splash. `?skipTitle=1` also skips the
// bios splash so tests land straight in gameplay.
function readSkipSplash(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('skipTitle') === '1'
}

export function App() {
  const isCoarse = useCoarsePointer()
  const phase = usePhase()
  // Title stays mounted through 'title' AND 'starting' — during 'starting'
  // it fades out while OfficeWorld mounts behind it, hiding the Physics /
  // shader-compile hitch inside the fade window.
  const showTitle = phase === 'title' || phase === 'starting'
  const showGameplayUi = phase === 'playing'
  // splashLeaving flips when BiosSplash starts fading out — we use it to
  // mount TitleScreen so its fade-in runs in the SAME window, producing a
  // crossfade instead of a pop-in. splashDone flips when the fade
  // completes so we can unmount the splash entirely.
  const skip = readSkipSplash()
  const [splashLeaving, setSplashLeaving] = useState(skip)
  const [splashDone, setSplashDone] = useState(skip)
  const handleSplashLeaving = useCallback(() => setSplashLeaving(true), [])
  const handleSplashDone = useCallback(() => setSplashDone(true), [])
  useSkipTitleParam()
  return (
    <div className="app">
      <GameCanvas />
      {showGameplayUi && (
        <>
          <InteractionPrompt />
          <QuestLog />
          <QuestToast />
          <RoomToast />
          <ContentOverlay />
          <DialogueOverlay />
          <QuestUnlockedModal />
          {isCoarse && <TouchControls />}
        </>
      )}
      {showTitle && splashLeaving && <TitleScreen />}
      {!splashDone && (
        <BiosSplash onLeaving={handleSplashLeaving} onDone={handleSplashDone} />
      )}
    </div>
  )
}
