import { useCallback, useEffect, useRef } from 'react'
import { getQuest } from '../../game/quests/quests'
import { useGameStore, useIsTaskComplete } from '../../game/state/gameStore'
import './QuestUnlockedModal.css'

export function QuestUnlockedModal() {
  const pendingUnlockQuestId = useGameStore((s) => s.pendingUnlockQuestId)
  const dismissUnlock = useGameStore((s) => s.dismissUnlock)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const handleClose = useCallback(() => {
    dismissUnlock()
    const previous = previouslyFocusedRef.current
    if (previous && typeof previous.focus === 'function') {
      previous.focus()
    } else {
      document.getElementById('game-container')?.focus()
    }
    previouslyFocusedRef.current = null
  }, [dismissUnlock])

  useEffect(() => {
    if (!pendingUnlockQuestId) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pendingUnlockQuestId, handleClose])

  if (!pendingUnlockQuestId) return null
  const quest = getQuest(pendingUnlockQuestId)

  return (
    <div className="quest-unlocked" role="presentation" onClick={handleClose}>
      <div
        className="quest-unlocked__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-unlocked-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div id="quest-unlocked-title" className="quest-unlocked__title">
          New Quest Unlocked!
        </div>
        <div className="quest-unlocked__subtitle">{quest.title}</div>
        <ul className="quest-unlocked__task-list">
          {quest.tasks.map((task) => (
            <QuestTaskRow key={task.id} questId={quest.id} taskId={task.id} label={task.label} />
          ))}
        </ul>
        <div className="quest-unlocked__actions">
          <button
            ref={closeButtonRef}
            type="button"
            className="quest-unlocked__close"
            onClick={handleClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestTaskRow({
  questId,
  taskId,
  label,
}: {
  questId: string
  taskId: string
  label: string
}) {
  const done = useIsTaskComplete(questId, taskId)
  return (
    <li className={done ? 'quest-unlocked__task quest-unlocked__task--done' : 'quest-unlocked__task'}>
      <span className={done ? 'quest-unlocked__check quest-unlocked__check--done' : 'quest-unlocked__check'} aria-hidden="true">
        {done ? '☑' : '☐'}
      </span>
      <span className="quest-unlocked__task-label">{label}</span>
    </li>
  )
}
