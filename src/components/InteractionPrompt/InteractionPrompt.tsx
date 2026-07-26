import { useCallback, useState } from 'react'
import { touchInput } from '../../game/input/touchInput'
import { useCoarsePointer } from '../../hooks/useCoarsePointer'
import { useGameEvent } from '../../hooks/useGameEvents'
import './InteractionPrompt.css'

// Rewrites "Press Enter to X" / "Press E to X" → "Tap to X" for touch users.
// The prompts are authored in the presentation stops with keyboard verbs
// as the default; a coarse pointer has no keys to press, so we swap the
// verb here rather than duplicating every prompt string in the data.
const KEYBOARD_VERB = /^Press\s+[A-Za-z0-9]+\s+to\s+/i

function touchifyPrompt(prompt: string): string {
  return prompt.replace(KEYBOARD_VERB, 'Tap to ')
}

export function InteractionPrompt() {
  const [prompt, setPrompt] = useState<string | null>(null)
  const isCoarse = useCoarsePointer()

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
  const label = isCoarse ? touchifyPrompt(prompt) : prompt

  return (
    <button
      type="button"
      className="interaction-prompt"
      aria-live="polite"
      onClick={() => touchInput.emitInteract()}
    >
      {label}
    </button>
  )
}
