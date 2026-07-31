import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  MeshStandardMaterial,
  OctahedronGeometry,
  type Group,
} from 'three'
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

// One shared geometry + material for every marker in the scene. All markers
// pulse in sync, so a shared material is correct (and cheaper — one draw
// state, no per-instance allocations at module scope).
const MARKER_GEOMETRY = new OctahedronGeometry(0.18, 0)
const MARKER_MATERIAL = new MeshStandardMaterial({
  color: '#8fc78a',
  emissive: '#4fa04c',
  emissiveIntensity: 0.85,
  roughness: 0.35,
  metalness: 0.1,
})

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
  // Single combined selector. Three separate subscriptions × six markers
  // meant every store update (task toasts, zone changes, nearby-rooms
  // recomputes) ran 18 selectors every time.
  const visible = useGameStore((s) => {
    if (!stop) return false
    if (s.completedStopIds.has(stopId)) return false
    if (stop.requiresQuest && !s.unlockedQuestIds.includes(stop.requiresQuest))
      return false
    if (requiresQuest && !s.unlockedQuestIds.includes(requiresQuest))
      return false
    return true
  })

  if (!visible) return null
  return <MarkerBody position={position} />
}

// Split so useFrame only registers when the marker is actually rendered —
// otherwise gated-invisible markers were burning per-frame cost.
function MarkerBody({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<Group | null>(null)
  const baseY = position[1]
  useFrame((state) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.y = baseY + Math.sin(t * 2.4) * 0.1
    g.rotation.y = t * 1.2
    // All markers write the same value to the shared material — redundant
    // writes are cheap and keep the pulse in lockstep automatically.
    MARKER_MATERIAL.emissiveIntensity = 0.7 + Math.sin(t * 3.2) * 0.25
  })
  return (
    <group ref={groupRef} position={position}>
      <mesh
        castShadow={false}
        geometry={MARKER_GEOMETRY}
        material={MARKER_MATERIAL}
      />
    </group>
  )
}
