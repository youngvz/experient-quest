// A ceramic coffee mug — white or black, always full of coffee. Local +X
// points to the handle side; rotate the group so the handle faces the
// sitter. Sits on a desk — no collider.
export function Mug({
  position,
  deskTopY,
  rotationY = 0,
  scale = 1,
  color = 'white',
}: {
  position: [number, number]
  deskTopY: number
  rotationY?: number
  scale?: number
  color?: 'white' | 'black'
}) {
  const [x, z] = position
  const bodyR = 0.045 * scale
  const bodyH = 0.11 * scale
  const rimH = 0.006 * scale
  const handleR = 0.028 * scale
  const handleThickness = 0.008 * scale
  const isBlack = color === 'black'
  const bodyColor = isBlack ? '#1a1a1e' : '#f3efe8'
  const rimColor = isBlack ? '#0a0a0d' : '#d8d3c8'
  const coffeeColor = '#3a1f10'

  return (
    <group position={[x, deskTopY, z]} rotation={[0, rotationY, 0]}>
      {/* Body */}
      <mesh position={[0, bodyH / 2, 0]}>
        <cylinderGeometry args={[bodyR, bodyR * 0.92, bodyH, 18]} />
        <meshStandardMaterial color={bodyColor} roughness={0.55} />
      </mesh>
      {/* Rim ring (slightly darker/lighter than the body) */}
      <mesh position={[0, bodyH - rimH / 2, 0]}>
        <cylinderGeometry args={[bodyR * 1.02, bodyR * 1.02, rimH, 18]} />
        <meshStandardMaterial color={rimColor} roughness={0.55} />
      </mesh>
      {/* Coffee surface, just below the rim */}
      <mesh position={[0, bodyH - rimH - 0.002, 0]}>
        <cylinderGeometry args={[bodyR * 0.9, bodyR * 0.9, 0.002, 16]} />
        <meshStandardMaterial color={coffeeColor} roughness={0.4} />
      </mesh>
      {/* Handle — half-torus in the XY plane, ring plane containing the
          vertical axis. Attach points sit on the mug body surface at
          (bodyR, bodyH*0.55 ± handleR); arc peaks at bodyR + handleR. */}
      <mesh
        position={[bodyR, bodyH * 0.55, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <torusGeometry args={[handleR, handleThickness, 8, 20, Math.PI]} />
        <meshStandardMaterial color={bodyColor} roughness={0.55} />
      </mesh>
    </group>
  )
}
