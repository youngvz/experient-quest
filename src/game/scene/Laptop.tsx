import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'

interface LaptopProps {
  // World XZ position where the laptop base sits.
  position: [number, number]
  // Height of the desk top the laptop rests on.
  deskTopY: number
  // Y-axis rotation in radians. 0 = screen faces +Z (north);
  // sitter looks at the screen from that +Z side.
  rotationY?: number
  // Optional scale multiplier (default 1).
  scale?: number
  // When true, the screen flashes between black and the default blue.
  flashing?: boolean
  // Half-period of the flash in seconds (time spent on each color).
  // Only used when `flashing` is true. Defaults to 0.5s.
  flashInterval?: number
}

// A stylized open laptop, shaped like a side-profile "L": a shallow horizontal
// base with a tall vertical screen hinged at the back edge and leaning ~8° back.
export function Laptop({
  position,
  deskTopY,
  rotationY = 0,
  scale = 1,
  flashing = false,
  flashInterval = 0.5,
}: LaptopProps) {
  const baseW = 0.38 * scale
  const baseD = 0.26 * scale
  const baseH = 0.02 * scale
  const screenW = baseW * 0.98
  const screenH = 0.34 * scale
  const screenT = 0.012 * scale
  // Slight backward lean; ~0 would be a perfect L, negative angles tilt the
  // top away from the sitter.
  const hingeTilt = -0.15

  const [x, z] = position

  return (
    <group position={[x, deskTopY, z]} rotation={[0, rotationY, 0]}>
      {/* base */}
      <mesh position={[0, baseH / 2, 0]}>
        <boxGeometry args={[baseW, baseH, baseD]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* keyboard inlay */}
      <mesh position={[0, baseH + 0.001, 0.02 * scale]}>
        <boxGeometry args={[baseW * 0.85, 0.002, baseD * 0.65]} />
        <meshStandardMaterial color="#0a0b0f" roughness={0.9} />
      </mesh>
      {/* screen — hinges at the back edge (local -Z) so the display faces +Z */}
      <group position={[0, baseH, -baseD / 2]} rotation={[hingeTilt, 0, 0]}>
        <mesh position={[0, screenH / 2, screenT / 2]}>
          <boxGeometry args={[screenW, screenH, screenT]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
        </mesh>
        {flashing ? (
          <FlashingScreen
            position={[0, screenH / 2, screenT + 0.001]}
            width={screenW - 0.025 * scale}
            height={screenH - 0.025 * scale}
            interval={flashInterval}
          />
        ) : (
          <mesh position={[0, screenH / 2, screenT + 0.001]}>
            <planeGeometry args={[screenW - 0.025 * scale, screenH - 0.025 * scale]} />
            <meshStandardMaterial
              color="#2b6cb0"
              emissive="#3fa4ff"
              emissiveIntensity={0.35}
              roughness={0.3}
            />
          </mesh>
        )}
      </group>
    </group>
  )
}

// Split so the useFrame + material animation only mount on the ~1 laptop
// that's actually flashing. Previously every laptop in the world (20+
// instances across the office) registered a useFrame that no-op'd every
// tick.
function FlashingScreen({
  position,
  width,
  height,
  interval,
}: {
  position: [number, number, number]
  width: number
  height: number
  interval: number
}) {
  const matRef = useRef<MeshStandardMaterial>(null)
  const elapsed = useRef(0)
  const on = useRef(true)
  useFrame((_, delta) => {
    const mat = matRef.current
    if (!mat) return
    elapsed.current += delta
    if (elapsed.current >= interval) {
      elapsed.current = 0
      on.current = !on.current
      if (on.current) {
        mat.color.set('#2b6cb0')
        mat.emissive.set('#3fa4ff')
        mat.emissiveIntensity = 0.35
      } else {
        mat.color.set('#000000')
        mat.emissive.set('#000000')
        mat.emissiveIntensity = 0
      }
    }
  })
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        ref={matRef}
        color="#2b6cb0"
        emissive="#3fa4ff"
        emissiveIntensity={0.35}
        roughness={0.3}
      />
    </mesh>
  )
}
