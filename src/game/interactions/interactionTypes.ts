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
  // If present, the given quest is unlocked the first time the player
  // finishes this stop's overlay. Handled by the overlay's close path.
  questUnlock?: string
}

export const presentationStops: PresentationStop[] = [
  {
    id: 'events-tv',
    label: 'Events Television',
    prompt: 'Press E to view meeting information',
    overlayTitle: 'Technology Status Meeting',
    intro:
      'Welcome to the interactive office prototype.\n\n' +
      'This screen will eventually display upcoming events, team updates, new hires, and other meeting content.',
    position: INTERACTION_ZONE.center,
    interactionZone: { size: INTERACTION_ZONE.size },
    content: { type: 'events', events: [] },
  },
  {
    id: 'jacquelyn',
    label: 'Jacquelyn',
    prompt: 'Press F to talk to Jacquelyn',
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
    id: 'distasi',
    label: 'Distasi',
    prompt: 'Press F to talk to Distasi',
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
