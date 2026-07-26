import { useCallback, useEffect, useRef } from 'react'
import { getQuest } from '../../game/quests/quests'
import { useGameStore, useIsTaskComplete } from '../../game/state/gameStore'
import './QuestUnlockedModal.css'

// Renders one of two modal states — both reuse the same visual chrome:
//   1. Pending unlock: player just triggered a quest-giver; accept commits.
//   2. Pending ready: every task on an active quest just ticked to done;
//      prompt the player to start the meeting.
// The unlock state takes priority when both are pending.
export function QuestUnlockedModal() {
  const pendingUnlockQuestId = useGameStore((s) => s.pendingUnlockQuestId)
  const pendingReadyQuestId = useGameStore((s) => s.pendingReadyQuestId)
  const acceptQuestUnlock = useGameStore((s) => s.acceptQuestUnlock)
  const dismissUnlock = useGameStore((s) => s.dismissUnlock)
  const dismissReady = useGameStore((s) => s.dismissReady)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const mode: 'unlock' | 'ready' | null = pendingUnlockQuestId
    ? 'unlock'
    : pendingReadyQuestId
      ? 'ready'
      : null
  const questId = pendingUnlockQuestId ?? pendingReadyQuestId

  const restoreFocus = useCallback(() => {
    const previous = previouslyFocusedRef.current
    if (previous && typeof previous.focus === 'function') {
      previous.focus()
    } else {
      document.getElementById('game-container')?.focus()
    }
    previouslyFocusedRef.current = null
  }, [])

  // Unlock: accept commits (unlockedQuestIds + source stop completed).
  // Ready: dismiss stamps the quest in readyQuestIds so the modal doesn't
  // re-fire. Both close paths converge on restoreFocus.
  const handlePrimary = useCallback(() => {
    if (mode === 'unlock') acceptQuestUnlock()
    else if (mode === 'ready') dismissReady()
    restoreFocus()
  }, [mode, acceptQuestUnlock, dismissReady, restoreFocus])

  const handleDismiss = useCallback(() => {
    if (mode === 'unlock') dismissUnlock()
    else if (mode === 'ready') dismissReady()
    restoreFocus()
  }, [mode, dismissUnlock, dismissReady, restoreFocus])

  useEffect(() => {
    if (!mode) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handlePrimary()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, handlePrimary, handleDismiss])

  if (!mode || !questId) return null
  const quest = getQuest(questId)
  const title = mode === 'unlock' ? 'New Quest Unlocked!' : 'Objectives Complete!'
  const subtitle =
    mode === 'unlock'
      ? quest.title
      : 'Head to the conference room in The Bakery to start the meeting.'
  const primaryLabel = mode === 'unlock' ? 'Got it' : 'On my way'

  return (
    <div className="quest-unlocked" role="presentation" onClick={handleDismiss}>
      <div
        className="quest-unlocked__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-unlocked-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div id="quest-unlocked-title" className="quest-unlocked__title">
          {title}
        </div>
        <div className="quest-unlocked__subtitle">{subtitle}</div>
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
            onClick={handlePrimary}
          >
            {primaryLabel}
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
