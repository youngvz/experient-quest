import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import {
  BRANCH_DOORS,
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_LOOK_HEIGHT,
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_MIN,
  CAMERA_ZOOM_RATE,
  KEY_LOOK_SPEED,
  PLAYER_HEIGHT,
  PLAYER_MODEL_SCALE,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_SPAWN,
  PLAYER_SPAWN_FACING,
  PLAYER_SPEED,
  CENTRAL_CORRIDOR,
  ROOM_DEPTH,
  THE_BAKERY,
  THE_BOARDROOM,
  THE_LAB,
  THE_STATION,
} from '../constants/gameConstants'
import { CHARACTERS } from '../characters/characters'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useMouseLook } from '../../hooks/useMouseLook'
import { gameEvents } from '../events/GameEventBus'
import { InteractionManager } from '../interactions/InteractionManager'
import { presentationStops } from '../interactions/interactionTypes'
import { getStopZoneRect } from './interactionZones'
import { useGameStore } from '../state/gameStore'
import { ZoneManager } from '../zones/ZoneManager'

const PLAYER_MODEL_URL = CHARACTERS.youngvz.glbUrl

interface PlayerProps {
  controlsDisabled: boolean
}

function pickClip(clips: THREE.AnimationClip[], patterns: RegExp[]): THREE.AnimationClip | null {
  for (const re of patterns) {
    const match = clips.find((c) => re.test(c.name))
    if (match) return match
  }
  return null
}

type ActionKind = 'roll' | 'wave'

// One-shot action clips hold movement for their duration. Roll = the model's
// roll clip; horizontal velocity is preserved through the roll so the
// character actually travels instead of playing in place.
const ACTION_HOLD: Record<ActionKind, number> = {
  roll: 0.9,
  wave: 1.6,
}

// Standing-roll speed floor: pressing Space from a standstill still moves the
// player forward (in facing direction) so the roll clip reads right.
const STANDING_ROLL_SPEED = 6

