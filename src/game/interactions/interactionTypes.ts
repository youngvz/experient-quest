import { INTERACTION_ZONE } from '../constants/gameConstants'

export interface EmployeeProfile {
  id: string
  name: string
  role: string
  blurb?: string
}

export interface ProjectUpdate {
  id: string
  title: string
  status: string
  blurb?: string
}

export interface CompanyEvent {
  id: string
  title: string
  date: string
  blurb?: string
}

export interface DialogueLine {
  // Character id from src/game/characters/characters.ts. The DialogueOverlay
  // uses this to look up the portrait + display name.
  speakerId: string
  // One "screen" of text. Embedded '\n' is rendered as a line break.
  text: string
}

export type StopContent =
  | { type: 'new-hires'; people: EmployeeProfile[] }
  | { type: 'projects'; projects: ProjectUpdate[] }
  | { type: 'events'; events: CompanyEvent[] }
  | { type: 'joke'; setup: string; punchline: string }
  | { type: 'media'; assetId: string; caption?: string }
  | {
      type: 'dialogue'
      script: DialogueLine[]
      // Played on subsequent interactions after `script` has been seen once
      // (i.e. the stop is in `completedStopIds`). If omitted, `script` plays
      // again every time.
      repeatScript?: DialogueLine[]
    }
  // Meeting outcome — text picked at overlay-open time from the given
  // quest's task-completion state. See ContentOverlay.renderStopBody.
  | { type: 'meeting'; questId: string }

export interface PresentationStop {
  id: string
  label: string
  prompt: string
  overlayTitle: string
  intro?: string
  position: [number, number, number]
  facing?: number
  interactionZone: { size: [number, number] }
  content: StopContent
  // If present, the stop is only interactable once the given quest is
  // unlocked. Consulted by InteractionManager via the gating predicate
  // wired up in Player.tsx.
  requiresQuest?: string
  // If present, the given quest is unlocked the first time the player
  // finishes this stop's overlay. Handled by the overlay's close path.
  questUnlock?: string
  // If present, the given quest task is marked complete when this stop's
  // overlay closes. Idempotent — completing an already-checked task is a
  // no-op. Fires whether or not the quest is currently unlocked, so a
  // task completed pre-unlock will read as done the moment the player
  // accepts the quest.
  questTaskComplete?: { questId: string; taskId: string }
}

