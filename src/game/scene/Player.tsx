import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  CAMERA_LOOK_HEIGHT,
  CAMERA_OFFSET,
  COLORS,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_SPAWN,
  PLAYER_SPEED,
} from '../constants/gameConstants'
import { useKeyboard } from '../../hooks/useKeyboard'
import { gameEvents } from '../events/GameEventBus'
import { InteractionManager } from '../interactions/InteractionManager'
import { officeInteractions } from '../interactions/interactionTypes'
import { getEventsTvZoneRect } from './interactionZones'

interface PlayerProps {
  controlsDisabled: boolean
}

export function Player({ controlsDisabled }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const meshRef = useRef<THREE.Group | null>(null)
  const { camera } = useThree()
  const { state, consumeInteract } = useKeyboard()

  const cameraTarget = useMemo(() => new THREE.Vector3(), [])
  const cameraDesired = useMemo(() => new THREE.Vector3(), [])

  const manager = useMemo(() => {
    const m = new InteractionManager({
      onAvailable: (def) =>
        gameEvents.emit('interaction:available', { id: def.id, prompt: def.prompt }),
      onUnavailable: () => gameEvents.emit('interaction:unavailable', undefined),
      onTriggered: (def) =>
        gameEvents.emit('interaction:triggered', {
          id: def.id,
          title: def.contentTitle,
          body: def.contentBody,
        }),
    })
    m.registerZone('events-tv', getEventsTvZoneRect(), officeInteractions['events-tv'])
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

    if (meshRef.current) {
      if (Math.hypot(vx, vz) > 0.01) {
        const angle = Math.atan2(vx, vz)
        meshRef.current.rotation.y = angle
      }
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
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 4, 12]} />
          <meshStandardMaterial color={COLORS.player} />
        </mesh>
        {/* facing marker on +Z (player-forward) */}
        <mesh position={[0, 0.3, PLAYER_RADIUS + 0.02]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color={COLORS.playerFace} />
        </mesh>
      </group>
    </RigidBody>
  )
}
