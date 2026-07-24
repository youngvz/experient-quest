import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import {
  CAMERA_LOOK_HEIGHT,
  CAMERA_OFFSET,
  PLAYER_HEIGHT,
  PLAYER_MODEL_SCALE,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_SPAWN,
  PLAYER_SPAWN_FACING,
  PLAYER_SPEED,
  SIT_ACTIVATION_RADIUS,
  SIT_FORWARD_OFFSET,
  SIT_SPOTS,
  SIT_VERTICAL_OFFSET,
} from '../constants/gameConstants'
import { useKeyboard } from '../../hooks/useKeyboard'
import { gameEvents } from '../events/GameEventBus'
import { InteractionManager } from '../interactions/InteractionManager'
import { presentationStops } from '../interactions/interactionTypes'
import { getStopZoneRect } from './interactionZones'

const PLAYER_MODEL_URL = '/assets/player/character.glb'
useGLTF.preload(PLAYER_MODEL_URL)

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

type ActionKind = 'jump' | 'clap' | 'sit'

// One-shot action clips (jump/clap) hold movement for their duration.
// Jump = RunningJump clip; horizontal velocity is preserved during the leap
// so the character actually travels instead of playing in place.
const ACTION_HOLD: Record<Exclude<ActionKind, 'sit'>, number> = {
  jump: 0.9,
  clap: 1.4,
}

// Standing-jump speed floor: pressing Space from a standstill still moves the
// player forward (in facing direction) so the running-jump clip reads right.
const STANDING_JUMP_SPEED = 6

