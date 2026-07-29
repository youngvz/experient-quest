import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../constants/gameConstants'

// A short 3- or 4-drawer filing cabinet. Local +X faces the drawer fronts;
// place it against a wall so the drawers face into the room. Wrap in a
// fixed RigidBody — cabinets block player movement.
export function FilingCabinet({
  position,
  rotationY = 0,
  drawers = 3,
  scale = 1,
}: {
  position: [number, number]
  rotationY?: number
  drawers?: 2 | 3 | 4
  scale?: number
}) {
  const [x, z] = position
  const width = 0.5 * scale
  const depth = 0.6 * scale
  const height = (drawers === 4 ? 1.35 : drawers === 3 ? 1.05 : 0.75) * scale
  const drawerFace = 0.005
  const drawerH = (height - 0.05) / drawers
  const handleW = width * 0.35
  const handleH = 0.03 * scale
  const handleD = 0.02 * scale

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
        <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={COLORS.filingCabinet} roughness={0.6} metalness={0.2} />
        </mesh>
        {Array.from({ length: drawers }).map((_, i) => {
          const centerY = 0.025 + drawerH * (i + 0.5)
          return (
            <group key={i}>
              <mesh position={[0, centerY, depth / 2 + drawerFace / 2]}>
                <boxGeometry args={[width - 0.04, drawerH - 0.03, drawerFace]} />
                <meshStandardMaterial
                  color={COLORS.filingCabinetDrawer}
                  roughness={0.55}
                  metalness={0.2}
                />
              </mesh>
              <mesh position={[0, centerY, depth / 2 + drawerFace + handleD / 2]}>
                <boxGeometry args={[handleW, handleH, handleD]} />
                <meshStandardMaterial
                  color={COLORS.filingCabinetHandle}
                  roughness={0.4}
                  metalness={0.6}
                />
              </mesh>
            </group>
          )
        })}
      </group>
    </RigidBody>
  )
}
