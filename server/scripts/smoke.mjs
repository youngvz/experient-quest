// Two-client protocol round-trip. Boots the compiled server, opens
// two WebSocket clients, hellos each, exchanges a few INPUTs, and
// asserts each client sees the other in a SNAPSHOT. Exit 0 on success,
// non-zero on failure. Run: `node scripts/smoke.mjs` (after `npm run build`).

import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { WebSocket } from 'ws'
import { encode, decode } from '@msgpack/msgpack'

const PORT = 18080
const URL = `ws://127.0.0.1:${PORT}`

// Message tags — must match shared/protocol-types.ts.
const MSG = {
  HELLO: 1,
  INPUT: 2,
  WELCOME: 10,
  NAME_REJECTED: 11,
  SNAPSHOT: 12,
  PLAYER_LEFT: 13,
}
const ACTION = { NONE: 0, ROLL: 1, WAVE: 2 }

const server = spawn(
  process.execPath,
  ['dist/server/src/index.js'],
  {
    env: { ...process.env, PORT: String(PORT), LOG_LEVEL: 'warn' },
    stdio: ['ignore', 'inherit', 'inherit'],
  },
)

let failed = false
function fail(msg) {
  console.error(`FAIL: ${msg}`)
  failed = true
}

async function main() {
  // Wait for the port to open.
  await waitForListen(PORT, 3000)

  const a = openClient('alice', 'youngvz')
  const b = openClient('bob', 'distasi')

  await Promise.all([a.welcome, b.welcome])
  console.log(`alice sessionId = ${a.sessionId}, bob = ${b.sessionId}`)

  // Send a few INPUTs from both, spaced so the server ticks at least once.
  for (let i = 0; i < 8; i++) {
    a.socket.send(encode({
      t: MSG.INPUT,
      x: 1 + i * 0.1, z: 2 + i * 0.1, yaw: 0, vx: 1, vz: 0,
      action: ACTION.NONE, actionRemaining: 0, activeZone: 'office',
    }))
    b.socket.send(encode({
      t: MSG.INPUT,
      x: -1 - i * 0.1, z: -2 - i * 0.1, yaw: Math.PI, vx: -1, vz: 0,
      action: ACTION.NONE, actionRemaining: 0, activeZone: 'office',
    }))
    await delay(60)
  }

  // Give the tick loop one more window.
  await delay(200)

  if (!a.sawSnapshotContaining(b.sessionId)) {
    fail(`alice never saw bob (${b.sessionId}) in a snapshot`)
  }
  if (!b.sawSnapshotContaining(a.sessionId)) {
    fail(`bob never saw alice (${a.sessionId}) in a snapshot`)
  }

  // Close alice, expect bob to receive PLAYER_LEFT.
  a.socket.close()
  await delay(300)
  if (!b.sawPlayerLeft(a.sessionId)) {
    fail(`bob never received PLAYER_LEFT for alice (${a.sessionId})`)
  }

  b.socket.close()
}

function openClient(name, characterId) {
  const socket = new WebSocket(URL)
  const state = {
    socket,
    sessionId: null,
    snapshots: [],
    leftIds: new Set(),
    welcome: null,
  }
  state.welcome = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${name} welcome timeout`)), 3000)
    socket.on('open', () => {
      socket.send(encode({ t: MSG.HELLO, name, characterId }))
    })
    socket.on('message', (buf) => {
      const msg = decode(buf)
      if (msg.t === MSG.WELCOME) {
        state.sessionId = msg.sessionId
        clearTimeout(timer)
        resolve()
      } else if (msg.t === MSG.SNAPSHOT) {
        state.snapshots.push(msg)
      } else if (msg.t === MSG.PLAYER_LEFT) {
        state.leftIds.add(msg.id)
      } else if (msg.t === MSG.NAME_REJECTED) {
        clearTimeout(timer)
        reject(new Error(`${name} name rejected: ${msg.reason}`))
      }
    })
    socket.on('error', (err) => {
      clearTimeout(timer)
      reject(new Error(`${name} socket error: ${err.message}`))
    })
  })
  state.sawSnapshotContaining = (peerId) =>
    state.snapshots.some((s) => s.players.some((p) => p.id === peerId))
  state.sawPlayerLeft = (peerId) => state.leftIds.has(peerId)
  return state
}

async function waitForListen(port, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const probe = new WebSocket(`ws://127.0.0.1:${port}`)
      await new Promise((resolve, reject) => {
        probe.on('open', () => { probe.close(); resolve() })
        probe.on('error', reject)
      })
      return
    } catch {
      await delay(100)
    }
  }
  throw new Error(`server did not start listening on ${port}`)
}

try {
  await main()
} catch (err) {
  fail(err.message)
} finally {
  server.kill('SIGTERM')
  await delay(200)
  if (failed) process.exit(1)
  console.log('OK: smoke test passed')
  process.exit(0)
}
