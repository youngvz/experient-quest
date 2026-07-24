import { create } from 'zustand'

// A "zone" is a named region of the world. The player is in exactly one at
// a time (defaulting to the office). Scene branches subscribe to the active
// zone via useActiveZone() and mount/unmount their contents accordingly —
// this is what lets us keep one <Physics> world while lazy-loading rooms.
export type ZoneId = 'office' | 'central-corridor' | (string & {})

export interface GameState {
  activeStopId: string | null
  completedStopIds: ReadonlySet<string>
  activeZone: ZoneId
  // Quests the player has unlocked, in unlock order.
  unlockedQuestIds: readonly string[]
  // Tasks the player has checked off. Keys are `${questId}:${taskId}`.
  completedTaskIds: ReadonlySet<string>
  // Quest whose "New Quest Unlocked!" modal is currently showing (or null).
  pendingUnlockQuestId: string | null
  setActiveStop: (id: string | null) => void
  markCompleted: (id: string) => void
  setActiveZone: (zone: ZoneId) => void
  unlockQuest: (questId: string) => void
  dismissUnlock: () => void
  toggleTask: (questId: string, taskId: string) => void
  reset: () => void
}

const taskKey = (questId: string, taskId: string) => `${questId}:${taskId}`

export const useGameStore = create<GameState>((set) => ({
  activeStopId: null,
  completedStopIds: new Set<string>(),
  activeZone: 'office',
  unlockedQuestIds: [],
  completedTaskIds: new Set<string>(),
  pendingUnlockQuestId: null,
  setActiveStop: (id) => set({ activeStopId: id }),
  markCompleted: (id) =>
    set((state) => {
      if (state.completedStopIds.has(id)) return state
      const next = new Set(state.completedStopIds)
      next.add(id)
      return { completedStopIds: next }
    }),
  setActiveZone: (zone) =>
    // No-op if unchanged so subscribers don't re-render on every frame.
    set((state) => (state.activeZone === zone ? state : { activeZone: zone })),
  unlockQuest: (questId) =>
    set((state) => {
      if (state.unlockedQuestIds.includes(questId)) return state
      return {
        unlockedQuestIds: [...state.unlockedQuestIds, questId],
        pendingUnlockQuestId: questId,
      }
    }),
  dismissUnlock: () => set({ pendingUnlockQuestId: null }),
  toggleTask: (questId, taskId) =>
    set((state) => {
      const key = taskKey(questId, taskId)
      const next = new Set(state.completedTaskIds)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { completedTaskIds: next }
    }),
  reset: () =>
    set({
      activeStopId: null,
      completedStopIds: new Set<string>(),
      activeZone: 'office',
      unlockedQuestIds: [],
      completedTaskIds: new Set<string>(),
      pendingUnlockQuestId: null,
    }),
}))

export const useActiveStopId = () => useGameStore((s) => s.activeStopId)
export const useIsCompleted = (id: string) =>
  useGameStore((s) => s.completedStopIds.has(id))
export const useActiveZone = () => useGameStore((s) => s.activeZone)
export const useIsTaskComplete = (questId: string, taskId: string) =>
  useGameStore((s) => s.completedTaskIds.has(taskKey(questId, taskId)))
