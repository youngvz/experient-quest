import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  ROOM_DEPTH,
  ROOM_WIDTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'

interface WallProps {
  position: [number, number, number]
  size: [number, number, number]
}

function Wall({ position, size }: WallProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={COLORS.wall} />
      </mesh>
    </RigidBody>
  )
}

export function Walls() {
  const y = WALL_HEIGHT / 2
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2
  return (
    <>
      <Wall position={[0, y, -halfD]} size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
      <Wall position={[0, y, halfD]} size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
      <Wall position={[-halfW, y, 0]} size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
      <Wall position={[halfW, y, 0]} size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
    </>
  )
}
