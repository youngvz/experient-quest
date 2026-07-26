import { create } from 'zustand'
import { gameEvents } from '../events/GameEventBus'
import { DERIVED_TASK_COMPLETIONS, getQuest } from '../quests/quests'

// A "zone" is a named region of the world. The player is in exactly one at
// a time (defaulting to the office). Scene branches subscribe to the active
// zone via useActiveZone() and mount/unmount their contents accordingly —
// this is what lets us keep one <Physics> world while lazy-loading rooms.
export type ZoneId = 'office' | 'central-corridor' | (string & {})

// How the arrow keys behave. 'camera' is the default: ↑/↓ zoom, ←/→ yaw.
// 'movement' mirrors WASD (↑ forward, ↓ back, ← strafe left, → strafe right).
// Configurable at runtime so a future settings UI can flip it without code.
export type ArrowKeyMode = 'camera' | 'movement'

export interface GameState {
  activeStopId: string | null
  completedStopIds: ReadonlySet<string>
  activeZone: ZoneId
  // Rooms currently within the player's proximity radius. Independent of
  // activeZone: a room can be "nearby" without the player being inside it.
  // Scene branches subscribe via useIsRoomNearby(id) to mount at range.
  nearbyRooms: ReadonlySet<string>
  // Quests the player has unlocked, in unlock order. A quest is added here
  // ONLY when the player accepts it via the QuestUnlockedModal — presenting
  // the modal alone doesn't commit anything.
  unlockedQuestIds: readonly string[]
  // Tasks the player has checked off. Keys are `${questId}:${taskId}`.
  completedTaskIds: ReadonlySet<string>
  // Quest whose "New Quest Unlocked!" modal is currently showing (or null).
  // Being non-null does NOT mean the quest is unlocked — it's a preview
  // that becomes real when acceptQuestUnlock() is called.
  pendingUnlockQuestId: string | null
  // Stop that triggered the pending unlock. Marked completed only when the
  // player accepts (so a dismissed modal replays the original dialogue).
  pendingUnlockStopId: string | null
  // Quest whose "objectives complete — go present!" modal is showing (or
  // null). Fires once per quest, the first frame all its tasks tick to done.
  pendingReadyQuestId: string | null
  // Quests we've already shown the "ready" modal for. Prevents refiring if
  // a task is un-checked then re-checked.
  readyQuestIds: ReadonlySet<string>
  arrowKeyMode: ArrowKeyMode
  setActiveStop: (id: string | null) => void
  markCompleted: (id: string) => void
  setActiveZone: (zone: ZoneId) => void
  setNearbyRooms: (rooms: ReadonlySet<string>) => void
  presentQuestUnlock: (questId: string, sourceStopId: string) => void
  acceptQuestUnlock: () => void
  dismissUnlock: () => void
  dismissReady: () => void
  toggleTask: (questId: string, taskId: string) => void
  completeTask: (questId: string, taskId: string) => void
  setArrowKeyMode: (mode: ArrowKeyMode) => void
  // Wipe quest progression back to a fresh run (stops, tasks, unlocked
  // quests, ready-modal bookkeeping, and the active-stop overlay). Leaves
  // scene state (activeZone, nearbyRooms, arrowKeyMode) intact.
  resetProgress: () => void
  reset: () => void
}

const taskKey = (questId: string, taskId: string) => `${questId}:${taskId}`

// Display names for zones that trigger a "Now entering" toast. Corridors
// and the 'office' fallback are intentionally omitted — those are
// transitional, not destinations. Zones not in this map cause
// setActiveZone to update silently.
const ZONE_LABELS: Record<string, string> = {
  'the-lab': 'The Lab',
  'the-station': 'The Station',
  'the-boardroom': 'The Boardroom',
  'the-bakery': 'The Bakery',
  'the-garage': 'The Garage',
  'the-commons': 'The Commons',
  'the-library': 'The Library',
  'the-atrium': 'The Atrium',
  outdoor: 'Outdoors',
}

// Consumed once on the first `setActiveZone` call after module load so
// the spawn-time office→outdoor transition doesn't fire a toast. Also
// reset in `reset()` so the failure/respawn flow behaves the same as a
// fresh load.
let firstZoneTransition = true

// Fire the "task just completed" toast event for every task that turned
// on between `prev` and `next`. Emitted from the reducer so every path
// that flips a task (direct completeTask, derived rules, toggleTask on)
// gets one toast per fresh completion.
function emitFreshTaskCompletions(
  prev: ReadonlySet<string>,
  next: ReadonlySet<string>,
): void {
  if (prev === next) return
  for (const key of next) {
    if (prev.has(key)) continue
    const [questId, taskId] = key.split(':') as [string, string]
    let label = taskId
    try {
      const task = getQuest(questId).tasks.find((t) => t.id === taskId)
      if (task) label = task.label
    } catch {
      // Unknown quest — fall back to the task id.
    }
    gameEvents.emit('quest:task-completed', { questId, taskId, label })
  }
}

