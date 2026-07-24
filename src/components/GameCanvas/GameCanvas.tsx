import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { createGame } from '../../game/createGame'
import './GameCanvas.css'

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // StrictMode double-invokes effects; ref guard prevents a second Phaser instance.
    if (gameRef.current) return

    try {
      gameRef.current = createGame(container)
    } catch (err) {
      console.error('Failed to initialize Phaser game', err)
      setError('Failed to initialize the game. See the developer console for details.')
      return
    }

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="game-canvas">
      <div
        ref={containerRef}
        id="game-container"
        className="game-canvas__container"
        role="application"
        aria-label="Office RPG game canvas"
        tabIndex={0}
      />
      {error && (
        <div className="game-canvas__error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
