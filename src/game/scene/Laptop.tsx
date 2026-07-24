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
}

// A stylized open laptop, shaped like a side-profile "L": a shallow horizontal
// base with a tall vertical screen hinged at the back edge and leaning ~8° back.
export function Laptop({ position, deskTopY, rotationY = 0, scale = 1 }: LaptopProps) {
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
      <mesh castShadow position={[0, baseH / 2, 0]}>
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
        <mesh castShadow position={[0, screenH / 2, screenT / 2]}>
          <boxGeometry args={[screenW, screenH, screenT]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, screenH / 2, screenT + 0.001]}>
          <planeGeometry args={[screenW - 0.025 * scale, screenH - 0.025 * scale]} />
          <meshStandardMaterial
            color="#2b6cb0"
            emissive="#3fa4ff"
            emissiveIntensity={0.35}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  )
}
