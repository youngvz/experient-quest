import { create } from 'zustand'

export interface GameState {
  activeStopId: string | null
  completedStopIds: ReadonlySet<string>
  setActiveStop: (id: string | null) => void
  markCompleted: (id: string) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  activeStopId: null,
  completedStopIds: new Set<string>(),
  setActiveStop: (id) => set({ activeStopId: id }),
  markCompleted: (id) =>
    set((state) => {
      if (state.completedStopIds.has(id)) return state
      const next = new Set(state.completedStopIds)
      next.add(id)
      return { completedStopIds: next }
    }),
  reset: () => set({ activeStopId: null, completedStopIds: new Set<string>() }),
}))

export const useActiveStopId = () => useGameStore((s) => s.activeStopId)
export const useIsCompleted = (id: string) =>
  useGameStore((s) => s.completedStopIds.has(id))
