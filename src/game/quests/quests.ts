// Quest definitions. Static data — mutable progress lives in the game store
// (unlockedQuestIds, completedTaskIds). Mirrors the shape of `characters.ts`.

export interface QuestTask {
  id: string
  label: string
}

export interface Quest {
  id: string
  title: string
  tasks: QuestTask[]
}

export const QUESTS = {
  'weekly-status-meeting': {
    id: 'weekly-status-meeting',
    title: 'Technology Status Meeting',
    tasks: [
      { id: 'joke-of-week', label: 'Find Joke of the Week' },
      { id: 'company-updates', label: 'Get Company Updates' },
      { id: 'download-demo', label: 'Download Demo' },
    ],
  },
} as const satisfies Record<string, Quest>

export type QuestId = keyof typeof QUESTS

export function getQuest(id: string): Quest {
  const q = (QUESTS as Record<string, Quest>)[id]
  if (!q) throw new Error(`Unknown quest id: ${id}`)
  return q
}

// Derived task rules: a task completes when EVERY listed stop id is in
// `completedStopIds`. Evaluated by the store's markCompleted /
// acceptQuestUnlock reducers, so a stop can indirectly tick multiple
// tasks. For direct 1:1 mappings, prefer `questTaskComplete` on the
// PresentationStop itself.
export interface DerivedTaskCompletion {
  questId: string
  taskId: string
  requiresStops: readonly string[]
}

export const DERIVED_TASK_COMPLETIONS: readonly DerivedTaskCompletion[] = [
  {
    questId: 'weekly-status-meeting',
    taskId: 'joke-of-week',
    // The player collects joke fragments (or vibes) from three NPCs;
    // once all three have been visited, the task ticks itself.
    requiresStops: ['juan', 'sarah', 'tenant'],
  },
]
