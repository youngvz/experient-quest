import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../constants/gameConstants'

// A 2- or 3-seat sofa built entirely from primitives. Local +Z is the
// facing direction (the way a sitter looks). Wrap in a fixed RigidBody
// — sofas block the player. Colors read from COLORS.sofaFrame /
// COLORS.sofaCushion so the whole set can be retinted from one place.
export function Sofa({
  position,
  rotationY = 0,
  seatCount = 3,
  scale = 1,
  frameColor,
  cushionColor,
}: {
  position: [number, number]
  rotationY?: number
  seatCount?: 3 | 4
  scale?: number
  frameColor?: string
  cushionColor?: string
}) {
  const [x, z] = position
  const cushionW = 0.65 * scale
  const gap = 0.02 * scale
  const armW = 0.18 * scale
  const width = seatCount * cushionW + (seatCount - 1) * gap + 2 * armW
  const depth = 0.9 * scale
  const seatH = 0.42 * scale
  const seatThickness = 0.14 * scale
  const backH = 0.5 * scale
  const backThickness = 0.14 * scale
  const armH = seatH + 0.14 * scale
  const footH = 0.08 * scale
  const footR = 0.03 * scale

  const frame = frameColor ?? COLORS.sofaFrame
  const cushion = cushionColor ?? COLORS.sofaCushion

  // Cushion X centers, spread symmetrically about local X=0.
  const cushionCenters: number[] = []
  const innerWidth = seatCount * cushionW + (seatCount - 1) * gap
  const start = -innerWidth / 2 + cushionW / 2
  for (let i = 0; i < seatCount; i++) {
    cushionCenters.push(start + i * (cushionW + gap))
  }

  // Foot positions (four corners inside the frame).
  const footInset = 0.08 * scale
  const footX = width / 2 - footInset - footR
  const footZ = depth / 2 - footInset - footR

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
        {/* Seat base slab (frame color) */}
        <mesh castShadow receiveShadow position={[0, footH + seatThickness / 2, 0]}>
          <boxGeometry args={[width, seatThickness, depth]} />
          <meshStandardMaterial color={frame} roughness={0.7} />
        </mesh>
        {/* Individual seat cushions on top */}
        {cushionCenters.map((cx, i) => (
          <mesh
            key={i}
            castShadow
            position={[cx, footH + seatThickness + 0.05 * scale, 0.02 * scale]}
          >
            <boxGeometry args={[cushionW, 0.1 * scale, depth - 0.1 * scale]} />
            <meshStandardMaterial color={cushion} roughness={0.85} />
          </mesh>
        ))}
        {/* Backrest */}
        <mesh
          castShadow
          receiveShadow
          position={[0, footH + seatThickness + backH / 2, -depth / 2 + backThickness / 2]}
        >
          <boxGeometry args={[width, backH, backThickness]} />
          <meshStandardMaterial color={frame} roughness={0.7} />
        </mesh>
        {/* Back-cushion pillows (one per seat) */}
        {cushionCenters.map((cx, i) => (
          <mesh
            key={`b${i}`}
            castShadow
            position={[
              cx,
              footH + seatThickness + backH * 0.55,
              -depth / 2 + backThickness + 0.05 * scale,
            ]}
          >
            <boxGeometry args={[cushionW * 0.95, backH * 0.75, 0.1 * scale]} />
            <meshStandardMaterial color={cushion} roughness={0.85} />
          </mesh>
        ))}
        {/* Left armrest */}
        <mesh
          castShadow
          receiveShadow
          position={[-width / 2 + armW / 2, footH + armH / 2, 0]}
        >
          <boxGeometry args={[armW, armH, depth]} />
          <meshStandardMaterial color={frame} roughness={0.7} />
        </mesh>
        {/* Right armrest */}
        <mesh
          castShadow
          receiveShadow
          position={[width / 2 - armW / 2, footH + armH / 2, 0]}
        >
          <boxGeometry args={[armW, armH, depth]} />
          <meshStandardMaterial color={frame} roughness={0.7} />
        </mesh>
        {/* Feet (four short cylinders) */}
        {[
          [-footX, -footZ],
          [footX, -footZ],
          [-footX, footZ],
          [footX, footZ],
        ].map(([fx, fz], i) => (
          <mesh key={`f${i}`} castShadow position={[fx, footH / 2, fz]}>
            <cylinderGeometry args={[footR, footR, footH, 10]} />
            <meshStandardMaterial color={frame} roughness={0.6} metalness={0.2} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}
