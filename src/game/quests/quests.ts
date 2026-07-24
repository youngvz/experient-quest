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
