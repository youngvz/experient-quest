import { Suspense, lazy } from 'react'

const ExteriorEnvironment = lazy(() => import('./ExteriorEnvironment'))
import { ROOM_DEPTH, ROOM_WIDTH } from '../constants/gameConstants'

// Scenic exterior visible through the glass walls. Just a flat dark ground
// disc and warm/cool fill lights — the authored SouthApron carries the
// real outdoor terrain in front of the building.
export function Exterior() {
  const groundY = -0.05
  const groundRadius = Math.max(ROOM_WIDTH, ROOM_DEPTH) * 6

  return (
    <>
      <Suspense fallback={null}>
        <ExteriorEnvironment />
      </Suspense>

      <mesh position={[0, groundY - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[groundRadius, 64]} />
        <meshStandardMaterial color="#1e2530" roughness={1} metalness={0} />
      </mesh>

      <directionalLight
        position={[-25, 12, -8]}
        intensity={1.6}
        color="#ffb877"
        castShadow={false}
      />
      <directionalLight position={[15, 10, 12]} intensity={0.4} color="#88a8c8" />
    </>
  )
}