export const presentationStops: PresentationStop[] = [
  {
    id: 'events-tv',
    label: 'Events Television',
    prompt: 'Press Enter to Start the Meeting',
    overlayTitle: 'Technology Status Meeting',
    position: INTERACTION_ZONE.center,
    interactionZone: { size: INTERACTION_ZONE.size },
    content: { type: 'meeting', questId: 'weekly-status-meeting' },
    requiresQuest: 'weekly-status-meeting',
  },
  {
    id: 'jacquelyn',
    label: 'Jacquelyn',
    prompt: 'Press Enter to talk to Jacquelyn',
    overlayTitle: 'Jacquelyn',
    // Jacquelyn stands on the south sidewalk in front of the 5256 door.
    // Zone spans the sidewalk approach so the prompt fires as the player
    // walks north from spawn toward the building.
    // Zone rect: X ∈ [-13, -6], Z ∈ [21, 30].
    position: [-9.5, 0, 25.5],
    interactionZone: { size: [7, 9] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'jacquelyn',
          text: 'Hey youngvz! I think John was looking for you!',
        },
      ],
    },
  },
  {
    id: 'juan',
    label: 'Juan',
    prompt: 'Press Enter to talk to Juan',
    overlayTitle: 'Juan',
    // Juan stands in TheLab's main lobby near the L's inner corner, in
    // the open floor between the west doorway and the south clusters.
    // Zone rect: X ∈ [-7, +1], Z ∈ [-24, -16].
    position: [-3, 0, -20],
    interactionZone: { size: [8, 8] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'juan',
          text: 'Why did the fried chicken join a band?',
        },
        {
          speakerId: 'juan',
          text: 'Because it had the drumsticks!',
        },
        {
          speakerId: 'youngvz',
          text: "...",
        }
      ],
    },
  },
  {
    id: 'catherine',
    label: 'Catherine',
    prompt: 'Press Enter to talk to Catherine',
    overlayTitle: 'Catherine',
    // Talking to Catherine counts as the "Get Company Updates" task on
    // the weekly-status-meeting quest.
    questTaskComplete: {
      questId: 'weekly-status-meeting',
      taskId: 'company-updates',
    },
    // Catherine stands on TheStation's main floor, east of the west-side
    // workstations. Zone covers her approach from the west (glass) door.
    // Zone rect: X ∈ [-7, -1], Z ∈ [-53, -47].
    position: [-4, 0, -50],
    interactionZone: { size: [6, 6] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'catherine',
          text: "Hey Youngvz! Here are the updates for the status meeting.",
        },
        {
          speakerId: 'youngvz',
          text: "Thanks Catherine! John will be happy to see these.",
        }
      ],
    },
  },
  {
    id: 'sarah',
    label: 'Sarah',
    prompt: 'Press Enter to talk to Sarah',
    overlayTitle: 'Sarah',
    // Sarah hangs out near The Bakery's kitchen table, in the open floor
    // between the desk clusters and the sink cabinets. Zone covers her
    // approach from the west corridor door and the desk area.
    // Zone rect: X ∈ [+1, +9], Z ∈ [+15, +21].
    position: [5, 0, 18],
    interactionZone: { size: [8, 6] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'sarah',
          text: "I hate standing here trying to think of a good watercooler joke.",
        },
        {
          speakerId: 'youngvz',
          text: "...",
        }
      ],
    },
  },
  {
    id: 'tenant',
    label: 'Tenant',
    prompt: 'Press Enter to talk to Tenant',
    overlayTitle: 'Tenant',
    // Tenant stands in front of the north-wall whiteboard, facing it.
    // Zone covers the north half of TheLibrary so the prompt fires as
    // the player approaches from the corridor doorway.
    // Zone rect: X ∈ [-18, -13], Z ∈ [-22, -14].
    position: [-15.5, 0, -18],
    interactionZone: { size: [5, 8] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'tenant',
          text: 'Of all the inventions in the last 100 years...',
        },
        {
          speakerId: 'tenant',
          text: 'the whiteboard has to be the most re-MARKable.',
        },
        {
          speakerId: 'youngvz',
          text: "...",
        }
      ],
    },
  },
  {
    id: 'bakery-laptop',
    label: 'Laptop',
    prompt: 'Press Enter to use the laptop',
    overlayTitle: 'Laptop',
    questTaskComplete: {
      questId: 'weekly-status-meeting',
      taskId: 'download-demo',
    },
    // The NW desk laptop in The Bakery (desk at [-6.5, 10], sitter chair on
    // the west side). Zone covers the west approach to the desk so the
    // prompt fires as the player walks up to the chair.
    // Zone rect: X ∈ [-9, -5.5], Z ∈ [8.5, 11.5].
    position: [-7.25, 0, 10],
    interactionZone: { size: [3.5, 3] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'youngvz',
          text: 'Alright, I just need to download\nthe demo from OneDrive...',
        },
      ],
    },
  },
  {
    id: 'distasi',
    label: 'Distasi',
    prompt: 'Press Enter to talk to Distasi',
    overlayTitle: 'Distasi',
    questUnlock: 'weekly-status-meeting',
    // Zone extends beyond the pocket into the central corridor and the west
    // end of the east corridor so the prompt fires as soon as the player
    // approaches, not only once fully inside the pocket.
    // Zone rect: X ∈ [-13, -3], Z ∈ [-17, -9] — spans the pocket footprint
    // plus a 3 m entry apron on the west and 2 m south into the east corridor.
    position: [-8, 0, -13],
    interactionZone: { size: [10, 8] },
    content: {
      type: 'dialogue',
      script: [
        {
          speakerId: 'distasi',
          text: "Youngvz!! So glad you're here.\nWe need you to run this week's\nstatus meeting ASAP!",
        },
        {
          speakerId: 'youngvz',
          text: "You got it John!",
        },
        {
          speakerId: 'distasi',
          text: "Don't forget the joke of the week!!",
        },
        {
          speakerId: 'distasi',
          text: "Your performance review\ndepends on it!",
        },
        {
          speakerId: 'youngvz',
          text: "...",
        },
      ],
      repeatScript: [
        {
          speakerId: 'distasi',
          text: "What are you waiting for?!",
        },
        {
          speakerId: 'distasi',
          text: "We need to leave for Hopstix\nat 12pm!!",
        },
      ],
    },
  },
]

export function findStop(id: string): PresentationStop | null {
  return presentationStops.find((stop) => stop.id === id) ?? null
}
