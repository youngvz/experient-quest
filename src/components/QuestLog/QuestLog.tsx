import { getQuest } from '../../game/quests/quests'
import { useGameStore, useIsTaskComplete } from '../../game/state/gameStore'
import './QuestLog.css'

// Top-right pinned overlay listing every unlocked quest and its tasks.
// Hidden until at least one quest is unlocked. Non-interactive — purely
// a state readout; task completion is driven by other stops calling
// `toggleTask()` on the store.
export function QuestLog() {
  const unlockedQuestIds = useGameStore((s) => s.unlockedQuestIds)
  // Hide the log while the "New Quest Unlocked!" modal is up — it appears
  // only after the player dismisses that modal ("Got it" / Enter / Space /
  // Esc / backdrop click all clear pendingUnlockQuestId).
  const pendingUnlockQuestId = useGameStore((s) => s.pendingUnlockQuestId)
  if (unlockedQuestIds.length === 0) return null
  if (pendingUnlockQuestId !== null) return null
  return (
    <aside className="quest-log" aria-label="Quest log">
      {unlockedQuestIds.map((questId) => (
        <QuestBlock key={questId} questId={questId} />
      ))}
    </aside>
  )
}

function QuestBlock({ questId }: { questId: string }) {
  const quest = getQuest(questId)
  return (
    <section className="quest-log__quest">
      <h3 className="quest-log__title">{quest.title}</h3>
      <ul className="quest-log__tasks">
        {quest.tasks.map((task) => (
          <QuestLogTaskRow
            key={task.id}
            questId={quest.id}
            taskId={task.id}
            label={task.label}
          />
        ))}
      </ul>
    </section>
  )
}

function QuestLogTaskRow({
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
    <li
      className={
        done ? 'quest-log__task quest-log__task--done' : 'quest-log__task'
      }
    >
      <span className="quest-log__check" aria-hidden="true">
        {done ? '☑' : '☐'}
      </span>
      <span className="quest-log__label">{label}</span>
    </li>
  )
}
