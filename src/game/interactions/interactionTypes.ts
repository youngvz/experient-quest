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

export type StopContent =
  | { type: 'new-hires'; people: EmployeeProfile[] }
  | { type: 'projects'; projects: ProjectUpdate[] }
  | { type: 'events'; events: CompanyEvent[] }
  | { type: 'joke'; setup: string; punchline: string }
  | { type: 'media'; assetId: string; caption?: string }

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
    intro: "Hey — welcome to the office. Great to meet you.",
    // Zone extends beyond the pocket into the west corridor and the west
    // end of the east corridor so the prompt fires as soon as the player
    // approaches, not only once fully inside the pocket.
    // Zone rect: X ∈ [-13, -3], Z ∈ [-17, -9] — spans the pocket footprint
    // plus a 3 m entry apron on the west and 2 m south into the east corridor.
    position: [-8, 0, -13],
    interactionZone: { size: [10, 8] },
    content: { type: 'events', events: [] },
  },
]

export function findStop(id: string): PresentationStop | null {
  return presentationStops.find((stop) => stop.id === id) ?? null
}
