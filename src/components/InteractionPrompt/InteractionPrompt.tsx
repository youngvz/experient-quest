import { useCallback, useState } from 'react'
import { touchInput } from '../../game/input/touchInput'
import { useGameEvent } from '../../hooks/useGameEvents'
import './InteractionPrompt.css'

export function InteractionPrompt() {
  const [prompt, setPrompt] = useState<string | null>(null)

  useGameEvent(
    'interaction:available',
    useCallback(({ prompt: nextPrompt }) => {
      setPrompt(nextPrompt)
    }, []),
  )

  useGameEvent(
    'interaction:unavailable',
    useCallback(() => {
      setPrompt(null)
    }, []),
  )

  useGameEvent(
    'interaction:triggered',
    useCallback(() => {
      setPrompt(null)
    }, []),
  )

  if (!prompt) return null

  return (
    <button
      type="button"
      className="interaction-prompt"
      aria-live="polite"
      onClick={() => touchInput.emitInteract()}
    >
      {prompt}
    </button>
  )
}
