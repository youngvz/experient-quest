import { Environment, Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import { ROOM_DEPTH, ROOM_WIDTH } from '../constants/gameConstants'

interface BuildingInstance {
  key: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

function makeRing(
  count: number,
  distance: number,
  seed: number,
  heightBase: number,
  heightVar: number,
  wBase: number,
  wVar: number,
  dBase: number,
  dVar: number,
  angleOffset = 0,
): BuildingInstance[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + angleOffset
    const height = heightBase + ((i * seed) % heightVar)
    const width = wBase + ((i * 23) % wVar)
    const depth = dBase + ((i * 17) % dVar)
    return {
      key: `${distance}-${i}`,
      position: [Math.cos(angle) * distance, height / 2, Math.sin(angle) * distance],
      rotation: [0, angle, 0],
      scale: [width, height, depth],
    }
  })
}

// Scenic exterior visible through the glass walls. Silhouette buildings are
// instanced (2 draw calls total instead of one per building — critical when
// transmission panes re-render the scene into their own buffers).
export function Exterior() {
  const groundY = -0.05
  const groundRadius = Math.max(ROOM_WIDTH, ROOM_DEPTH) * 6

  const ringNear = useMemo(() => makeRing(14, 40, 37, 4, 9, 3, 4, 3, 4), [])
  const ringFar = useMemo(() => makeRing(20, 60, 41, 8, 14, 4, 5, 4, 5, 0.15), [])

  return (
    <>
      <Environment preset="sunset" background={false} />

      <mesh position={[0, groundY - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[groundRadius, 64]} />
        <meshStandardMaterial color="#1e2530" roughness={1} metalness={0} />
      </mesh>

      <Instances limit={ringNear.length} range={ringNear.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2a3446" roughness={0.9} />
        {ringNear.map((b) => (
          <Instance key={b.key} position={b.position} rotation={b.rotation} scale={b.scale} />
        ))}
      </Instances>

      <Instances limit={ringFar.length} range={ringFar.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1a2233" roughness={0.9} />
        {ringFar.map((b) => (
          <Instance key={b.key} position={b.position} rotation={b.rotation} scale={b.scale} />
        ))}
      </Instances>

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