export function Player({ controlsDisabled }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const meshRef = useRef<THREE.Group | null>(null)
  const { camera } = useThree()
  const { state, consumeInteract, consumeRoll, consumeWave } = useKeyboard()
  const { yaw } = useMouseLook()

  // Per-frame action state. Refs (not React state) so useFrame doesn't re-render.
  // rollVx/rollVz are the horizontal velocity carried through a roll —
  // captured at takeoff so the roll covers ground even without held keys.
  const actionRef = useRef<{
    kind: ActionKind | null
    remaining: number
    rollVx: number
    rollVz: number
  }>({
    kind: null,
    remaining: 0,
    rollVx: 0,
    rollVz: 0,
  })

  const cameraTarget = useMemo(() => new THREE.Vector3(), [])
  const cameraDesired = useMemo(() => new THREE.Vector3(), [])
  // Multiplicative zoom scale applied to CAMERA_DISTANCE and CAMERA_HEIGHT.
  // Ref (not state) so useFrame mutations don't re-render.
  const zoomRef = useRef(1)

  const gltf = useGLTF(PLAYER_MODEL_URL)
  const modelFit = useMemo(() => {
    // SkeletonUtils.clone rebinds skinned meshes to a cloned skeleton;
    // Object3D.clone() would leave them pointing at the original.
    const clone = SkeletonUtils.clone(gltf.scene)
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = false
      }
    })

    // Bound the visible geometry only. Object3D.setFromObject would include
    // skeleton bone tails, which can extend far past the mesh and yield a
    // wildly wrong height.
    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    const meshBox = new THREE.Box3()
    let hasMesh = false
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry) return
      mesh.geometry.computeBoundingBox()
      const geoBox = mesh.geometry.boundingBox
      if (!geoBox) return
      meshBox.copy(geoBox).applyMatrix4(mesh.matrixWorld)
      if (hasMesh) box.union(meshBox)
      else {
        box.copy(meshBox)
        hasMesh = true
      }
    })

    const size = new THREE.Vector3()
    box.getSize(size)
    const autoFit = hasMesh && size.y > 0 ? PLAYER_HEIGHT / size.y : 1
    const scale = autoFit * PLAYER_MODEL_SCALE
    const offsetY = hasMesh ? -box.min.y * scale - PLAYER_HEIGHT / 2 : 0
    return { object: clone, scale, offsetY }
  }, [gltf.scene])

  const { actions, names } = useAnimations(gltf.animations, modelFit.object)
  const clipRefs = useMemo(() => {
    const idle = pickClip(gltf.animations, [/idle/i, /stand/i, /breath/i])
    const walk = pickClip(gltf.animations, [/walk/i, /move/i])
    const run = pickClip(gltf.animations, [/run/i, /sprint/i])
    const roll = pickClip(gltf.animations, [/roll/i, /dodge/i])
    const wave = pickClip(gltf.animations, [/wave/i, /greet/i, /hello/i])
    return {
      idleName: idle?.name ?? null,
      walkName: walk?.name ?? null,
      runName: run?.name ?? null,
      rollName: roll?.name ?? null,
      waveName: wave?.name ?? null,
    }
  }, [gltf.animations])

  useEffect(() => {
    if (import.meta.env.DEV && names.length > 0) {
      console.info('[Player] GLB animation clips:', names)
    }
  }, [names])

  // Initial facing — useFrame only rewrites rotation.y while the player is
  // moving, so without this the mesh starts at the model's default heading.
  useEffect(() => {
    if (meshRef.current) meshRef.current.rotation.y = PLAYER_SPAWN_FACING
  }, [])

  useEffect(() => {
    const { idleName, walkName, runName, rollName, waveName } = clipRefs
    const idle = idleName ? actions[idleName] : null
    const walk = walkName ? actions[walkName] : null
    const run = runName ? actions[runName] : null
    const roll = rollName ? actions[rollName] : null
    const wave = waveName ? actions[waveName] : null
    idle?.reset().setEffectiveWeight(1).play()
    walk?.reset().setEffectiveWeight(0).play()
    run?.reset().setEffectiveWeight(0).play()
    // Action clips stay loaded at 0 weight; useFrame ramps them up on trigger.
    roll?.reset().setEffectiveWeight(0).play()
    wave?.reset().setEffectiveWeight(0).play()
    return () => {
      idle?.stop()
      walk?.stop()
      run?.stop()
      roll?.stop()
      wave?.stop()
    }
  }, [actions, clipRefs])

  const manager = useMemo(() => {
    return new InteractionManager({
      onAvailable: (stop) => {
        if (import.meta.env.DEV) console.info('[interaction] available:', stop.id)
        gameEvents.emit('interaction:available', { stopId: stop.id, prompt: stop.prompt })
      },
      onUnavailable: () => {
        if (import.meta.env.DEV) console.info('[interaction] unavailable')
        gameEvents.emit('interaction:unavailable', undefined)
      },
      onTriggered: (stop) => {
        if (import.meta.env.DEV) console.info('[interaction] triggered:', stop.id)
        gameEvents.emit('interaction:triggered', { stopId: stop.id })
      },
    })
  }, [])

  // Register zones in an effect (not in useMemo) so StrictMode's simulated
  // mount → cleanup → mount cycle re-registers them after the paired
  // clearZones() cleanup. Registering inside useMemo instead permanently
  // empties the manager on fresh load because useMemo isn't re-run after
  // the simulated unmount.
  useEffect(() => {
    for (const stop of presentationStops) {
      manager.registerZone(getStopZoneRect(stop), stop)
    }
    return () => manager.clearZones()
  }, [manager])

  // Zone manager: fires setActiveZone on the game store whenever the player
  // crosses into a new named region. Zones are registered in
  // most-specific-first order so rooms win over their parent corridor.
  const zones = useMemo(() => {
    const setActiveZone = useGameStore.getState().setActiveZone
    const z = new ZoneManager({ fallback: 'office', onChange: setActiveZone })
    // Placeholder branch-door zones — register first so they take priority
    // when the player is inside the branch's activation rect.
    for (const door of BRANCH_DOORS) {
      z.registerZone({ id: door.id, ...door.activationRect })
    }
    // TheLab — first real room off the central corridor. L-shaped, so
    // registered as two rects sharing the same id (west rect + east rect).
    z.registerZone({
      id: 'the-lab',
      minX: THE_LAB.westX,
      maxX: THE_LAB.stepX,
      minZ: THE_LAB.northZ,
      maxZ: THE_LAB.westSouthZ,
    })
    z.registerZone({
      id: 'the-lab',
      minX: THE_LAB.stepX,
      maxX: THE_LAB.eastX,
      minZ: THE_LAB.northZ,
      maxZ: THE_LAB.eastSouthZ,
    })
    // The Boardroom — enclosed sub-room inside The Station. Registered
    // BEFORE The Station so it wins on first-match when the player is
    // inside the Boardroom's rect.
    z.registerZone({
      id: 'the-boardroom',
      minX: THE_BOARDROOM.westX,
      maxX: THE_BOARDROOM.eastX,
      minZ: THE_BOARDROOM.northZ,
      maxZ: THE_BOARDROOM.southZ,
    })
    // TheStation — second room off the central corridor.
    z.registerZone({
      id: 'the-station',
      minX: THE_STATION.westX,
      maxX: THE_STATION.eastX,
      minZ: THE_STATION.northZ,
      maxZ: THE_STATION.southZ,
    })
    // The Bakery — south of the conference room. Rect matches the
    // room's floor slab (ROOM_DEPTH/2 to that + THE_BAKERY.depth).
    z.registerZone({
      id: 'the-bakery',
      minX: THE_BAKERY.centerX - THE_BAKERY.width / 2,
      maxX: THE_BAKERY.centerX + THE_BAKERY.width / 2,
      minZ: ROOM_DEPTH / 2,
      maxZ: ROOM_DEPTH / 2 + THE_BAKERY.depth,
    })
    // Outdoor scaffold — far south of the bakery so the current spawn
    // (Z=21, just south of the corridor exit) stays in the `office`
    // fallback. Tighten this rect once a real outdoor doorway exists.
    z.registerZone({
      id: 'outdoor',
      minX: -200,
      maxX: 200,
      minZ: ROOM_DEPTH / 2 + THE_BAKERY.depth + 10,
      maxZ: 500,
    })
    // Zone covers the whole central corridor floor. `office` is the
    // fallback so anything not in the corridor or a room defaults to it.
    z.registerZone({
      id: 'central-corridor',
      minX: CENTRAL_CORRIDOR.westX,
      maxX: CENTRAL_CORRIDOR.eastX,
      minZ: CENTRAL_CORRIDOR.northZ,
      maxZ: CENTRAL_CORRIDOR.southZ,
    })
    return z
  }, [])

  useEffect(() => {
    if (controlsDisabled) manager.disable()
    else manager.enable()
  }, [controlsDisabled, manager])

  useFrame((_, delta) => {
    const body = bodyRef.current
    if (!body) return

    const pos = body.translation()
    const action = actionRef.current

    const s = state.current

    // Q/E → continuous camera yaw. Same ref the mouse hook mutates, so all
    // input sources (drag / trackpad / keys) compose into one yaw value.
    if (!controlsDisabled) {
      // Direction chosen to match mouse-drag: dragging right (or two-finger
      // scrolling right) increases yaw, so `yawRight` (E) does too. Flip
      // both signs if you'd rather Q/E match the on-screen character
      // direction instead.
      if (s.yawLeft) yaw.current -= KEY_LOOK_SPEED * delta
      if (s.yawRight) yaw.current += KEY_LOOK_SPEED * delta

      // +/- zoom. Multiplicative so successive presses feel consistent at any
      // current scale. "+" pulls the camera in (smaller multiplier).
      if (s.zoomIn) zoomRef.current /= Math.pow(CAMERA_ZOOM_RATE, delta)
      if (s.zoomOut) zoomRef.current *= Math.pow(CAMERA_ZOOM_RATE, delta)
      if (zoomRef.current < CAMERA_ZOOM_MIN) zoomRef.current = CAMERA_ZOOM_MIN
      if (zoomRef.current > CAMERA_ZOOM_MAX) zoomRef.current = CAMERA_ZOOM_MAX
    }

    // Process one-shot triggers. Roll takes precedence over wave.
    if (!controlsDisabled && action.kind === null) {
      if (consumeRoll() && clipRefs.rollName) {
        action.kind = 'roll'
        action.remaining = ACTION_HOLD.roll
        // Capture takeoff velocity: use current linvel if moving, otherwise
        // roll forward along the character's facing at STANDING_ROLL_SPEED.
        const lv = body.linvel()
        const currentSpeed = Math.hypot(lv.x, lv.z)
        if (currentSpeed > 0.5) {
          action.rollVx = lv.x
          action.rollVz = lv.z
        } else {
          // meshRef.rotation.y = atan2(vx, vz) so forward = (sin, cos)
          const facing = meshRef.current?.rotation.y ?? 0
          action.rollVx = Math.sin(facing) * STANDING_ROLL_SPEED
          action.rollVz = Math.cos(facing) * STANDING_ROLL_SPEED
        }
        const rollAction = actions[clipRefs.rollName]
        rollAction?.reset()
      } else if (consumeWave() && clipRefs.waveName) {
        action.kind = 'wave'
        action.remaining = ACTION_HOLD.wave
        const waveAction = actions[clipRefs.waveName]
        waveAction?.reset()
      }
    }

    // Countdown for roll/wave.
    if (action.kind === 'roll' || action.kind === 'wave') {
      action.remaining -= delta
      if (action.remaining <= 0) {
        action.kind = null
        action.remaining = 0
      }
    }

    // Movement locked while any action is active.
    const locked = action.kind !== null

    let vx = 0
    let vz = 0
    let isRunning = false
    if (!controlsDisabled && !locked) {
      // Camera-relative input: at yaw=0 the camera sits south of the player
      // looking north, so "forward" (W) should send the player north (-Z).
      // We build a local (ix, iz) intent, then rotate by the camera's yaw.
      let ix = 0
      let iz = 0
      if (s.forward) iz -= 1
      if (s.back) iz += 1
      if (s.left) ix -= 1
      if (s.right) ix += 1
      isRunning = s.running

      const len = Math.hypot(ix, iz)
      if (len > 0) {
        const speed = isRunning ? PLAYER_RUN_SPEED : PLAYER_SPEED
        ix = (ix / len) * speed
        iz = (iz / len) * speed
        // Rotate the input vector by the camera yaw. yaw > 0 orbits the
        // camera CCW (viewed from above); the movement frame rotates with it.
        const cy = Math.cos(yaw.current)
        const sy = Math.sin(yaw.current)
        vx = ix * cy + iz * sy
        vz = -ix * sy + iz * cy
      }
    } else if (action.kind === 'roll') {
      // Rolls carry their takeoff velocity through the animation.
      vx = action.rollVx
      vz = action.rollVz
    }

    body.setLinvel({ x: vx, y: 0, z: vz }, true)

    // 2D interaction is measured on the XZ plane — we pass X as "x" and Z as "y".
    manager.update({ x: pos.x, y: pos.z })
    // Zone tracking runs off the same XZ point.
    zones.update(pos.x, pos.z)

    if (!controlsDisabled && !locked && consumeInteract()) {
      manager.trigger()
    }

    // Polar-orbit camera: at yaw=0 the offset is (0, +Z) — camera due south
    // of the player looking north, matching the original fixed offset. yaw
    // rotates the horizontal offset CCW (viewed from above); height is fixed.
    const cy = Math.cos(yaw.current)
    const sy = Math.sin(yaw.current)
    const zoom = zoomRef.current
    cameraDesired.set(
      pos.x + CAMERA_DISTANCE * zoom * sy,
      CAMERA_HEIGHT * zoom,
      pos.z + CAMERA_DISTANCE * zoom * cy,
    )
    // Frame-rate-independent exponential smoothing: at any fps the camera
    // covers the same fraction of remaining distance per second.
    const smoothing = 1 - Math.exp(-delta * 12)
    camera.position.lerp(cameraDesired, smoothing)
    cameraTarget.set(pos.x, pos.y + CAMERA_LOOK_HEIGHT, pos.z)
    camera.lookAt(cameraTarget)

    const speed = Math.hypot(vx, vz)

    if (meshRef.current && speed > 0.01) {
      const angle = Math.atan2(vx, vz)
      meshRef.current.rotation.y = angle
    }

    const { idleName, walkName, runName, rollName, waveName } = clipRefs
    const idle = idleName ? actions[idleName] : null
    const walk = walkName ? actions[walkName] : null
    const run = runName ? actions[runName] : null
    const roll = rollName ? actions[rollName] : null
    const wave = waveName ? actions[waveName] : null

    const moving = speed > 0.05
    // If run clip is missing, fall back to walk while sprinting.
    const useRunClip = moving && isRunning && !!run
    const useWalkClip = moving && !useRunClip && !!walk

    const rollTarget = action.kind === 'roll' ? 1 : 0
    const waveTarget = action.kind === 'wave' ? 1 : 0
    // Base locomotion clips are muted while an action is active so the action
    // clip drives the whole armature.
    const baseGain = locked ? 0 : 1
    const idleTarget = (moving ? 0 : 1) * baseGain
    const walkTarget = (useWalkClip ? 1 : 0) * baseGain
    const runTarget = (useRunClip ? 1 : 0) * baseGain

    const blend = Math.min(1, delta * 8)
    if (idle) idle.setEffectiveWeight(THREE.MathUtils.lerp(idle.getEffectiveWeight(), idleTarget, blend))
    if (walk) walk.setEffectiveWeight(THREE.MathUtils.lerp(walk.getEffectiveWeight(), walkTarget, blend))
    if (run) run.setEffectiveWeight(THREE.MathUtils.lerp(run.getEffectiveWeight(), runTarget, blend))
    if (roll) roll.setEffectiveWeight(THREE.MathUtils.lerp(roll.getEffectiveWeight(), rollTarget, blend))
    if (wave) wave.setEffectiveWeight(THREE.MathUtils.lerp(wave.getEffectiveWeight(), waveTarget, blend))
  })

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      type="dynamic"
      position={PLAYER_SPAWN}
      enabledRotations={[false, false, false]}
      enabledTranslations={[true, false, true]}
      gravityScale={0}
      linearDamping={4}
      lockRotations
    >
      <CapsuleCollider args={[Math.max(0.05, PLAYER_HEIGHT / 2 - PLAYER_RADIUS), PLAYER_RADIUS]} />
      <group ref={meshRef}>
        <primitive
          object={modelFit.object}
          scale={modelFit.scale}
          position={[0, modelFit.offsetY, 0]}
        />
      </group>
    </RigidBody>
  )
}
