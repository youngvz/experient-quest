import { RigidBody } from '@react-three/rapier'
import { THE_BAKERY_EAST_CABINETS, WALL_THICKNESS } from '../constants/gameConstants'

const C = THE_BAKERY_EAST_CABINETS

// A single base cabinet body with a simple two-door face. Positioned so its
// east face is flush against the interior of the east wall and its front
// (west) face points into the The Bakery.
function CabinetBody({ centerZ }: { centerZ: number }) {
  const centerX = C.wallX - WALL_THICKNESS / 2 - C.depth / 2
  const centerY = C.bodyHeight / 2
  const doorInset = 0.02
  const doorGap = 0.015
  const doorW = (C.unitWidth - doorGap) / 2 - 0.01
  const doorH = C.bodyHeight - 0.08
  const doorFaceX = centerX - C.depth / 2 - doorInset / 2
  return (
    <group position={[centerX, centerY, centerZ]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[C.depth, C.bodyHeight, C.unitWidth]} />
        <meshStandardMaterial color={C.bodyColor} roughness={0.7} />
      </mesh>
      {/* two door panels, side-by-side along Z */}
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          castShadow
          position={[doorFaceX - centerX, 0, sign * (doorW / 2 + doorGap / 2)]}
        >
          <boxGeometry args={[doorInset, doorH, doorW]} />
          <meshStandardMaterial color="#eeece7" roughness={0.55} />
        </mesh>
      ))}
      {/* small brushed-metal knobs, one per door, near the inner edges */}
      {[-1, 1].map((sign) => (
        <mesh
          key={`k${sign}`}
          position={[
            doorFaceX - centerX - doorInset / 2 - 0.015,
            -0.03,
            sign * (doorGap / 2 + 0.05),
          ]}
        >
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={C.metalColor} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

// Countertop slab. `zMin`..`zMax` defines its span along the wall. A single
// physics collider covers the piece so the player bumps into it.
function CounterSlab({ zMin, zMax }: { zMin: number; zMax: number }) {
  const width = zMax - zMin
  if (width <= 0.001) return null
  const counterDepth = C.depth + C.counterOverhang
  const centerX = C.wallX - WALL_THICKNESS / 2 - counterDepth / 2
  const centerY = C.bodyHeight + C.counterThickness / 2
  const centerZ = (zMin + zMax) / 2
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={[centerX, centerY, centerZ]}>
        <boxGeometry args={[counterDepth, C.counterThickness, width]} />
        <meshStandardMaterial color={C.counterColor} roughness={0.5} />
      </mesh>
    </RigidBody>
  )
}

// Drop-in sink centered on the northmost cabinet. Modeled as a shallow basin
// (four side walls + a floor) sitting in a cutout in the countertop, plus a
// simple gooseneck faucet at the back edge.
function Sink({ centerZ }: { centerZ: number }) {
  const basinW = 0.42 // along Z
  const basinD = 0.4 // along X (into hallway from wall)
  const basinDepth = 0.14 // below counter surface
  const rim = 0.03
  const counterTopY = C.bodyHeight + C.counterThickness
  const basinFloorY = counterTopY - basinDepth
  // Center basin slightly forward of the counter's midline to leave room for
  // a faucet at the back.
  const backX = C.wallX - WALL_THICKNESS / 2
  const basinBackX = backX - 0.06
  const basinCenterX = basinBackX - basinD / 2
  const wallThick = 0.02

  return (
    <group>
      {/* rim strips around the basin, sitting on the counter surface */}
      {/* front rim */}
      <mesh position={[basinCenterX - basinD / 2 - rim / 2, counterTopY + 0.005, centerZ]}>
        <boxGeometry args={[rim, 0.01, basinW + rim * 2]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* north + south rim */}
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          position={[basinCenterX, counterTopY + 0.005, centerZ + sign * (basinW / 2 + rim / 2)]}
        >
          <boxGeometry args={[basinD, 0.01, rim]} />
          <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* basin floor */}
      <mesh receiveShadow position={[basinCenterX, basinFloorY, centerZ]}>
        <boxGeometry args={[basinD, wallThick, basinW]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* basin side walls (four thin panels lining the cutout) */}
      <mesh position={[basinCenterX - basinD / 2 + wallThick / 2, (basinFloorY + counterTopY) / 2, centerZ]}>
        <boxGeometry args={[wallThick, basinDepth, basinW]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[basinCenterX + basinD / 2 - wallThick / 2, (basinFloorY + counterTopY) / 2, centerZ]}>
        <boxGeometry args={[wallThick, basinDepth, basinW]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
      </mesh>
      {[-1, 1].map((sign) => (
        <mesh
          key={`sw${sign}`}
          position={[basinCenterX, (basinFloorY + counterTopY) / 2, centerZ + sign * (basinW / 2 - wallThick / 2)]}
        >
          <boxGeometry args={[basinD, basinDepth, wallThick]} />
          <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      {/* faucet: base puck + vertical neck + horizontal spout */}
      <group position={[backX - 0.04, counterTopY, centerZ]}>
        <mesh castShadow position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.03, 12]} />
          <meshStandardMaterial color={C.metalColor} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh castShadow position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.17, 12]} />
          <meshStandardMaterial color={C.metalColor} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh
          castShadow
          position={[-0.09, 0.19, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.016, 0.016, 0.18, 12]} />
          <meshStandardMaterial color={C.metalColor} metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

// Row of white base cabinets along the east wall of the The Bakery, in
// the stretch south of the NE alcoves. The northmost cabinet holds a sink.
export function TheBakeryCabinets() {
  const bodies: number[] = []
  for (let i = 0; i < C.count; i++) {
    bodies.push(C.startZ + i * C.unitWidth)
  }
  const northCenterZ = bodies[0]!
  const rowNorthEdge = northCenterZ - C.unitWidth / 2
  const rowSouthEdge = bodies[bodies.length - 1]! + C.unitWidth / 2

  // Countertop: solid slab south of the sink cabinet; small rim strips around
  // the sink cutout on the northmost cabinet.
  const sinkHalf = 0.42 / 2 // basin half-width; must match Sink()
  const sinkNorthZ = northCenterZ - sinkHalf - 0.03 // include rim
  const sinkSouthZ = northCenterZ + sinkHalf + 0.03

  return (
    <>
      {bodies.map((z, i) => (
        <RigidBody key={`cab-${i}`} type="fixed" colliders="cuboid">
          <CabinetBody centerZ={z} />
        </RigidBody>
      ))}
      {/* counter fragments: thin strip at the very north end (in front of the
          sink cabinet, forward of the basin) then the long slab covering the
          six southern cabinets. We keep the sink cutout free of counter mesh
          so the basin reads as inset. */}
      <CounterSlab zMin={rowNorthEdge} zMax={sinkNorthZ} />
      <CounterSlab zMin={sinkSouthZ} zMax={rowSouthEdge} />
      <Sink centerZ={northCenterZ} />
    </>
  )
}
