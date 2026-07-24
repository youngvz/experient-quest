interface PaperProps {
  position: [number, number]
  deskTopY: number
  rotationY?: number
  // Stack layer index — used to nudge Y so multiple sheets don't z-fight.
  layer?: number
  color?: string
}

// A single sheet of paper — thin flat rectangle, ~US letter proportions.
export function Paper({
  position,
  deskTopY,
  rotationY = 0,
  layer = 0,
  color = '#f5f2ea',
}: PaperProps) {
  const w = 0.216 // ~ letter width, 8.5"
  const d = 0.279 // ~ letter height, 11"
  const t = 0.001
  const [x, z] = position
  const y = deskTopY + t / 2 + layer * (t + 0.0005)

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  )
}
