import { useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { CHARACTERS } from '../../game/characters/characters'
import { SELECTABLE_CHARACTER_IDS } from '../../game/characters/roster'
import {
  useGameStore,
  usePhase,
  useSelectedCharacter,
} from '../../game/state/gameStore'
import './CharacterSelect.css'

// Matches TitleScreen's timing constants so the title → select → starting
// sequence feels like one continuous hand-off.
const READY_MIN_DISPLAY_MS = 260
const FADE_MS = 420

export function CharacterSelect() {
  const phase = usePhase()
  const setPhase = useGameStore((s) => s.setPhase)
  const setSelectedCharacter = useGameStore((s) => s.setSelectedCharacter)
  const selectedId = useSelectedCharacter()

  const initialIndex = useMemo(() => {
    const i = SELECTABLE_CHARACTER_IDS.indexOf(selectedId)
    return i >= 0 ? i : 0
    // Only seed on mount — cycling shouldn't reflect back into the store
    // until Confirm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [index, setIndex] = useState(initialIndex)
  const [ready, setReady] = useState(false)
  const [fading, setFading] = useState(false)

  const currentId = SELECTABLE_CHARACTER_IDS[index]!
  const current = CHARACTERS[currentId]
  const count = SELECTABLE_CHARACTER_IDS.length

  // Warm the focused GLB so Confirm doesn't stall on a fetch. Preload is a
  // no-op if drei has already cached the URL (OfficeWorld preloads most of
  // the roster during title).
  useEffect(() => {
    useGLTF.preload(current.glbUrl)
  }, [current.glbUrl])

  // Match TitleScreen's fade-in gate — a brief settle so the crossfade
  // from title doesn't collide with instant input.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), READY_MIN_DISPLAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  const cycle = (delta: number) => {
    setIndex((i) => (i + delta + count) % count)
  }

  const confirm = () => {
    if (!ready || fading) return
    if (phase !== 'character-select') return
    setSelectedCharacter(currentId)
    setFading(true)
    // Let the fade play before handing off. TitleScreen's phase==='starting'
    // effect owns the mount-settle + player:respawn from here.
    window.setTimeout(() => setPhase('starting'), FADE_MS)
  }

  useEffect(() => {
    if (phase !== 'character-select') return
    const onKey = (e: KeyboardEvent) => {
      if (fading) return
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        cycle(-1)
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        cycle(1)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        confirm()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // confirm / cycle are stable inline closures over Zustand actions; the
    // effect re-registers on phase/ready/fading changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ready, fading, index])

  return (
    <div
      className={`character-select${fading ? ' character-select--fading' : ''}`}
      role="dialog"
      aria-label="Character select"
    >
      <div className="character-select__scrim" aria-hidden="true" />
      <div className="character-select__content">
        <h2 className="character-select__heading">Choose your character</h2>
        <div className="character-select__stage">
          <button
            type="button"
            className="character-select__arrow character-select__arrow--prev"
            onClick={() => cycle(-1)}
            aria-label="Previous character"
          >
            ‹
          </button>
          <div className="character-select__portrait-wrap" key={currentId}>
            <img
              className="character-select__portrait"
              src={current.portraitUrl}
              alt={current.name}
              draggable={false}
            />
            <p className="character-select__name">{current.name}</p>
          </div>
          <button
            type="button"
            className="character-select__arrow character-select__arrow--next"
            onClick={() => cycle(1)}
            aria-label="Next character"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          className="character-select__confirm"
          onClick={confirm}
          disabled={!ready || fading}
        >
          Confirm
        </button>
        <p className="character-select__hint">
          <kbd>←</kbd> <kbd>→</kbd> cycle · <kbd>Enter</kbd> confirm
        </p>
      </div>
    </div>
  )
}
