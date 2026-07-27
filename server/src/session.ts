// Sessions and the collection that holds them. One PlayerState per
// connected WebSocket; the SessionManager enforces name uniqueness,
// input-rate limits, and speed/teleport sanity clamps.
//
// Nothing here talks to `ws` directly — the WebSocket is stored so
// index.ts can send to it, but the socket's message plumbing lives in
// index.ts. This file is pure state + policy.

import type { WebSocket } from 'ws'
import {
  ACTION,
  PROTOCOL,
  type ActionKind,
  type InputMsg,
} from '../../shared/protocol-types.js'

export interface PlayerState {
  id: string
  name: string
  nameKey: string           // lower-cased, used for uniqueness check
  characterId: string
  socket: WebSocket
  // Last known transform / animation state (echoed to peers via snapshots).
  x: number
  z: number
  yaw: number
  vx: number
  vz: number
  action: ActionKind
  actionRemaining: number
  activeZone: string
  // Rate-limit + sanity bookkeeping.
  lastInputMs: number       // monotonic ms of last accepted INPUT
  inputWindowStartMs: number
  inputCountInWindow: number
  // Set after HELLO succeeds. Before that we ignore INPUTs.
  ready: boolean
  connectedAt: number
}

export interface ApplyInputResult {
  ok: true
  // The zone the player was in at the moment we accepted this input.
  // Used by the AOI filter on the next broadcast.
  activeZone: string
}

export interface ApplyInputReject {
  ok: false
  reason: string
  // If true, the offense is fatal (name-cheat / spam) and the caller
  // should close the socket. Otherwise the frame is dropped silently.
  fatal: boolean
}

// One second window; MAX_INPUT_HZ enforces the ceiling.
const INPUT_WINDOW_MS = 1000

export class SessionManager {
  private readonly players = new Map<string, PlayerState>()
  private readonly nameKeys = new Set<string>()
  private nextIdSeq = 0

  size(): number {
    return this.players.size
  }

  values(): IterableIterator<PlayerState> {
    return this.players.values()
  }

  get(id: string): PlayerState | undefined {
    return this.players.get(id)
  }

  // Register a new session iff the (lower-cased) name is not in use.
  // Returns the PlayerState on success, an error reason on failure.
  add(
    socket: WebSocket,
    name: string,
    characterId: string,
    now: number,
  ): { ok: true; player: PlayerState } | { ok: false; reason: string } {
    const nameKey = name.toLowerCase()
    if (this.nameKeys.has(nameKey)) {
      return { ok: false, reason: `Name "${name}" is already in use` }
    }
    const id = this.mintId()
    const player: PlayerState = {
      id,
      name,
      nameKey,
      characterId,
      socket,
      x: 0,
      z: 0,
      yaw: 0,
      vx: 0,
      vz: 0,
      action: ACTION.NONE,
      actionRemaining: 0,
      activeZone: 'office',
      lastInputMs: now,
      inputWindowStartMs: now,
      inputCountInWindow: 0,
      ready: true,
      connectedAt: now,
    }
    this.players.set(id, player)
    this.nameKeys.add(nameKey)
    return { ok: true, player }
  }

  remove(id: string): PlayerState | undefined {
    const player = this.players.get(id)
    if (!player) return undefined
    this.players.delete(id)
    this.nameKeys.delete(player.nameKey)
    return player
  }

  // Accept an INPUT frame from `player` if it passes rate + sanity
  // clamps. Mutates the PlayerState in place on success.
  applyInput(
    player: PlayerState,
    input: InputMsg,
    now: number,
  ): ApplyInputResult | ApplyInputReject {
    // Rate limit — sliding 1s window. Sustained overrun is fatal so
    // spammy clients get bounced instead of soaking CPU.
    if (now - player.inputWindowStartMs >= INPUT_WINDOW_MS) {
      player.inputWindowStartMs = now
      player.inputCountInWindow = 0
    }
    player.inputCountInWindow++
    if (player.inputCountInWindow > PROTOCOL.MAX_INPUT_HZ) {
      return {
        ok: false,
        reason: `input rate exceeded ${PROTOCOL.MAX_INPUT_HZ}/s`,
        fatal: true,
      }
    }

    // Speed sanity. Reject silently — a legitimate client should never
    // trip this, but a bad frame during a hitch shouldn't drop the peer.
    const speedSq = input.vx * input.vx + input.vz * input.vz
    if (speedSq > PROTOCOL.MAX_SPEED * PROTOCOL.MAX_SPEED) {
      return { ok: false, reason: 'speed clamp', fatal: false }
    }

    // Teleport clamp — first accepted INPUT for a session gets a free
    // pass so we can adopt whatever spawn position the client picked.
    if (player.lastInputMs !== player.connectedAt) {
      const dx = input.x - player.x
      const dz = input.z - player.z
      if (dx * dx + dz * dz > PROTOCOL.MAX_JUMP_PER_TICK * PROTOCOL.MAX_JUMP_PER_TICK) {
        return { ok: false, reason: 'position jump clamp', fatal: false }
      }
    }

    player.x = input.x
    player.z = input.z
    player.yaw = input.yaw
    player.vx = input.vx
    player.vz = input.vz
    player.action = input.action
    player.actionRemaining = input.actionRemaining
    player.activeZone = input.activeZone
    player.lastInputMs = now
    return { ok: true, activeZone: input.activeZone }
  }

  private mintId(): string {
    // Short random-ish id (readable in logs, no crypto strength needed;
    // uniqueness is enforced by the Map key). Prefix so log greps for
    // "p_" find every player id.
    this.nextIdSeq = (this.nextIdSeq + 1) & 0xffffff
    return `p_${this.nextIdSeq.toString(36).padStart(4, '0')}_${randomToken()}`
  }
}

function randomToken(): string {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .slice(1)
}
