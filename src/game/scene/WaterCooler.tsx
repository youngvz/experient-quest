import { RigidBody } from '@react-three/rapier'
import { COLORS } from '../constants/gameConstants'

// Office water cooler: tall dispenser base + inverted water bottle on top.
// Local +X faces the spigot; place with `rotationY` so the spigot points
// into the room. Fixed collider — the player can't walk through it.
export function WaterCooler({
  position,
  rotationY = 0,
  scale = 1,
}: {
  position: [number, number]
  rotationY?: number
  scale?: number
}) {
  const [x, z] = position
  const baseH = 1.0 * scale
  const baseR = 0.22 * scale
  const shoulderH = 0.06 * scale
  const shoulderR = 0.19 * scale
  const bottleH = 0.5 * scale
  const bottleR = 0.18 * scale
  const spigotR = 0.02 * scale
  const spigotLen = 0.08 * scale

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
        {/* Base dispenser */}
        <mesh castShadow receiveShadow position={[0, baseH / 2, 0]}>
          <cylinderGeometry args={[baseR, baseR, baseH, 20]} />
          <meshStandardMaterial color={COLORS.waterCoolerBody} roughness={0.55} />
        </mesh>
        {/* Tapered shoulder that receives the bottle */}
        <mesh position={[0, baseH + shoulderH / 2, 0]}>
          <cylinderGeometry args={[shoulderR, baseR, shoulderH, 20]} />
          <meshStandardMaterial color={COLORS.waterCoolerBody} roughness={0.55} />
        </mesh>
        {/* Water bottle (tinted, translucent-ish look via low roughness) */}
        <mesh position={[0, baseH + shoulderH + bottleH / 2, 0]}>
          <cylinderGeometry args={[bottleR, bottleR, bottleH, 20]} />
          <meshStandardMaterial
            color={COLORS.waterCoolerTank}
            roughness={0.15}
            metalness={0.05}
          />
        </mesh>
        {/* Spigot horn on the +X face */}
        <mesh
          position={[baseR + spigotLen / 2, baseH * 0.55, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[spigotR, spigotR, spigotLen, 12]} />
          <meshStandardMaterial
            color={COLORS.waterCoolerSpigot}
            roughness={0.35}
            metalness={0.7}
          />
        </mesh>
        {/* Drip tray plane just under the spigot */}
        <mesh position={[baseR + spigotLen / 2, baseH * 0.5, 0]}>
          <boxGeometry args={[0.12 * scale, 0.01 * scale, 0.14 * scale]} />
          <meshStandardMaterial color={COLORS.waterCoolerSpigot} roughness={0.5} />
        </mesh>
      </group>
    </RigidBody>
  )
}
