import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useState } from 'react'
import { OfficeScene } from '../../game/scene/OfficeScene'
import { TitlePreview } from '../../game/scene/TitlePreview'
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_INITIAL_YAW,
  PLAYER_SPAWN,
} from '../../game/constants/gameConstants'
import { useGameEvent } from '../../hooks/useGameEvents'
import { useGameStore, usePhase } from '../../game/state/gameStore'
import './GameCanvas.css'

export function GameCanvas() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const pendingUnlockQuestId = useGameStore((s) => s.pendingUnlockQuestId)
  const pendingReadyQuestId = useGameStore((s) => s.pendingReadyQuestId)
  const phase = usePhase()

  useGameEvent(
    'interaction:triggered',
    useCallback(() => setOverlayOpen(true), []),
  )
  useGameEvent(
    'overlay:closed',
    useCallback(() => setOverlayOpen(false), []),
  )

  // Title phase suppresses all player input and overlay-driven modals —
  // OR the phase check into the existing gate so Player.tsx doesn't need
  // to know about phases.
  const controlsDisabled =
    phase !== 'playing' ||
    overlayOpen ||
    pendingUnlockQuestId !== null ||
    pendingReadyQuestId !== null

  return (
    <div className="game-canvas">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          // Match the runtime polar-orbit math at CAMERA_INITIAL_YAW so the
          // first frame doesn't visibly snap into place. TitlePreview
          // installs its own PerspectiveCamera during the title phase.
          position: [
            PLAYER_SPAWN[0] + CAMERA_DISTANCE * Math.sin(CAMERA_INITIAL_YAW),
            CAMERA_HEIGHT,
            PLAYER_SPAWN[2] + CAMERA_DISTANCE * Math.cos(CAMERA_INITIAL_YAW),
          ],
          fov: 55,
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true }}
      >
        {/* Title phase uses a warm neutral matching the title art palette
            so the pre-ready loading state doesn't read as a black void
            while world geometry hydrates. Gameplay uses the sunset tint. */}
        <color
          attach="background"
          args={[phase === 'title' ? '#3a2b22' : '#c78e5f']}
        />
        {phase !== 'title' && <fog attach="fog" args={['#c78e5f', 55, 140]} />}
        {/* OfficeScene mounts unconditionally so Rapier + geometry + shaders
            are built during the title. TitlePreview is a camera-only overlay
            that renders on top during the title phase. */}
        <OfficeScene controlsDisabled={controlsDisabled} />
        {phase === 'title' && (
          <Suspense fallback={null}>
            <TitlePreview />
          </Suspense>
        )}
      </Canvas>
    </div>
  )
}