// Given the set of currently-unlocked quests and the completed-task set,
// return the id of a quest whose every task JUST became complete and that
// hasn't yet been announced (`readyQuestIds`). Returns null if nothing
// fresh completed. Only one modal fires at a time — extra freshly-ready
// quests would be dropped, but we only have one quest today so this is
// a non-issue.
function findFreshlyReadyQuest(
  unlockedQuestIds: readonly string[],
  completedTaskIds: ReadonlySet<string>,
  readyQuestIds: ReadonlySet<string>,
): string | null {
  for (const questId of unlockedQuestIds) {
    if (readyQuestIds.has(questId)) continue
    let quest
    try {
      quest = getQuest(questId)
    } catch {
      continue
    }
    let allDone = true
    for (const task of quest.tasks) {
      if (!completedTaskIds.has(taskKey(questId, task.id))) {
        allDone = false
        break
      }
    }
    if (allDone) return questId
  }
  return null
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a === b) return true
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

// Walk the derived-task rules against a proposed `completedStopIds` set
// and return an updated `completedTaskIds` set (or the input unchanged
// if nothing fired). Idempotent — called from every place that grows
// completedStopIds.
function applyDerivedTaskCompletions(
  completedStopIds: ReadonlySet<string>,
  completedTaskIds: ReadonlySet<string>,
): ReadonlySet<string> {
  let next: Set<string> | null = null
  for (const rule of DERIVED_TASK_COMPLETIONS) {
    const key = taskKey(rule.questId, rule.taskId)
    if (completedTaskIds.has(key)) continue
    let allMet = true
    for (const stopId of rule.requiresStops) {
      if (!completedStopIds.has(stopId)) {
        allMet = false
        break
      }
    }
    if (!allMet) continue
    if (!next) next = new Set(completedTaskIds)
    next.add(key)
  }
  return next ?? completedTaskIds
}

