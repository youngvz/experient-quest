interface MonitorProps {
  position: [number, number]
  deskTopY: number
  // 0 = screen faces +Z (a viewer stands on the +Z side and sees the display).
  rotationY?: number
  scale?: number
}

// A standing monitor: rectangular base + thin vertical stalk + wide screen.
export function Monitor({
  position,
  deskTopY,
  rotationY = 0,
  scale = 1,
}: MonitorProps) {
  const baseW = 0.36 * scale
  const baseD = 0.24 * scale
  const baseH = 0.02 * scale
  const stalkW = 0.06 * scale
  const stalkH = 0.2 * scale
  const stalkD = 0.05 * scale
  const screenW = 0.8 * scale
  const screenH = 0.4 * scale
  const screenT = 0.025 * scale
  const [x, z] = position

  return (
    <group position={[x, deskTopY, z]} rotation={[0, rotationY, 0]}>
      {/* footprint base */}
      <mesh castShadow position={[0, baseH / 2, 0]}>
        <boxGeometry args={[baseW, baseH, baseD]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* stalk */}
      <mesh castShadow position={[0, baseH + stalkH / 2, 0]}>
        <boxGeometry args={[stalkW, stalkH, stalkD]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* screen — top of stalk */}
      <group position={[0, baseH + stalkH + screenH / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[screenW, screenH, screenT]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0, screenT / 2 + 0.001]}>
          <planeGeometry args={[screenW - 0.03 * scale, screenH - 0.03 * scale]} />
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
