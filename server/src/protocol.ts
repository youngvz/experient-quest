// msgpack encode/decode + runtime shape checks for inbound frames.
// Outbound encoding trusts our own code and skips validation.

import { decode, encode } from '@msgpack/msgpack'
import {
  ACTION,
  MSG,
  PROTOCOL,
  type ActionKind,
  type ClientMessage,
  type HelloMsg,
  type InputMsg,
  type ServerMessage,
} from '../../shared/protocol-types.js'

// -----------------------------------------------------------------------
// Encode
// -----------------------------------------------------------------------

export function encodeServerMessage(msg: ServerMessage): Uint8Array {
  return encode(msg)
}

// -----------------------------------------------------------------------
// Decode + validate
// -----------------------------------------------------------------------

// Any inbound frame that fails validation resolves to an error string
// instead of throwing — the socket handler decides what to do (close
// with 1008, log-and-drop, etc.).
export type DecodeResult =
  | { ok: true; msg: ClientMessage }
  | { ok: false; reason: string }

export function decodeClientMessage(buf: ArrayBufferLike | Uint8Array): DecodeResult {
  let raw: unknown
  try {
    raw = decode(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
  } catch (e) {
    return { ok: false, reason: `msgpack decode failed: ${(e as Error).message}` }
  }
  if (!isPlainObject(raw)) return { ok: false, reason: 'frame is not an object' }
  const tag = (raw as { t?: unknown }).t
  if (typeof tag !== 'number') return { ok: false, reason: 'missing t (message tag)' }
  switch (tag) {
    case MSG.HELLO:
      return validateHello(raw)
    case MSG.INPUT:
      return validateInput(raw)
    default:
      return { ok: false, reason: `unknown message tag: ${tag}` }
  }
}

function validateHello(raw: object): DecodeResult {
  const r = raw as Record<string, unknown>
  if (typeof r.name !== 'string') return { ok: false, reason: 'hello.name must be a string' }
  const name = r.name.trim()
  if (
    name.length < PROTOCOL.NAME_MIN_LEN ||
    name.length > PROTOCOL.NAME_MAX_LEN
  ) {
    return {
      ok: false,
      reason: `hello.name length must be ${PROTOCOL.NAME_MIN_LEN}–${PROTOCOL.NAME_MAX_LEN}`,
    }
  }
  if (typeof r.characterId !== 'string' || r.characterId.length === 0) {
    return { ok: false, reason: 'hello.characterId must be a non-empty string' }
  }
  const msg: HelloMsg = {
    t: MSG.HELLO,
    name,
    characterId: r.characterId,
  }
  return { ok: true, msg }
}

function validateInput(raw: object): DecodeResult {
  const r = raw as Record<string, unknown>
  for (const key of ['x', 'z', 'yaw', 'vx', 'vz', 'actionRemaining'] as const) {
    if (typeof r[key] !== 'number' || !Number.isFinite(r[key] as number)) {
      return { ok: false, reason: `input.${key} must be a finite number` }
    }
  }
  const action = r.action
  if (
    typeof action !== 'number' ||
    !isKnownAction(action)
  ) {
    return { ok: false, reason: `input.action must be one of ${Object.values(ACTION).join(', ')}` }
  }
  if (typeof r.activeZone !== 'string' || r.activeZone.length === 0) {
    return { ok: false, reason: 'input.activeZone must be a non-empty string' }
  }
  const msg: InputMsg = {
    t: MSG.INPUT,
    x: r.x as number,
    z: r.z as number,
    yaw: r.yaw as number,
    vx: r.vx as number,
    vz: r.vz as number,
    action,
    actionRemaining: r.actionRemaining as number,
    activeZone: r.activeZone,
  }
  return { ok: true, msg }
}

function isKnownAction(v: number): v is ActionKind {
  return v === ACTION.NONE || v === ACTION.ROLL || v === ACTION.WAVE
}

function isPlainObject(v: unknown): v is object {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
