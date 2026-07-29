import { COLORS } from '../constants/gameConstants'

// A stylized desktop fax/multifunction printer. Sits on a desk surface;
// no collider (the desk already blocks the player). Local +Z = paper-out
// direction; face into the room by rotating the group.
export function FaxMachine({
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
  const w = 0.55 * scale
  const d = 0.42 * scale
  const bodyH = 0.22 * scale
  const controlH = 0.06 * scale
  const trayH = 0.02 * scale
  const trayD = 0.16 * scale
  const slotH = 0.008 * scale
  const slotW = w * 0.7

  return (
    <group position={[x, deskTopY, z]} rotation={[0, rotationY, 0]}>
      {/* Main body */}
      <mesh position={[0, bodyH / 2, 0]}>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial color={COLORS.faxBody} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Angled top control panel */}
      <mesh position={[0, bodyH + controlH / 2, -d * 0.15]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[w * 0.92, controlH, d * 0.55]} />
        <meshStandardMaterial color={COLORS.faxAccent} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Small emissive display strip on the control panel */}
      <mesh
        position={[-w * 0.15, bodyH + controlH / 2 + 0.001, -d * 0.15]}
        rotation={[-0.35, 0, 0]}
      >
        <planeGeometry args={[w * 0.25, controlH * 0.55]} />
        <meshStandardMaterial
          color="#0f2a44"
          emissive="#3fa4ff"
          emissiveIntensity={0.5}
          roughness={0.3}
        />
      </mesh>
      {/* Paper-out slot (thin recessed dark plane on +Z face) */}
      <mesh position={[0, bodyH * 0.55, d / 2 + 0.001]}>
        <planeGeometry args={[slotW, slotH]} />
        <meshStandardMaterial color={COLORS.faxAccent} roughness={0.9} />
      </mesh>
      {/* Output paper tray protruding on +Z */}
      <mesh position={[0, bodyH * 0.45, d / 2 + trayD / 2]}>
        <boxGeometry args={[slotW, trayH, trayD]} />
        <meshStandardMaterial color={COLORS.faxBody} roughness={0.55} />
      </mesh>
      {/* A single sheet of paper sitting on the tray */}
      <mesh position={[0, bodyH * 0.45 + trayH / 2 + 0.001, d / 2 + trayD * 0.55]}>
        <boxGeometry args={[slotW * 0.85, 0.002, trayD * 0.8]} />
        <meshStandardMaterial color={COLORS.faxPaper} roughness={0.9} />
      </mesh>
    </group>
  )
}
