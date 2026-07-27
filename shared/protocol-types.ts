// Wire message types shared between the game client (src/game/net/) and
// the multiplayer server (server/src/). Kept as plain data — msgpack
// encodes/decodes these as-is, no classes. See server/src/protocol.ts
// for the encode/decode helpers.

// Numeric type tags keep the wire small and the message router a plain
// integer switch on both ends. Add new tags at the end; don't reorder.
export const MSG = {
  HELLO: 1,
  INPUT: 2,
  WELCOME: 10,
  NAME_REJECTED: 11,
  SNAPSHOT: 12,
  PLAYER_LEFT: 13,
} as const

export type MsgTag = (typeof MSG)[keyof typeof MSG]

// One-shot action state a client can be in this tick. Mirrors the
// action union in Player.tsx (idle=none / roll / wave). Serialized as
// a single byte on the wire.
export const ACTION = {
  NONE: 0,
  ROLL: 1,
  WAVE: 2,
} as const

export type ActionKind = (typeof ACTION)[keyof typeof ACTION]

// -----------------------------------------------------------------------
// Client → Server
// -----------------------------------------------------------------------

// Sent once immediately after the WebSocket opens. Server replies with
// WELCOME or NAME_REJECTED.
export interface HelloMsg {
  t: typeof MSG.HELLO
  name: string
  characterId: string
}

// Sent 20×/sec from the client's simulation loop. Server clamps for
// speed sanity, otherwise trusts the client's position.
export interface InputMsg {
  t: typeof MSG.INPUT
  // XZ world position (Y is always floor for gameplay).
  x: number
  z: number
  // Facing yaw (radians, atan2(vx, vz) — same convention as Player.tsx).
  yaw: number
  // Horizontal velocity components — server uses magnitude for sanity
  // check; clients use it to pick idle/walk/run animation weights.
  vx: number
  vz: number
  // Current one-shot action; ACTION.NONE when running base locomotion.
  action: ActionKind
  // Seconds remaining on the one-shot action (0 when action=NONE).
  // Clients use this to decide whether to (re)start a clip on a peer
  // that just came into AOI mid-action.
  actionRemaining: number
  // Player's current zone id. Used by the server's AOI filter to decide
  // which peers each client hears about (same or adjacent zone).
  activeZone: string
}

export type ClientMessage = HelloMsg | InputMsg

// -----------------------------------------------------------------------
// Server → Client
// -----------------------------------------------------------------------

// Successful join. Client stores sessionId and starts publishing INPUTs
// at tickRate Hz (fixed 20 for MVP; sent for forward-compat).
export interface WelcomeMsg {
  t: typeof MSG.WELCOME
  sessionId: string
  tickRate: number
}

// Join failed (name collision, malformed hello, etc). Client shows the
// character-select modal again with the reason.
export interface NameRejectedMsg {
  t: typeof MSG.NAME_REJECTED
  reason: string
}

// One remote player's authoritative-ish state at the last server tick.
// Position/velocity/action are echoed straight from the peer's INPUT.
export interface SnapshotPlayer {
  id: string
  name: string
  characterId: string
  x: number
  z: number
  yaw: number
  vx: number
  vz: number
  action: ActionKind
  actionRemaining: number
}

// Fanned out at 20Hz to each connected client. `players` is already
// AOI-filtered on the server, so clients render everything they get.
// Own-player is NOT included in their own snapshot.
export interface SnapshotMsg {
  t: typeof MSG.SNAPSHOT
  // Server monotonic tick counter — clients can use this to detect
  // reordered frames if the transport ever exposes it.
  tick: number
  players: SnapshotPlayer[]
}

// Fired once when a peer disconnects OR leaves the current AOI. Clients
// treat both the same way: unmount that RemotePlayer.
export interface PlayerLeftMsg {
  t: typeof MSG.PLAYER_LEFT
  id: string
}

export type ServerMessage =
  | WelcomeMsg
  | NameRejectedMsg
  | SnapshotMsg
  | PlayerLeftMsg

// -----------------------------------------------------------------------
// Runtime constants baked into the protocol contract.
// -----------------------------------------------------------------------

export const PROTOCOL = {
  // Snapshot broadcast rate. Matches the client's uplink cadence.
  TICK_HZ: 20,
  // Max horizontal speed the server will accept. STANDING_ROLL_SPEED
  // in Player.tsx is 6; leave a small margin for numerical noise.
  MAX_SPEED: 8,
  // Reject any INPUT whose XZ position jumped more than this from the
  // previous frame (units per tick @ 20Hz). ~10 units at 20Hz = 200
  // units/sec = well above legitimate gameplay speeds.
  MAX_JUMP_PER_TICK: 10,
  // Case-insensitive display-name bounds.
  NAME_MIN_LEN: 1,
  NAME_MAX_LEN: 24,
  // Uplink budget per client (INPUT messages / sec). Anything above
  // this is dropped and logged; sustained overrun disconnects the peer.
  MAX_INPUT_HZ: 30,
} as const
