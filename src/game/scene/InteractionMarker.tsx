import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import { findStop } from '../interactions/interactionTypes'
import { useGameStore } from '../state/gameStore'

interface InteractionMarkerProps {
  stopId: string
  position: [number, number, number]
  // Optional extra gate on top of the stop's own requiresQuest. Hides the
  // marker until the given quest is unlocked, even if the stop itself is
  // always reachable. Used to hide quest-target markers until the player
  // has accepted the story-line quest that points them at those targets.
  requiresQuest?: string
}

// Floating quest-marker diamond that hovers above an interactable object
// while its stop is currently reachable. Hides once the stop is completed
// or its requiresQuest gate hasn't been satisfied yet — mirrors the same
// gate InteractionManager applies in Player.tsx so the visual and the
// prompt agree on when the object is "ready".
export function InteractionMarker({
  stopId,
  position,
  requiresQuest,
}: InteractionMarkerProps) {
  const stop = findStop(stopId)
  const completed = useGameStore((s) => s.completedStopIds.has(stopId))
  const stopQuestUnlocked = useGameStore((s) =>
    stop?.requiresQuest ? s.unlockedQuestIds.includes(stop.requiresQuest) : true,
  )
  const markerQuestUnlocked = useGameStore((s) =>
    requiresQuest ? s.unlockedQuestIds.includes(requiresQuest) : true,
  )
  const questUnlocked = stopQuestUnlocked && markerQuestUnlocked
  const groupRef = useRef<Group | null>(null)
  const matRef = useRef<MeshStandardMaterial | null>(null)
  const baseY = position[1]

  useFrame((state) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.y = baseY + Math.sin(t * 2.4) * 0.1
    g.rotation.y = t * 1.2
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.7 + Math.sin(t * 3.2) * 0.25
    }
  })

  if (!stop || completed || !questUnlocked) return null
  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow={false}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          ref={matRef}
          color="#ffd85a"
          emissive="#ffb020"
          emissiveIntensity={0.85}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}
