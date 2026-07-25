import { Instance, Instances } from '@react-three/drei'
import { Suspense, lazy, useMemo } from 'react'

const ExteriorEnvironment = lazy(() => import('./ExteriorEnvironment'))
import {
  CENTRAL_CORRIDOR,
  EAST_CORRIDOR,
  ROOM_DEPTH,
  ROOM_WIDTH,
  THE_BAKERY,
  THE_GARAGE,
  THE_STATION,
  WEST_ROOM_WEST_X,
} from '../constants/gameConstants'

interface BuildingInstance {
  key: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

// AABB of everything the player can walk in — buildings outside must
// stay clear of this in world XZ, plus a small margin so tall boxes
// don't kiss the glass walls.
const BUILDING_MARGIN = 4
const BUILDING_AABB = (() => {
  const minX = Math.min(
    WEST_ROOM_WEST_X,
    CENTRAL_CORRIDOR.westX,
    -ROOM_WIDTH / 2,
  )
  const maxX = Math.max(
    EAST_CORRIDOR.eastX,
    ROOM_WIDTH / 2,
    THE_STATION.eastX,
    THE_GARAGE.eastX,
  )
  const minZ = Math.min(
    CENTRAL_CORRIDOR.northZ,
    -ROOM_DEPTH / 2,
    THE_GARAGE.conference.northZ,
  )
  const maxZ = Math.max(
    THE_BAKERY.centerX + THE_BAKERY.depth,
    ROOM_DEPTH / 2 + THE_BAKERY.depth,
  )
  return {
    minX: minX - BUILDING_MARGIN,
    maxX: maxX + BUILDING_MARGIN,
    minZ: minZ - BUILDING_MARGIN,
    maxZ: maxZ + BUILDING_MARGIN,
  }
})()

function overlapsBuilding(cx: number, cz: number, w: number, d: number): boolean {
  const halfW = w / 2
  const halfD = d / 2
  return (
    cx + halfW > BUILDING_AABB.minX &&
    cx - halfW < BUILDING_AABB.maxX &&
    cz + halfD > BUILDING_AABB.minZ &&
    cz - halfD < BUILDING_AABB.maxZ
  )
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
  const items: BuildingInstance[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + angleOffset
    const height = heightBase + ((i * seed) % heightVar)
    const width = wBase + ((i * 23) % wVar)
    const depth = dBase + ((i * 17) % dVar)
    const cx = Math.cos(angle) * distance
    const cz = Math.sin(angle) * distance
    // Skip any silhouette that would clip through the interior geometry.
    if (overlapsBuilding(cx, cz, width, depth)) continue
    items.push({
      key: `${distance}-${i}`,
      position: [cx, height / 2, cz],
      rotation: [0, angle, 0],
      scale: [width, height, depth],
    })
  }
  return items
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
      <Suspense fallback={null}>
        <ExteriorEnvironment />
      </Suspense>

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
