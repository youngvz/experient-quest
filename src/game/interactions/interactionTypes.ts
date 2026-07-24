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
    id: 'employee-distasi',
    label: 'Distasi',
    prompt: 'Press F to talk to Distasi',
    overlayTitle: 'Distasi',
    // Zone extends beyond the pocket into the west corridor and the west
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
          text: "Youngvz!! So glad you're here,\nwe need you to run this week's\nstatus meeting ASAP!",
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
