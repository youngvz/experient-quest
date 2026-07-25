import { COLORS } from '../constants/gameConstants'

// Desktop telephone: a shallow base with a keypad face and a handset
// cradled on top. Local +Z faces the person picking it up; rotate the
// group so the keypad points toward the sitter. No collider.
export function Telephone({
  position,
  deskTopY,
  rotationY = 0,
  scale = 1,
}: {
  position: [number, number]
  deskTopY: number
  rotationY?: number
  scale?: number
}) {
  const [x, z] = position
  const baseW = 0.22 * scale
  const baseD = 0.28 * scale
  const baseH = 0.05 * scale
  const handsetW = baseW * 0.85
  const handsetH = 0.045 * scale
  const handsetD = 0.06 * scale
  const earpieceW = 0.05 * scale

  return (
    <group position={[x, deskTopY, z]} rotation={[0, rotationY, 0]}>
      {/* Base */}
      <mesh castShadow position={[0, baseH / 2, 0]}>
        <boxGeometry args={[baseW, baseH, baseD]} />
        <meshStandardMaterial color={COLORS.telephoneBody} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Keypad face inset */}
      <mesh position={[0, baseH + 0.001, baseD * 0.15]}>
        <planeGeometry args={[baseW * 0.7, baseD * 0.55]} />
        <meshStandardMaterial color={COLORS.telephoneAccent} roughness={0.7} />
      </mesh>
      {/* Handset body sitting on top */}
      <mesh castShadow position={[0, baseH + handsetH / 2, -baseD * 0.15]}>
        <boxGeometry args={[handsetW, handsetH, handsetD]} />
        <meshStandardMaterial color={COLORS.telephoneBody} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Earpiece bump (mouthpiece is symmetrical on the other end) */}
      <mesh castShadow position={[-handsetW / 2 + earpieceW / 2, baseH + handsetH / 2, -baseD * 0.15]}>
        <boxGeometry args={[earpieceW, handsetH * 1.4, handsetD * 1.4]} />
        <meshStandardMaterial color={COLORS.telephoneBody} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh castShadow position={[handsetW / 2 - earpieceW / 2, baseH + handsetH / 2, -baseD * 0.15]}>
        <boxGeometry args={[earpieceW, handsetH * 1.4, handsetD * 1.4]} />
        <meshStandardMaterial color={COLORS.telephoneBody} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Coiled cord — thin torus tucked behind the base */}
      <mesh position={[baseW * 0.35, baseH + 0.015, -baseD * 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.03 * scale, 0.006 * scale, 6, 20]} />
        <meshStandardMaterial color={COLORS.telephoneAccent} roughness={0.6} />
      </mesh>
    </group>
  )
}
