import { RigidBody } from '@react-three/rapier'
import { COLORS, TV } from '../constants/gameConstants'

export function Television() {
  const [cx, cy, cz] = TV.center
  const [w, h, d] = TV.size
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[cx, cy, cz]}>
        <mesh castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={COLORS.tvBezel} />
        </mesh>
        <mesh position={[0, 0, d / 2 + 0.005]}>
          <planeGeometry args={[w - 0.15, h - 0.15]} />
          <meshStandardMaterial
            color={COLORS.tvScreen}
            emissive={COLORS.tvScreen}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
