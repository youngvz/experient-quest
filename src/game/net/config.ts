// Resolves the WebSocket URL the client should connect to. Reads
// VITE_MMO_URL from the build env (set by the GH Pages workflow, or a
// local .env). Falls back to ws://localhost:8080 for `npm run dev`.
//
// NetworkClient (added when the client wiring lands) will call
// getMmoUrl() at socket-open time — no other module should read
// import.meta.env directly.

const DEFAULT_LOCAL_URL = 'ws://localhost:8080'

export function getMmoUrl(): string {
  // Vite inlines import.meta.env.* at build time. If the workflow
  // omitted VITE_MMO_URL, the string here is `undefined` (literally),
  // so treat any non-string falsy value as "use the local default".
  const configured = import.meta.env.VITE_MMO_URL
  if (typeof configured === 'string' && configured.length > 0) {
    return configured
  }
  return DEFAULT_LOCAL_URL
}
