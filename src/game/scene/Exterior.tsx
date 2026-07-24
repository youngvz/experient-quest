import { Environment } from '@react-three/drei'
import { ROOM_DEPTH, ROOM_WIDTH } from '../constants/gameConstants'

// Scenic exterior visible through the glass walls. Intentionally low-poly —
// a horizon disc, a few silhouette bands, and warm rim lights that catch the
// transmissive walls. The Environment provides the HDR-ish reflections that
// MeshTransmissionMaterial samples for refraction.
export function Exterior() {
  const groundY = -0.05
  const groundRadius = Math.max(ROOM_WIDTH, ROOM_DEPTH) * 6

  return (
    <>
      <Environment preset="sunset" background={false} />

      {/* horizon ground disc — kept far below room floor to avoid z-fight */}
      <mesh position={[0, groundY - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[groundRadius, 64]} />
        <meshStandardMaterial color="#1e2530" roughness={1} metalness={0} />
      </mesh>

      {/* distant silhouette buildings — three rings, staggered heights */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2
        const dist = 40
        const height = 4 + ((i * 37) % 9)
        const width = 3 + ((i * 23) % 4)
        const depth = 3 + ((i * 17) % 4)
        return (
          <mesh
            key={`ring1-${i}`}
            position={[Math.cos(angle) * dist, height / 2, Math.sin(angle) * dist]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#2a3446" roughness={0.9} />
          </mesh>
        )
      })}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2 + 0.15
        const dist = 60
        const height = 8 + ((i * 41) % 14)
        const width = 4 + ((i * 29) % 5)
        const depth = 4 + ((i * 19) % 5)
        return (
          <mesh
            key={`ring2-${i}`}
            position={[Math.cos(angle) * dist, height / 2, Math.sin(angle) * dist]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#1a2233" roughness={0.9} />
          </mesh>
        )
      })}

      {/* warm sunset key light streaming in from behind the glass on the -X side */}
      <directionalLight
        position={[-25, 12, -8]}
        intensity={1.6}
        color="#ffb877"
        castShadow={false}
      />
      {/* cool fill from the opposite side to keep interior readable */}
      <directionalLight position={[15, 10, 12]} intensity={0.4} color="#88a8c8" />
    </>
  )
}
