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
  PLAYER_SPAWN,
  PLAYER_SPEED,
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

export function Player({ controlsDisabled }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const meshRef = useRef<THREE.Group | null>(null)
  const { camera } = useThree()
  const { state, consumeInteract } = useKeyboard()

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
    return {
      idleName: idle?.name ?? null,
      walkName: walk?.name ?? run?.name ?? null,
    }
  }, [gltf.animations])

  useEffect(() => {
    if (import.meta.env.DEV && names.length > 0) {
      console.info('[Player] GLB animation clips:', names)
    }
  }, [names])

  useEffect(() => {
    const { idleName, walkName } = clipRefs
    const idle = idleName ? actions[idleName] : null
    const walk = walkName ? actions[walkName] : null
    idle?.reset().setEffectiveWeight(1).play()
    walk?.reset().setEffectiveWeight(0).play()
    return () => {
      idle?.stop()
      walk?.stop()
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

    let vx = 0
    let vz = 0
    if (!controlsDisabled) {
      const s = state.current
      if (s.forward) vz -= 1
      if (s.back) vz += 1
      if (s.left) vx -= 1
      if (s.right) vx += 1

      const len = Math.hypot(vx, vz)
      if (len > 0) {
        vx = (vx / len) * PLAYER_SPEED
        vz = (vz / len) * PLAYER_SPEED
      }
    }

    body.setLinvel({ x: vx, y: 0, z: vz }, true)

    const pos = body.translation()

    // 2D interaction is measured on the XZ plane — we pass X as "x" and Z as "y".
    manager.update({ x: pos.x, y: pos.z })

    if (!controlsDisabled && consumeInteract()) {
      manager.trigger()
    }

    cameraDesired.set(pos.x + CAMERA_OFFSET[0], CAMERA_OFFSET[1], pos.z + CAMERA_OFFSET[2])
    camera.position.lerp(cameraDesired, Math.min(1, delta * 8))
    cameraTarget.set(pos.x, pos.y + CAMERA_LOOK_HEIGHT, pos.z)
    camera.lookAt(cameraTarget)

    const speed = Math.hypot(vx, vz)

    if (meshRef.current && speed > 0.01) {
      const angle = Math.atan2(vx, vz)
      meshRef.current.rotation.y = angle
    }

    const { idleName, walkName } = clipRefs
    const idle = idleName ? actions[idleName] : null
    const walk = walkName ? actions[walkName] : null
    if (idle || walk) {
      const target = speed > 0.05 ? 1 : 0
      const blend = Math.min(1, delta * 8)
      if (walk) walk.setEffectiveWeight(THREE.MathUtils.lerp(walk.getEffectiveWeight(), target, blend))
      if (idle) idle.setEffectiveWeight(THREE.MathUtils.lerp(idle.getEffectiveWeight(), 1 - target, blend))
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      type="dynamic"
      position={PLAYER_SPAWN}
      enabledRotations={[false, false, false]}
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