export const useGameStore = create<GameState>((set) => ({
  activeStopId: null,
  completedStopIds: new Set<string>(),
  activeZone: 'office',
  nearbyRooms: new Set<string>(),
  unlockedQuestIds: [],
  completedTaskIds: new Set<string>(),
  pendingUnlockQuestId: null,
  pendingUnlockStopId: null,
  pendingReadyQuestId: null,
  readyQuestIds: new Set<string>(),
  arrowKeyMode: 'camera',
  setActiveStop: (id) => set({ activeStopId: id }),
  markCompleted: (id) =>
    set((state) => {
      if (state.completedStopIds.has(id)) return state
      const nextStops = new Set(state.completedStopIds)
      nextStops.add(id)
      const nextTasks = applyDerivedTaskCompletions(nextStops, state.completedTaskIds)
      emitFreshTaskCompletions(state.completedTaskIds, nextTasks)
      const patch: Partial<GameState> = { completedStopIds: nextStops }
      if (nextTasks !== state.completedTaskIds) patch.completedTaskIds = nextTasks
      const readyId =
        state.pendingReadyQuestId ??
        findFreshlyReadyQuest(state.unlockedQuestIds, nextTasks, state.readyQuestIds)
      if (readyId && readyId !== state.pendingReadyQuestId) patch.pendingReadyQuestId = readyId
      return patch
    }),
  setActiveZone: (zone) =>
    // No-op if unchanged so subscribers don't re-render on every frame.
    set((state) => {
      if (state.activeZone === zone) return state
      // Suppress the very first zone transition after load. Spawn sits
      // inside the outdoor rect, so the ZoneManager fires 'office' →
      // 'outdoor' on mount; toasting there would greet the player with
      // "Now entering Outdoors" before they touch a key.
      const suppress = firstZoneTransition
      firstZoneTransition = false
      const label = ZONE_LABELS[zone]
      if (!suppress && label) {
        gameEvents.emit('zone:entered', { zoneId: zone, label })
      }
      return { activeZone: zone }
    }),
  setNearbyRooms: (rooms) =>
    set((state) => (setsEqual(state.nearbyRooms, rooms) ? state : { nearbyRooms: rooms })),
  presentQuestUnlock: (questId, sourceStopId) =>
    set((state) => {
      // Already unlocked → don't re-show the modal.
      if (state.unlockedQuestIds.includes(questId)) return state
      return { pendingUnlockQuestId: questId, pendingUnlockStopId: sourceStopId }
    }),
  acceptQuestUnlock: () =>
    set((state) => {
      const questId = state.pendingUnlockQuestId
      if (!questId) return state
      const alreadyUnlocked = state.unlockedQuestIds.includes(questId)
      const unlockedQuestIds = alreadyUnlocked
        ? state.unlockedQuestIds
        : [...state.unlockedQuestIds, questId]
      // Mark the source stop completed on accept so the repeat dialogue only
      // plays after the player has committed. Dismiss (no accept) leaves the
      // stop uncompleted, so the intro dialogue replays on re-approach.
      const sourceStopId = state.pendingUnlockStopId
      let completedStopIds = state.completedStopIds
      if (sourceStopId && !completedStopIds.has(sourceStopId)) {
        const next = new Set(completedStopIds)
        next.add(sourceStopId)
        completedStopIds = next
      }
      const completedTaskIds = applyDerivedTaskCompletions(
        completedStopIds,
        state.completedTaskIds,
      )
      emitFreshTaskCompletions(state.completedTaskIds, completedTaskIds)
      const readyId =
        state.pendingReadyQuestId ??
        findFreshlyReadyQuest(unlockedQuestIds, completedTaskIds, state.readyQuestIds)
      return {
        unlockedQuestIds,
        completedStopIds,
        completedTaskIds,
        pendingUnlockQuestId: null,
        pendingUnlockStopId: null,
        pendingReadyQuestId: readyId,
      }
    }),
  dismissUnlock: () =>
    set({ pendingUnlockQuestId: null, pendingUnlockStopId: null }),
  dismissReady: () =>
    set((state) => {
      const questId = state.pendingReadyQuestId
      if (!questId) return state
      const readyQuestIds = state.readyQuestIds.has(questId)
        ? state.readyQuestIds
        : new Set([...state.readyQuestIds, questId])
      return { pendingReadyQuestId: null, readyQuestIds }
    }),
  toggleTask: (questId, taskId) =>
    set((state) => {
      const key = taskKey(questId, taskId)
      const next = new Set(state.completedTaskIds)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      emitFreshTaskCompletions(state.completedTaskIds, next)
      const patch: Partial<GameState> = { completedTaskIds: next }
      const readyId =
        state.pendingReadyQuestId ??
        findFreshlyReadyQuest(state.unlockedQuestIds, next, state.readyQuestIds)
      if (readyId && readyId !== state.pendingReadyQuestId) patch.pendingReadyQuestId = readyId
      return patch
    }),
  completeTask: (questId, taskId) =>
    set((state) => {
      const key = taskKey(questId, taskId)
      if (state.completedTaskIds.has(key)) return state
      const next = new Set(state.completedTaskIds)
      next.add(key)
      emitFreshTaskCompletions(state.completedTaskIds, next)
      const patch: Partial<GameState> = { completedTaskIds: next }
      const readyId =
        state.pendingReadyQuestId ??
        findFreshlyReadyQuest(state.unlockedQuestIds, next, state.readyQuestIds)
      if (readyId && readyId !== state.pendingReadyQuestId) patch.pendingReadyQuestId = readyId
      return patch
    }),
  setArrowKeyMode: (mode) =>
    set((state) => (state.arrowKeyMode === mode ? state : { arrowKeyMode: mode })),
  resetProgress: () =>
    set({
      activeStopId: null,
      completedStopIds: new Set<string>(),
      unlockedQuestIds: [],
      completedTaskIds: new Set<string>(),
      pendingUnlockQuestId: null,
      pendingUnlockStopId: null,
      pendingReadyQuestId: null,
      readyQuestIds: new Set<string>(),
    }),
  reset: () => {
    firstZoneTransition = true
    set({
      activeStopId: null,
      completedStopIds: new Set<string>(),
      activeZone: 'office',
      nearbyRooms: new Set<string>(),
      unlockedQuestIds: [],
      completedTaskIds: new Set<string>(),
      pendingUnlockQuestId: null,
      pendingUnlockStopId: null,
      pendingReadyQuestId: null,
      readyQuestIds: new Set<string>(),
      arrowKeyMode: 'camera',
    })
  },
}))

export const useActiveStopId = () => useGameStore((s) => s.activeStopId)
export const useIsCompleted = (id: string) =>
  useGameStore((s) => s.completedStopIds.has(id))
export const useActiveZone = () => useGameStore((s) => s.activeZone)
export const useNearbyRooms = () => useGameStore((s) => s.nearbyRooms)
export const useIsRoomNearby = (id: string) =>
  useGameStore((s) => s.nearbyRooms.has(id))
export const useIsTaskComplete = (questId: string, taskId: string) =>
  useGameStore((s) => s.completedTaskIds.has(taskKey(questId, taskId)))
export const useArrowKeyMode = () => useGameStore((s) => s.arrowKeyMode)
