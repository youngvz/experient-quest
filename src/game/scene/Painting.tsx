import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { NearestFilter, RepeatWrapping, type Texture } from 'three'
import { RigidBody } from '@react-three/rapier'
import {
  COLORS,
  PAINTINGS_ATLAS_URL,
  PAINTINGS_TILES_PER_ROW,
  WALL_THICKNESS,
} from '../constants/gameConstants'

// A framed painting mounted on a wall.
//
// Two modes:
//   - `tile: number` picks a tile from the shared PAINTINGS_ATLAS_URL. UVs
//     are computed from `tile` % TILES_PER_ROW (column) and
//     Math.floor(tile / TILES_PER_ROW) (row). Rows count from the top,
//     matching how designers lay out atlases.
//   - `color: string` renders a solid-color canvas — cheap placeholder
//     that works before the atlas ships. When you author the atlas,
//     switch call sites to `tile` and the placeholder path can be
//     removed.
//
// Wall mounting mirrors Whiteboard/Television: pass `wallZ`+`centerX`
// for an X-running wall (Z-facing), or `wallX`+`centerZ` for a
// Z-running wall (X-facing). `facing` picks which side of the wall the
// canvas sits on.

type XWall = {
  centerX: number
  wallZ: number
}
type ZWall = {
  centerZ: number
  wallX: number
}
type CommonProps = {
  centerY: number
  size: [number, number]
  facing: 1 | -1
  rotationYOffset?: number
  frameColor?: string
}
type TileMode = { tile: number; color?: undefined }
type ColorMode = { color: string; tile?: undefined }

type PaintingProps = CommonProps & (XWall | ZWall) & (TileMode | ColorMode)

const FRAME_THICKNESS = 0.05 // depth from wall surface, in meters
const FRAME_BORDER = 0.06 // width of the frame around the canvas, in meters

export function Painting(props: PaintingProps) {
  const isXWall = 'wallZ' in props
  const [w, h] = props.size
  const facing = props.facing
  const surfaceOffset = WALL_THICKNESS / 2 + FRAME_THICKNESS / 2

  const position: [number, number, number] = isXWall
    ? [props.centerX, props.centerY, props.wallZ + facing * surfaceOffset]
    : [props.wallX + facing * surfaceOffset, props.centerY, props.centerZ]
  const rotationY = isXWall
    ? (facing === 1 ? 0 : Math.PI) + (props.rotationYOffset ?? 0)
    : (facing === 1 ? Math.PI / 2 : -Math.PI / 2) + (props.rotationYOffset ?? 0)

  const frame = props.frameColor ?? COLORS.paintingFrame

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* Frame — thin box, canvas plane sits on its +Z face */}
        <mesh castShadow>
          <boxGeometry args={[w, h, FRAME_THICKNESS]} />
          <meshStandardMaterial color={frame} roughness={0.7} />
        </mesh>
        {props.tile !== undefined ? (
          <TileCanvas
            width={w - FRAME_BORDER * 2}
            height={h - FRAME_BORDER * 2}
            tile={props.tile}
          />
        ) : (
          <ColorCanvas
            width={w - FRAME_BORDER * 2}
            height={h - FRAME_BORDER * 2}
            color={props.color!}
          />
        )}
      </group>
    </RigidBody>
  )
}

function TileCanvas({
  width,
  height,
  tile,
}: {
  width: number
  height: number
  tile: number
}) {
  const atlas = useTexture(PAINTINGS_ATLAS_URL) as Texture
  // Configure the texture once — useTexture returns the same instance,
  // so per-Painting mutation is safe as long as every Painting agrees on
  // filtering/wrap. If a future use wants smooth filtering, promote this
  // into a prop.
  const tex = useMemo(() => {
    atlas.magFilter = NearestFilter
    atlas.minFilter = NearestFilter
    atlas.wrapS = RepeatWrapping
    atlas.wrapT = RepeatWrapping
    atlas.generateMipmaps = false
    return atlas
  }, [atlas])

  // Per-instance UV window. We clone the texture to give this instance
  // its own offset/repeat without stomping other Painting instances.
  const uv = useMemo(() => {
    const t = tex.clone()
    t.needsUpdate = true
    const tiles = PAINTINGS_TILES_PER_ROW
    const col = tile % tiles
    const row = Math.floor(tile / tiles)
    t.repeat.set(1 / tiles, 1 / tiles)
    t.offset.set(col / tiles, 1 - (row + 1) / tiles)
    return t
  }, [tex, tile])

  return (
    <mesh position={[0, 0, FRAME_THICKNESS / 2 + 0.002]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={uv} toneMapped={false} />
    </mesh>
  )
}

function ColorCanvas({
  width,
  height,
  color,
}: {
  width: number
  height: number
  color: string
}) {
  return (
    <mesh position={[0, 0, FRAME_THICKNESS / 2 + 0.002]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}
