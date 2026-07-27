// Multiplayer WebSocket server entrypoint. Listens on PORT (default
// 8080), routes msgpack-encoded frames from shared/protocol-types.ts,
// and broadcasts an AOI-filtered snapshot to every ready session at
// PROTOCOL.TICK_HZ.
//
// Keep this file boring: any non-trivial logic belongs in session.ts,
// protocol.ts, or aoi.ts.

import { WebSocketServer, type WebSocket } from 'ws'
import { pino } from 'pino'
import {
  MSG,
  PROTOCOL,
  type PlayerLeftMsg,
  type SnapshotMsg,
  type SnapshotPlayer,
  type WelcomeMsg,
  type NameRejectedMsg,
} from '../../shared/protocol-types.js'
import { decodeClientMessage, encodeServerMessage } from './protocol.js'
import { isVisible } from './aoi.js'
import { SessionManager, type PlayerState } from './session.js'

const PORT = Number(process.env.PORT ?? 8080)
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info'
const TICK_MS = Math.round(1000 / PROTOCOL.TICK_HZ)

const log = pino({ level: LOG_LEVEL })
const sessions = new SessionManager()

// Peers each ready session could see on the previous tick. On the next
// tick, if a peer drops out (disconnect OR walks out of AOI), we send
// PLAYER_LEFT once. Map<viewerId, Set<peerId>>.
const lastVisible = new Map<string, Set<string>>()

// Monotonic tick counter included in every SNAPSHOT frame. Wraps at
// 2^32 which is fine for jitter-detection purposes.
let tick = 0

const wss = new WebSocketServer({ port: PORT, perMessageDeflate: false })

wss.on('listening', () => {
  log.info({ port: PORT, tickHz: PROTOCOL.TICK_HZ }, 'server listening')
})

wss.on('connection', (socket, req) => {
  const remote = req.socket.remoteAddress ?? 'unknown'
  log.debug({ remote }, 'socket connected')

  // We don't know the session id until HELLO succeeds. This closure
  // captures the "current" id once we do.
  let sessionId: string | null = null

  socket.on('message', (data, isBinary) => {
    if (!isBinary) {
      log.warn({ sessionId }, 'received text frame; closing')
      socket.close(1003, 'binary frames only')
      return
    }
    const buf = data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer)
    const result = decodeClientMessage(buf)
    if (!result.ok) {
      log.warn({ sessionId, reason: result.reason }, 'decode failed')
      socket.close(1008, 'malformed frame')
      return
    }
    const msg = result.msg
    const now = Date.now()

    if (msg.t === MSG.HELLO) {
      if (sessionId !== null) {
        log.warn({ sessionId }, 'duplicate hello; closing')
        socket.close(1008, 'duplicate hello')
        return
      }
      const outcome = sessions.add(socket, msg.name, msg.characterId, now)
      if (!outcome.ok) {
        const rejected: NameRejectedMsg = {
          t: MSG.NAME_REJECTED,
          reason: outcome.reason,
        }
        socket.send(encodeServerMessage(rejected))
        socket.close(1000, 'name rejected')
        log.info({ remote, reason: outcome.reason }, 'hello rejected')
        return
      }
      sessionId = outcome.player.id
      const welcome: WelcomeMsg = {
        t: MSG.WELCOME,
        sessionId,
        tickRate: PROTOCOL.TICK_HZ,
      }
      socket.send(encodeServerMessage(welcome))
      log.info(
        {
          sessionId,
          name: outcome.player.name,
          characterId: outcome.player.characterId,
          count: sessions.size(),
        },
        'session joined',
      )
      return
    }

    // Everything after HELLO requires a live session.
    if (sessionId === null) {
      log.warn({ remote }, 'input before hello; closing')
      socket.close(1008, 'hello required first')
      return
    }
    const player = sessions.get(sessionId)
    if (!player) {
      // Race: session was already dropped by a prior fatal reject.
      socket.close(1011, 'session missing')
      return
    }

    if (msg.t === MSG.INPUT) {
      const outcome = sessions.applyInput(player, msg, now)
      if (!outcome.ok) {
        if (outcome.fatal) {
          log.warn({ sessionId, reason: outcome.reason }, 'input fatal reject')
          socket.close(1008, outcome.reason)
        } else {
          log.debug({ sessionId, reason: outcome.reason }, 'input silently dropped')
        }
      }
    }
  })

  socket.on('close', (code, reason) => {
    if (sessionId !== null) {
      sessions.remove(sessionId)
      lastVisible.delete(sessionId)
      log.info(
        { sessionId, code, reason: reason.toString(), count: sessions.size() },
        'session left',
      )
    } else {
      log.debug({ remote, code }, 'socket closed before hello')
    }
  })

  socket.on('error', (err) => {
    log.warn({ sessionId, err: err.message }, 'socket error')
  })
})

