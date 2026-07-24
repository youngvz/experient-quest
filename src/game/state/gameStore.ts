import { create } from 'zustand'

// A "zone" is a named region of the world. The player is in exactly one at
// a time (defaulting to the office). Scene branches subscribe to the active
// zone via useActiveZone() and mount/unmount their contents accordingly —
// this is what lets us keep one <Physics> world while lazy-loading rooms.
export type ZoneId = 'office' | 'corridor' | (string & {})

export interface GameState {
  activeStopId: string | null
  completedStopIds: ReadonlySet<string>
  activeZone: ZoneId
  setActiveStop: (id: string | null) => void
  markCompleted: (id: string) => void
  setActiveZone: (zone: ZoneId) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  activeStopId: null,
  completedStopIds: new Set<string>(),
  activeZone: 'office',
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
  reset: () =>
    set({
      activeStopId: null,
      completedStopIds: new Set<string>(),
      activeZone: 'office',
    }),
}))

export const useActiveStopId = () => useGameStore((s) => s.activeStopId)
export const useIsCompleted = (id: string) =>
  useGameStore((s) => s.completedStopIds.has(id))
export const useActiveZone = () => useGameStore((s) => s.activeZone)
