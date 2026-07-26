import { useMemo } from 'react'
import * as THREE from 'three'
import {
  CENTRAL_CORRIDOR,
  DOOR_HEIGHT,
  THE_BAKERY,
  THE_BAKERY_SOUTH_DOOR,
  THE_BAKERY_SOUTH_WINDOWS,
  THE_COMMONS,
  THE_LIBRARY,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'

// Overlay for the exterior side of the building's south face: a red-brick
// cladding across the opaque wall stretches of CentralCorridor + TheBakery,
// with an orange corrugated-metal canopy above each south doorway. The
// underlying <WallPanel> colliders still carry physics — this is purely a
// visual skin sitting a few millimeters south of the wall surface.

const BRICK_TILE_M_U = 2 // one texture tile spans 2m along the wall
const BRICK_TILE_M_V = 1 // and 1m vertically
// Exterior brick face sits just south of the wall's own south surface.
const FACADE_EPS = 0.005

function useBrickTexture() {
  return useMemo(() => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const g = c.getContext('2d')!
    // mortar
    g.fillStyle = '#2f1d13'
    g.fillRect(0, 0, size, size)
    // running-bond bricks
    const rows = 10
    const cols = 4
    const bW = size / cols
    const bH = size / rows
    const mortar = 3
    const palette = ['#7a3323', '#8c3d29', '#6b2b1c', '#9a4a34', '#7f3624', '#5b2415']
    for (let r = 0; r < rows; r++) {
      const y = r * bH
      const off = r % 2 === 0 ? 0 : bW / 2
      for (let col = -1; col <= cols; col++) {
        const x = col * bW + off
        const p = palette[(r * 7 + (col + 100) * 3) % palette.length]!
        g.fillStyle = p
        g.fillRect(x + mortar / 2, y + mortar / 2, bW - mortar, bH - mortar)
      }
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.anisotropy = 4
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function BrickPanel({
  x1,
  x2,
  y1,
  y2,
  z,
  tex,
}: {
  x1: number
  x2: number
  y1: number
  y2: number
  z: number
  tex: THREE.Texture
}) {
  const w = x2 - x1
  const h = y2 - y1
  const localTex = useMemo(() => {
    const t = tex.clone()
    t.needsUpdate = true
    t.repeat.set(w / BRICK_TILE_M_U, h / BRICK_TILE_M_V)
    return t
  }, [tex, w, h])
  return (
    <mesh position={[(x1 + x2) / 2, (y1 + y2) / 2, z]} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={localTex} roughness={0.9} metalness={0} />
    </mesh>
  )
}

// Slanted corrugated-metal awning above a doorway. Mounts a hair below the
// wall top, angles down toward the south, and projects `depth` meters out.
function Canopy({
  x,
  z,
  width,
  depth,
}: {
  x: number
  z: number
  width: number
  depth: number
}) {
  const mountY = WALL_HEIGHT + 0.8
  const tilt = 0.22 // +X rotation drops the far (south) edge
  const ridges = Math.max(8, Math.round(width * 4))
  const ridgeW = (width / ridges) * 0.55
  return (
    <group position={[x, mountY, z]} rotation={[tilt, 0, 0]}>
      {/* base slab */}
      <mesh position={[0, 0, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color="#c8541f" roughness={0.55} metalness={0.15} />
      </mesh>
      {/* corrugation ridges */}
      {Array.from({ length: ridges }, (_, i) => {
        const rx = -width / 2 + (i + 0.5) * (width / ridges)
        return (
          <mesh key={i} position={[rx, 0.045, depth / 2]}>
            <boxGeometry args={[ridgeW, 0.04, depth]} />
            <meshStandardMaterial color="#e3722a" roughness={0.5} metalness={0.15} />
          </mesh>
        )
      })}
      {/* south drip edge */}
      <mesh position={[0, -0.06, depth]} castShadow>
        <boxGeometry args={[width, 0.14, 0.05]} />
        <meshStandardMaterial color="#8a3610" roughness={0.75} />
      </mesh>
      {/* side trims */}
      <mesh position={[-width / 2, -0.02, depth / 2]}>
        <boxGeometry args={[0.05, 0.16, depth]} />
        <meshStandardMaterial color="#8a3610" roughness={0.75} />
      </mesh>
      <mesh position={[width / 2, -0.02, depth / 2]}>
        <boxGeometry args={[0.05, 0.16, depth]} />
        <meshStandardMaterial color="#8a3610" roughness={0.75} />
      </mesh>
    </group>
  )
}

export function SouthFacade() {
  const tex = useBrickTexture()

  // Exterior face Z. Both walls' south face sits at CENTRAL_CORRIDOR.southZ +
  // WALL_THICKNESS/2 (the corridor's south face and the bakery's south face
  // are coplanar by design).
  const wallSouthZ = CENTRAL_CORRIDOR.southZ + WALL_THICKNESS / 2 + FACADE_EPS

  // --- CentralCorridor south wall ---
  const cWestX = CENTRAL_CORRIDOR.westX
  const cEastX = CENTRAL_CORRIDOR.eastX
  const cDoorCenterX = (cWestX + cEastX) / 2
  const cDoorLo = cDoorCenterX - CENTRAL_CORRIDOR.southDoorWidth / 2
  const cDoorHi = cDoorCenterX + CENTRAL_CORRIDOR.southDoorWidth / 2

  // --- TheBakery south wall ---
  const bWestX = THE_BAKERY.centerX - THE_BAKERY.width / 2
  const bEastX = THE_BAKERY.centerX + THE_BAKERY.width / 2
  const bDoorLo = THE_BAKERY_SOUTH_DOOR.centerX - THE_BAKERY_SOUTH_DOOR.width / 2
  const bDoorHi = THE_BAKERY_SOUTH_DOOR.centerX + THE_BAKERY_SOUTH_DOOR.width / 2

  // Windows expressed as [lo, hi] X-ranges.
  const windows: [number, number][] = THE_BAKERY_SOUTH_WINDOWS.map(
    ([c, w]) => [c - w / 2, c + w / 2],
  )

  // Opaque wall stretches (get full-height brick).
  const cutouts: [number, number][] = (
    [[bDoorLo, bDoorHi], ...windows] as [number, number][]
  ).sort((a, b) => a[0] - b[0])
  const bakeryOpaque: [number, number][] = []
  let cursor = bWestX
  for (const [lo, hi] of cutouts) {
    if (lo - cursor > 0.01) bakeryOpaque.push([cursor, lo])
    cursor = hi
  }
  if (bEastX - cursor > 0.01) bakeryOpaque.push([cursor, bEastX])

  return (
    <group>
      {/* CentralCorridor south wall — flanks (full height) */}
      <BrickPanel x1={cWestX} x2={cDoorLo} y1={0} y2={WALL_HEIGHT} z={wallSouthZ} tex={tex} />
      <BrickPanel x1={cDoorHi} x2={cEastX} y1={0} y2={WALL_HEIGHT} z={wallSouthZ} tex={tex} />
      {/* Corridor door header — brick strip above the doorway */}
      <BrickPanel
        x1={cDoorLo}
        x2={cDoorHi}
        y1={DOOR_HEIGHT}
        y2={WALL_HEIGHT}
        z={wallSouthZ}
        tex={tex}
      />

      {/* TheBakery south wall — brick between windows/doorway (full
          height). Stops at the door: everything east of bDoorHi stays
          bare so the storefront row of glass reads without brick. */}
      {bakeryOpaque
        .filter(([, x2]) => x2 <= bDoorHi + 0.001)
        .map(([x1, x2], i) => (
          <BrickPanel
            key={`bakery-${i}`}
            x1={x1}
            x2={x2}
            y1={0}
            y2={WALL_HEIGHT}
            z={wallSouthZ}
            tex={tex}
          />
        ))}
      {/* Bakery door header */}
      <BrickPanel
        x1={bDoorLo}
        x2={bDoorHi}
        y1={DOOR_HEIGHT}
        y2={WALL_HEIGHT}
        z={wallSouthZ}
        tex={tex}
      />

      {/* TheLibrary + TheCommons south walls — full-height brick on the
          exterior face. Neither has a south-wall doorway or windows. */}
      <BrickPanel
        x1={THE_LIBRARY.westX}
        x2={THE_LIBRARY.eastX}
        y1={0}
        y2={WALL_HEIGHT}
        z={THE_LIBRARY.southZ + WALL_THICKNESS / 2 + FACADE_EPS}
        tex={tex}
      />
      <BrickPanel
        x1={THE_COMMONS.westX}
        x2={THE_COMMONS.eastX}
        y1={0}
        y2={WALL_HEIGHT}
        z={THE_COMMONS.southZ + WALL_THICKNESS / 2 + FACADE_EPS}
        tex={tex}
      />

      {/* Single orange canopy spanning from the corridor's south door
          across to the bakery's south door. */}
      {(() => {
        const spanLo = cDoorCenterX - CENTRAL_CORRIDOR.southDoorWidth / 2 - 0.8
        const spanHi = THE_BAKERY_SOUTH_DOOR.centerX + THE_BAKERY_SOUTH_DOOR.width / 2 + 0.3
        return (
          <Canopy
            x={(spanLo + spanHi) / 2}
            z={wallSouthZ}
            width={spanHi - spanLo}
            depth={1.6}
          />
        )
      })()}
    </group>
  )
}
