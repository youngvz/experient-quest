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
]

export function findStop(id: string): PresentationStop | null {
  return presentationStops.find((stop) => stop.id === id) ?? null
}
