import { RigidBody } from '@react-three/rapier'
import { WALL_THICKNESS } from '../constants/gameConstants'

// Config shape shared by kitchen-style cabinet rows. `wallX` is the wall
// midplane; `facing` picks which side of the wall the cabinets hang from
// (+1 = bodies grow along +X, front face points +X into the room east
// of the wall; -1 = mirror image, into the room west of the wall).
export interface CabinetRowConfig {
  wallX: number
  facing: -1 | 1
  count: number
  unitWidth: number
  depth: number
  bodyHeight: number
  counterThickness: number
  counterOverhang: number
  startZ: number
  // Which cabinet in the row holds the sink. 0 = northmost (default),
  // count-1 = southmost. The countertop is drawn as two slabs that
  // leave a cutout around this cabinet.
  sinkIndex?: number
  bodyColor: string
  counterColor: string
  sinkColor: string
  metalColor: string
}

// A single base cabinet body with a simple two-door face. Positioned so
// its back face is flush against the interior of the wall and its front
// face points into the room (direction chosen by `config.facing`).
function CabinetBody({
  centerZ,
  config,
}: {
  centerZ: number
  config: CabinetRowConfig
}) {
  const C = config
  const f = C.facing
  // Body center sits `WALL_THICKNESS/2 + depth/2` off the wall in the
  // `facing` direction; front face is another `depth/2` from center in
  // the same direction.
  const centerX = C.wallX + f * (WALL_THICKNESS / 2 + C.depth / 2)
  const centerY = C.bodyHeight / 2
  const doorInset = 0.02
  const doorGap = 0.015
  const doorW = (C.unitWidth - doorGap) / 2 - 0.01
  const doorH = C.bodyHeight - 0.08
  const doorFaceX = centerX + f * (C.depth / 2 + doorInset / 2)
  return (
    <group position={[centerX, centerY, centerZ]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[C.depth, C.bodyHeight, C.unitWidth]} />
        <meshStandardMaterial color={C.bodyColor} roughness={0.7} />
      </mesh>
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
      {[-1, 1].map((sign) => (
        <mesh
          key={`k${sign}`}
          position={[
            doorFaceX - centerX + f * (doorInset / 2 + 0.015),
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

function CounterSlab({
  zMin,
  zMax,
  config,
}: {
  zMin: number
  zMax: number
  config: CabinetRowConfig
}) {
  const C = config
  const f = C.facing
  const width = zMax - zMin
  if (width <= 0.001) return null
  const counterDepth = C.depth + C.counterOverhang
  const centerX = C.wallX + f * (WALL_THICKNESS / 2 + counterDepth / 2)
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

// Drop-in sink centered on a given cabinet. Basin + faucet mirror across
// `config.facing` so the faucet always sits at the back edge (against
// the wall) and the basin protrudes into the room.
function Sink({
  centerZ,
  config,
}: {
  centerZ: number
  config: CabinetRowConfig
}) {
  const C = config
  const f = C.facing
  const basinW = 0.42 // along Z
  const basinD = 0.4 // along X (into room from wall)
  const basinDepth = 0.14
  const rim = 0.03
  const counterTopY = C.bodyHeight + C.counterThickness
  const basinFloorY = counterTopY - basinDepth
  const backX = C.wallX + f * (WALL_THICKNESS / 2)
  const basinBackX = backX + f * 0.06
  const basinCenterX = basinBackX + f * (basinD / 2)
  const wallThick = 0.02

  return (
    <group>
      {/* front rim — on the room side of the basin */}
      <mesh
        position={[basinCenterX + f * (basinD / 2 + rim / 2), counterTopY + 0.005, centerZ]}
      >
        <boxGeometry args={[rim, 0.01, basinW + rim * 2]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* N/S rims */}
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
      {/* basin side walls (X direction) */}
      <mesh
        position={[
          basinCenterX - basinD / 2 + wallThick / 2,
          (basinFloorY + counterTopY) / 2,
          centerZ,
        ]}
      >
        <boxGeometry args={[wallThick, basinDepth, basinW]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh
        position={[
          basinCenterX + basinD / 2 - wallThick / 2,
          (basinFloorY + counterTopY) / 2,
          centerZ,
        ]}
      >
        <boxGeometry args={[wallThick, basinDepth, basinW]} />
        <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* basin side walls (Z direction) */}
      {[-1, 1].map((sign) => (
        <mesh
          key={`sw${sign}`}
          position={[
            basinCenterX,
            (basinFloorY + counterTopY) / 2,
            centerZ + sign * (basinW / 2 - wallThick / 2),
          ]}
        >
          <boxGeometry args={[basinD, basinDepth, wallThick]} />
          <meshStandardMaterial color={C.sinkColor} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      {/* faucet: base puck + vertical neck + horizontal spout. Spout
          extends toward +facing (into the room). */}
      <group position={[backX + f * 0.04, counterTopY, centerZ]}>
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
          position={[f * 0.09, 0.19, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.016, 0.016, 0.18, 12]} />
          <meshStandardMaterial color={C.metalColor} metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

// Row of white base cabinets against a wall, with a drop-in sink on the
// northmost cabinet. Reusable across kitchens.
export function CabinetRow({ config }: { config: CabinetRowConfig }) {
  const C = config
  const bodies: number[] = []
  for (let i = 0; i < C.count; i++) {
    bodies.push(C.startZ + i * C.unitWidth)
  }
  const rowNorthEdge = bodies[0]! - C.unitWidth / 2
  const rowSouthEdge = bodies[bodies.length - 1]! + C.unitWidth / 2

  const sinkIdx = C.sinkIndex ?? 0
  const sinkCenterZ = bodies[sinkIdx]!
  const sinkHalf = 0.42 / 2
  const sinkNorthZ = sinkCenterZ - sinkHalf - 0.03
  const sinkSouthZ = sinkCenterZ + sinkHalf + 0.03

  return (
    <>
      {bodies.map((z, i) => (
        <RigidBody key={`cab-${i}`} type="fixed" colliders="cuboid">
          <CabinetBody centerZ={z} config={config} />
        </RigidBody>
      ))}
      <CounterSlab zMin={rowNorthEdge} zMax={sinkNorthZ} config={config} />
      <CounterSlab zMin={sinkSouthZ} zMax={rowSouthEdge} config={config} />
      <Sink centerZ={sinkCenterZ} config={config} />
    </>
  )
}
