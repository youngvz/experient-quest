import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { OfficeScene } from '../../game/scene/OfficeScene'
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_INITIAL_YAW,
  PLAYER_SPAWN,
} from '../../game/constants/gameConstants'
import { useGameEvent } from '../../hooks/useGameEvents'
import { useGameStore } from '../../game/state/gameStore'
import './GameCanvas.css'

export function GameCanvas() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const pendingUnlockQuestId = useGameStore((s) => s.pendingUnlockQuestId)
  const pendingReadyQuestId = useGameStore((s) => s.pendingReadyQuestId)

  useGameEvent(
    'interaction:triggered',
    useCallback(() => setOverlayOpen(true), []),
  )
  useGameEvent(
    'overlay:closed',
    useCallback(() => setOverlayOpen(false), []),
  )

  const controlsDisabled =
    overlayOpen || pendingUnlockQuestId !== null || pendingReadyQuestId !== null

  return (
    <div className="game-canvas">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          // Match the runtime polar-orbit math at CAMERA_INITIAL_YAW so the
          // first frame doesn't visibly snap into place.
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
        <color attach="background" args={['#c78e5f']} />
        <fog attach="fog" args={['#c78e5f', 55, 140]} />
        <OfficeScene controlsDisabled={controlsDisabled} />
      </Canvas>
    </div>
  )
}
