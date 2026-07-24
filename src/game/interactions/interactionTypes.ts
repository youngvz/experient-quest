export type InteractionId = 'events-tv'

export interface InteractionDefinition {
  id: InteractionId
  label: string
  prompt: string
  contentTitle: string
  contentBody: string
}

export const officeInteractions: Record<InteractionId, InteractionDefinition> = {
  'events-tv': {
    id: 'events-tv',
    label: 'Events Television',
    prompt: 'Press E to view meeting information',
    contentTitle: 'Technology Status Meeting',
    contentBody:
      'Welcome to the interactive office prototype.\n\n' +
      'This screen will eventually display upcoming events, team updates, new hires, and other meeting content.',
  },
}

// Future content-block model (documented extension point — not yet consumed):
// export type ContentBlock =
//   | { type: 'text'; value: string }
//   | { type: 'image'; src: string; alt: string }
//   | { type: 'list'; items: string[] }
//   | { type: 'video'; src: string }
//   | { type: 'action'; label: string; actionId: string }