// -----------------------------------------------------------------------
// Tick loop: fan out AOI-filtered snapshots + PLAYER_LEFT diffs.
// -----------------------------------------------------------------------

const timer = setInterval(broadcastTick, TICK_MS)
// setInterval keeps the process alive; unref not needed since we want
// the server to run until it's SIGTERM'd.

function broadcastTick(): void {
  if (sessions.size() === 0) return
  tick = (tick + 1) >>> 0

  // Pre-encode every peer once; each viewer's snapshot references
  // shared SnapshotPlayer objects, so the msgpack encoder gets to
  // dedupe strings within a single frame (msgpack doesn't preserve
  // ref-identity, but we still save the JS-side allocation cost).
  const peers: SnapshotPlayer[] = []
  for (const p of sessions.values()) {
    peers.push({
      id: p.id,
      name: p.name,
      characterId: p.characterId,
      x: p.x,
      z: p.z,
      yaw: p.yaw,
      vx: p.vx,
      vz: p.vz,
      action: p.action,
      actionRemaining: p.actionRemaining,
    })
  }

  for (const viewer of sessions.values()) {
    if (viewer.socket.readyState !== viewer.socket.OPEN) continue
    const visible: SnapshotPlayer[] = []
    const currentIds = new Set<string>()
    for (const peer of peers) {
      if (peer.id === viewer.id) continue
      const peerState = sessions.get(peer.id)
      if (!peerState) continue
      if (!isVisible(viewer.activeZone, peerState.activeZone)) continue
      visible.push(peer)
      currentIds.add(peer.id)
    }
    // Emit PLAYER_LEFT for anyone the viewer saw last tick but doesn't
    // this tick. Handles both hard disconnect and walk-out-of-AOI.
    const prev = lastVisible.get(viewer.id)
    if (prev) {
      for (const prevId of prev) {
        if (!currentIds.has(prevId)) sendPlayerLeft(viewer, prevId)
      }
    }
    lastVisible.set(viewer.id, currentIds)

    const snap: SnapshotMsg = {
      t: MSG.SNAPSHOT,
      tick,
      players: visible,
    }
    trySend(viewer, encodeServerMessage(snap))
  }
}

function sendPlayerLeft(viewer: PlayerState, id: string): void {
  const msg: PlayerLeftMsg = { t: MSG.PLAYER_LEFT, id }
  trySend(viewer, encodeServerMessage(msg))
}

function trySend(viewer: PlayerState, payload: Uint8Array): void {
  const socket = viewer.socket
  if (socket.readyState !== socket.OPEN) return
  // Backpressure guard: if the outbound queue swells past ~200 KB,
  // something's wrong (frozen client, network stall). Drop the peer
  // rather than let the buffer grow unbounded.
  if (socket.bufferedAmount > 200_000) {
    log.warn(
      { sessionId: viewer.id, buffered: socket.bufferedAmount },
      'closing socket for backpressure',
    )
    socket.close(1011, 'backpressure')
    return
  }
  socket.send(payload)
}

// -----------------------------------------------------------------------
// Graceful shutdown.
// -----------------------------------------------------------------------

function shutdown(signal: NodeJS.Signals): void {
  log.info({ signal }, 'shutting down')
  clearInterval(timer)
  for (const p of sessions.values()) {
    try {
      p.socket.close(1001, 'server shutting down')
    } catch {
      /* ignore */
    }
  }
  wss.close(() => process.exit(0))
  // Hard-exit if clean shutdown takes too long.
  setTimeout(() => process.exit(1), 3000).unref()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Silence WebSocketServer heartbeat spam on unhandled errors that
// otherwise flag `unhandledRejection` in Docker logs.
process.on('unhandledRejection', (err) => {
  log.error({ err }, 'unhandledRejection')
})