export function Player({ controlsDisabled }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const meshRef = useRef<THREE.Group | null>(null)
  const { camera } = useThree()
  const { state, consumeInteract, consumeJump, consumeClap, consumeSitToggle } = useKeyboard()

  // Per-frame action state. Refs (not React state) so useFrame doesn't re-render.
  // `jumpVel` is the horizontal velocity carried through a running jump —
  // captured at takeoff so the leap covers ground even without held keys.
  const actionRef = useRef<{
    kind: ActionKind | null
    remaining: number
    jumpVx: number
    jumpVz: number
  }>({
    kind: null,
    remaining: 0,
    jumpVx: 0,
    jumpVz: 0,
  })

  const cameraTarget = useMemo(() => new THREE.Vector3(), [])
  const cameraDesired = useMemo(() => new THREE.Vector3(), [])

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
    // Prefer the running-jump variant so Space plays a full leap; fall back
    // to any other jump clip if the model only ships a standing jump.
    const jumpCandidates = gltf.animations.filter((c) => /jump/i.test(c.name))
    const jump =
      jumpCandidates.find((c) => /running.?jump|run.?jump/i.test(c.name)) ??
      jumpCandidates[0] ??
      null
    const clap = pickClip(gltf.animations, [/clap/i])
    const sit = pickClip(gltf.animations, [/sit/i])
    return {
      idleName: idle?.name ?? null,
      walkName: walk?.name ?? null,
      runName: run?.name ?? null,
      jumpName: jump?.name ?? null,
      clapName: clap?.name ?? null,
      sitName: sit?.name ?? null,
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
    const { idleName, walkName, runName, jumpName, clapName, sitName } = clipRefs
    const idle = idleName ? actions[idleName] : null
    const walk = walkName ? actions[walkName] : null
    const run = runName ? actions[runName] : null
    const jump = jumpName ? actions[jumpName] : null
    const clap = clapName ? actions[clapName] : null
    const sit = sitName ? actions[sitName] : null
    idle?.reset().setEffectiveWeight(1).play()
    walk?.reset().setEffectiveWeight(0).play()
    run?.reset().setEffectiveWeight(0).play()
    // Action clips stay loaded at 0 weight; useFrame ramps them up on trigger.
    jump?.reset().setEffectiveWeight(0).play()
    clap?.reset().setEffectiveWeight(0).play()
    sit?.reset().setEffectiveWeight(0).play()
    return () => {
      idle?.stop()
      walk?.stop()
      run?.stop()
      jump?.stop()
      clap?.stop()
      sit?.stop()
    }
  }, [actions, clipRefs])

  const manager = useMemo(() => {
    const m = new InteractionManager({
      onAvailable: (stop) =>
        gameEvents.emit('interaction:available', { stopId: stop.id, prompt: stop.prompt }),
      onUnavailable: () => gameEvents.emit('interaction:unavailable', undefined),
      onTriggered: (stop) =>
        gameEvents.emit('interaction:triggered', { stopId: stop.id }),
    })
    for (const stop of presentationStops) {
      m.registerZone(getStopZoneRect(stop), stop)
    }
    return m
  }, [])

  useEffect(() => {
    if (controlsDisabled) manager.disable()
    else manager.enable()
  }, [controlsDisabled, manager])

  useEffect(() => {
    return () => manager.clearZones()
  }, [manager])

  useFrame((_, delta) => {
    const body = bodyRef.current
    if (!body) return

    const pos = body.translation()
    const action = actionRef.current

    // Any movement key cancels a sit — jump/clap play through instead.
    const s = state.current
    const movementRequested =
      !controlsDisabled && (s.forward || s.back || s.left || s.right)
    if (action.kind === 'sit' && movementRequested) {
      action.kind = null
      action.remaining = 0
    }

    // Process one-shot triggers (jump/clap take precedence over sit start).
    if (!controlsDisabled && action.kind === null) {
      if (consumeJump() && clipRefs.jumpName) {
        action.kind = 'jump'
        action.remaining = ACTION_HOLD.jump
        // Capture takeoff velocity: use current linvel if moving, otherwise
        // launch forward along the character's facing at STANDING_JUMP_SPEED.
        const lv = body.linvel()
        const currentSpeed = Math.hypot(lv.x, lv.z)
        if (currentSpeed > 0.5) {
          action.jumpVx = lv.x
          action.jumpVz = lv.z
        } else {
          // meshRef.rotation.y = atan2(vx, vz) so forward = (sin, cos)
          const facing = meshRef.current?.rotation.y ?? 0
          action.jumpVx = Math.sin(facing) * STANDING_JUMP_SPEED
          action.jumpVz = Math.cos(facing) * STANDING_JUMP_SPEED
        }
        const jumpAction = actions[clipRefs.jumpName]
        jumpAction?.reset()
      } else if (consumeClap() && clipRefs.clapName) {
        action.kind = 'clap'
        action.remaining = ACTION_HOLD.clap
        const clapAction = actions[clipRefs.clapName]
        clapAction?.reset()
      }
    }

    // Sit toggle: near a desk → start sit (snapping to the sit spot);
    // pressing again while sitting stands up. Ignored during jump/clap.
    if (
      !controlsDisabled &&
      consumeSitToggle() &&
      (action.kind === null || action.kind === 'sit') &&
      clipRefs.sitName
    ) {
      if (action.kind === 'sit') {
        action.kind = null
      } else {
        // Nearest sit spot within activation radius wins.
        let nearest: (typeof SIT_SPOTS)[number] | null = null
        let nearestDist = Infinity
        for (const spot of SIT_SPOTS) {
          const dx = spot[0] - pos.x
          const dz = spot[1] - pos.z
          const d = Math.hypot(dx, dz)
          if (d < nearestDist) {
            nearestDist = d
            nearest = spot
          }
        }
        if (nearest && nearestDist <= SIT_ACTIVATION_RADIUS) {
          action.kind = 'sit'
          action.remaining = 0
          // Snap the rigid body to the sit spot so the seated animation lines
          // up with the chair. Nudge slightly forward (toward the desk) so
          // the torso doesn't clip through the chair back. Facing angle θ
          // means forward = (sin θ, cos θ) in world XZ.
          const facing = nearest[2]
          const fx = Math.sin(facing) * SIT_FORWARD_OFFSET
          const fz = Math.cos(facing) * SIT_FORWARD_OFFSET
          body.setTranslation(
            { x: nearest[0] + fx, y: pos.y, z: nearest[1] + fz },
            true,
          )
          body.setLinvel({ x: 0, y: 0, z: 0 }, true)
          if (meshRef.current) meshRef.current.rotation.y = facing
          actions[clipRefs.sitName]?.reset()
        }
      }
    }

    // Countdown for jump/clap. Sit lasts until toggled off.
    if (action.kind === 'jump' || action.kind === 'clap') {
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
      if (s.forward) vz -= 1
      if (s.back) vz += 1
      if (s.left) vx -= 1
      if (s.right) vx += 1
      isRunning = s.running

      const len = Math.hypot(vx, vz)
      if (len > 0) {
        const speed = isRunning ? PLAYER_RUN_SPEED : PLAYER_SPEED
        vx = (vx / len) * speed
        vz = (vz / len) * speed
      }
    } else if (action.kind === 'jump') {
      // Jumps carry their takeoff velocity through the leap.
      vx = action.jumpVx
      vz = action.jumpVz
    }

    body.setLinvel({ x: vx, y: 0, z: vz }, true)

    // 2D interaction is measured on the XZ plane — we pass X as "x" and Z as "y".
    manager.update({ x: pos.x, y: pos.z })

    if (!controlsDisabled && !locked && consumeInteract()) {
      manager.trigger()
    }

    cameraDesired.set(pos.x + CAMERA_OFFSET[0], CAMERA_OFFSET[1], pos.z + CAMERA_OFFSET[2])
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

    // Sit lift: raise the visual mesh up onto the chair seat while seated so
    // the legs rest on top of the chair instead of clipping through it. The
    // RigidBody Y is locked, so we drive this on the mesh group only.
    if (meshRef.current) {
      const targetY = action.kind === 'sit' ? SIT_VERTICAL_OFFSET : 0
      const liftBlend = Math.min(1, delta * 10)
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        liftBlend,
      )
    }

    const { idleName, walkName, runName, jumpName, clapName, sitName } = clipRefs
    const idle = idleName ? actions[idleName] : null
    const walk = walkName ? actions[walkName] : null
    const run = runName ? actions[runName] : null
    const jump = jumpName ? actions[jumpName] : null
    const clap = clapName ? actions[clapName] : null
    const sit = sitName ? actions[sitName] : null

    const moving = speed > 0.05
    // If run clip is missing, fall back to walk while sprinting.
    const useRunClip = moving && isRunning && !!run
    const useWalkClip = moving && !useRunClip && !!walk

    const jumpTarget = action.kind === 'jump' ? 1 : 0
    const clapTarget = action.kind === 'clap' ? 1 : 0
    const sitTarget = action.kind === 'sit' ? 1 : 0
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
    if (jump) jump.setEffectiveWeight(THREE.MathUtils.lerp(jump.getEffectiveWeight(), jumpTarget, blend))
    if (clap) clap.setEffectiveWeight(THREE.MathUtils.lerp(clap.getEffectiveWeight(), clapTarget, blend))
    if (sit) sit.setEffectiveWeight(THREE.MathUtils.lerp(sit.getEffectiveWeight(), sitTarget, blend))
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
