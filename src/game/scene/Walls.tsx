import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  COLORS,
  DOOR,
  DOOR_HEIGHT,
  ROOM_DEPTH,
  ROOM_WIDTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'

// A rectangular "lintel" spanning the top of a doorway. Static — no collider,
// because the player physics box is shorter than the lintel is tall.
export function DoorHeader({
  position,
  width,
  spansX,
}: {
  position: [number, number]
  width: number
  spansX: boolean
}) {
  const headerHeight = WALL_HEIGHT - DOOR_HEIGHT
  const centerY = DOOR_HEIGHT + headerHeight / 2
  const [px, pz] = position
  const size: [number, number, number] = spansX
    ? [width, headerHeight, WALL_THICKNESS]
    : [WALL_THICKNESS, headerHeight, width]
  return (
    <mesh castShadow receiveShadow position={[px, centerY, pz]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={COLORS.wall} />
    </mesh>
  )
}

interface WallPanelProps {
  position: [number, number, number]
  size: [number, number, number]
  glass?: boolean
  // Number of visual sections the glass is split into. 3 sections = 2 mullions.
  // Defaults to auto (~1 mullion per MULLION_SPACING meters).
  divisions?: number
}

const FRAME_THICKNESS = 0.18
const MULLION_THICKNESS = 0.1
// One vertical divider per ~4 m of pane, minimum 1 divider per panel.
const MULLION_SPACING = 4

// Swap the face-width dimension so the frame math works whether the panel's
// wide axis is X (front/back walls) or Z (side walls).
function orient(
  isXFace: boolean,
  faceOffset: number,
  yOffset: number,
  thicknessOffset: number,
): [number, number, number] {
  return isXFace
    ? [faceOffset, yOffset, thicknessOffset]
    : [thicknessOffset, yOffset, faceOffset]
}

function orientSize(
  isXFace: boolean,
  faceSize: number,
  ySize: number,
  thicknessSize: number,
): [number, number, number] {
  return isXFace ? [faceSize, ySize, thicknessSize] : [thicknessSize, ySize, faceSize]
}

// A wall panel: physics collider is always present. When `glass` is true, the
// collider mesh is invisible and we build a framed window in its place — four
// opaque rails around the perimeter with a transmissive pane inside.
export function WallPanel({ position, size, glass = false, divisions }: WallPanelProps) {
  if (!glass) {
    return (
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={position} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>
    )
  }

  const [sx, sy, sz] = size
  const isXFace = sx >= sz
  const faceW = isXFace ? sx : sz
  const thickness = isXFace ? sz : sx
  const height = sy

  const F = FRAME_THICKNESS
  const paneFaceW = Math.max(0.01, faceW - 2 * F)
  const paneHeight = Math.max(0.01, height - 2 * F)
  const paneThickness = thickness * 0.55

  const [px, py, pz] = position

  const autoDivisions = Math.max(2, Math.round(paneFaceW / MULLION_SPACING))
  const sectionCount = Math.max(1, divisions ?? autoDivisions)
  const mullionCount = sectionCount - 1
  const mullionStep = paneFaceW / sectionCount
  const mullionOffsets = Array.from(
    { length: mullionCount },
    (_, i) => -paneFaceW / 2 + mullionStep * (i + 1),
  )

  return (
    <>
      {/* explicit collider — an invisible <mesh> would be skipped by auto-collider generation */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={position} />
      </RigidBody>

      {/* frame rails — opaque */}
      <group position={[px, py, pz]}>
        {/* top */}
        <mesh
          castShadow
          receiveShadow
          position={orient(isXFace, 0, height / 2 - F / 2, 0)}
        >
          <boxGeometry args={orientSize(isXFace, faceW, F, thickness)} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
        {/* bottom */}
        <mesh
          castShadow
          receiveShadow
          position={orient(isXFace, 0, -height / 2 + F / 2, 0)}
        >
          <boxGeometry args={orientSize(isXFace, faceW, F, thickness)} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
        {/* left */}
        <mesh
          castShadow
          receiveShadow
          position={orient(isXFace, -faceW / 2 + F / 2, 0, 0)}
        >
          <boxGeometry args={orientSize(isXFace, F, paneHeight, thickness)} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>
        {/* right */}
        <mesh
          castShadow
          receiveShadow
          position={orient(isXFace, faceW / 2 - F / 2, 0, 0)}
        >
          <boxGeometry args={orientSize(isXFace, F, paneHeight, thickness)} />
          <meshStandardMaterial color={COLORS.wall} />
        </mesh>

        {/* vertical mullions (dividers) — sit inside the glass pane's depth so
            the transmission material doesn't blur their edges */}
        {mullionOffsets.map((offset, i) => (
          <mesh
            key={`mullion-${i}`}
            castShadow
            receiveShadow
            position={orient(isXFace, offset, 0, 0)}
          >
            <boxGeometry
              args={orientSize(isXFace, MULLION_THICKNESS, paneHeight, paneThickness * 1.02)}
            />
            <meshStandardMaterial color={COLORS.wall} />
          </mesh>
        ))}

        {/* glass pane — physical material w/ transmission. No scene re-render
            per pane, unlike MeshTransmissionMaterial. */}
        <mesh>
          <boxGeometry args={orientSize(isXFace, paneFaceW, paneHeight, paneThickness)} />
          <meshPhysicalMaterial
            color="#eaf3f9"
            roughness={0.05}
            metalness={0}
            transmission={1}
            thickness={0.15}
            ior={1.05}
            attenuationColor="#cfe0ee"
            attenuationDistance={12}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </>
  )
}

export function Walls() {
  const y = WALL_HEIGHT / 2
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2

  const doorLeft = DOOR.centerX - DOOR.width / 2
  const doorRight = DOOR.centerX + DOOR.width / 2
  const frontLeftWidth = doorLeft - -halfW
  const frontRightWidth = halfW - doorRight
  const frontLeftCenterX = (-halfW + doorLeft) / 2
  const frontRightCenterX = (doorRight + halfW) / 2

  return (
    <>
      {/* back wall — glass, 3 sections */}
      <WallPanel
        position={[0, y, -halfD]}
        size={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]}
        glass
        divisions={3}
      />
      {/* front wall — glass, split around the doorway */}
      <WallPanel
        position={[frontLeftCenterX, y, halfD]}
        size={[frontLeftWidth, WALL_HEIGHT, WALL_THICKNESS]}
        glass
      />
      <WallPanel
        position={[frontRightCenterX, y, halfD]}
        size={[frontRightWidth, WALL_HEIGHT, WALL_THICKNESS]}
        glass
      />
      {/* west wall — glass */}
      <WallPanel
        position={[-halfW, y, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]}
        glass
      />
      {/* east wall — opaque so the TV reads clearly */}
      <WallPanel
        position={[halfW, y, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]}
      />
      {/* header lintel over the front doorway */}
      <DoorHeader position={[DOOR.centerX, halfD]} width={DOOR.width} spansX />
    </>
  )
}
