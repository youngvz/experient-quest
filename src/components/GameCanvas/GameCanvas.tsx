import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { OfficeScene } from '../../game/scene/OfficeScene'
import { CAMERA_OFFSET, PLAYER_SPAWN } from '../../game/constants/gameConstants'
import { useGameEvent } from '../../hooks/useGameEvents'
import './GameCanvas.css'

export function GameCanvas() {
  const [overlayOpen, setOverlayOpen] = useState(false)

  useGameEvent(
    'interaction:triggered',
    useCallback(() => setOverlayOpen(true), []),
  )
  useGameEvent(
    'overlay:closed',
    useCallback(() => setOverlayOpen(false), []),
  )

  return (
    <div className="game-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [
            PLAYER_SPAWN[0] + CAMERA_OFFSET[0],
            CAMERA_OFFSET[1],
            PLAYER_SPAWN[2] + CAMERA_OFFSET[2],
          ],
          fov: 55,
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#c78e5f']} />
        <fog attach="fog" args={['#c78e5f', 55, 140]} />
        <OfficeScene controlsDisabled={overlayOpen} />
      </Canvas>
    </div>
  )
}
