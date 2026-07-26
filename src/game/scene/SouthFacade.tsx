import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  CENTRAL_CORRIDOR,
  DOOR_HEIGHT,
  THE_ATRIUM,
  THE_BAKERY,
  THE_BAKERY_SOUTH_DOOR,
  THE_BAKERY_SOUTH_WINDOWS,
  THE_COMMONS,
  THE_LIBRARY,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../constants/gameConstants'
import { useGameStore } from '../state/gameStore'

// Overlay for the exterior side of the building's south face: a red-brick
// cladding across the opaque wall stretches of CentralCorridor + TheBakery,
// with an orange corrugated-metal canopy above each south doorway. The
// underlying <WallPanel> colliders still carry physics — this is purely a
// visual skin sitting a few millimeters south of the wall surface.

const BRICK_TILE_M_U = 2 // one texture tile spans 2m along the wall
const BRICK_TILE_M_V = 1 // and 1m vertically
// Exterior brick face sits just south of the wall's own south surface.
const FACADE_EPS = 0.005

// 5×7 pixel bitmaps for digits — no font dependency, guaranteed block
// style. Each row is a 5-char string; '1' = lit, '.' = clear.
const DIGIT_GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
}

// Renders digit lines as pure canvas rects using a hand-authored 5×7 pixel
// grid — no browser font involved, so it looks identical everywhere and
// matches the game's pixel-art vibe. NearestFilter keeps the blocks crisp.
function useNumberTexture(lines: string[]) {
  return useMemo(() => {
    const GLYPH_W = 5
    const GLYPH_H = 7
    const CHAR_GAP = 1 // pixels between characters
    const LINE_GAP = 2 // pixels between rows
    const PADDING = 2 // outer padding
    const cols = Math.max(...lines.map((l) => l.length))
    const gridW = cols * GLYPH_W + (cols - 1) * CHAR_GAP
    const gridH = lines.length * GLYPH_H + (lines.length - 1) * LINE_GAP
    // Scale each source pixel up 8× so the canvas has real resolution and
    // NearestFilter magnification stays razor-sharp.
    const SCALE = 8
    const canvasW = (gridW + PADDING * 2) * SCALE
    const canvasH = (gridH + PADDING * 2) * SCALE

    const c = document.createElement('canvas')
    c.width = canvasW
    c.height = canvasH
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    g.clearRect(0, 0, canvasW, canvasH)
    g.fillStyle = '#f4f0e6'

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]!
      // Center this line horizontally within the grid.
      const lineW = line.length * GLYPH_W + (line.length - 1) * CHAR_GAP
      const offsetX = PADDING + (gridW - lineW) / 2
      const offsetY = PADDING + li * (GLYPH_H + LINE_GAP)
      for (let ci = 0; ci < line.length; ci++) {
        const glyph = DIGIT_GLYPHS[line[ci]!]
        if (!glyph) continue
        const gx = offsetX + ci * (GLYPH_W + CHAR_GAP)
        for (let row = 0; row < GLYPH_H; row++) {
          const rowStr = glyph[row]!
          for (let col = 0; col < GLYPH_W; col++) {
            if (rowStr[col] === '1') {
              g.fillRect((gx + col) * SCALE, (offsetY + row) * SCALE, SCALE, SCALE)
            }
          }
        }
      }
    }

    const tex = new THREE.CanvasTexture(c)
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [lines])
}

function BuildingNumber({
  x,
  z,
  centerY,
  width,
  height,
  lines,
}: {
  x: number
  z: number
  centerY: number
  width: number
  height: number
  lines: string[]
}) {
  const tex = useNumberTexture(lines)
  return (
    <mesh position={[x, centerY, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function useBrickTexture() {
  return useMemo(() => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const g = c.getContext('2d')!
    // mortar — dark warm brown
    g.fillStyle = '#3a2a22'
    g.fillRect(0, 0, size, size)
    // running-bond bricks — muted red-brown palette (still reads red,
    // pulled back toward brick-dust so the saturation isn't punchy).
    const rows = 10
    const cols = 4
    const bW = size / cols
    const bH = size / rows
    const mortar = 3
    const palette = ['#8a5548', '#96604f', '#7a4a3f', '#a06856', '#835045', '#6d4238']
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

// Z-oriented brick panel — for exterior walls that face -X or +X.
// `facing` = -1 for a west-facing wall (normal points -X), +1 for east.
function BrickPanelZ({
  z1,
  z2,
  y1,
  y2,
  x,
  facing,
  tex,
}: {
  z1: number
  z2: number
  y1: number
  y2: number
  x: number
  facing: 1 | -1
  tex: THREE.Texture
}) {
  const w = z2 - z1
  const h = y2 - y1
  const localTex = useMemo(() => {
    const t = tex.clone()
    t.needsUpdate = true
    t.repeat.set(w / BRICK_TILE_M_U, h / BRICK_TILE_M_V)
    return t
  }, [tex, w, h])
  // -Math.PI/2 orients a plane's +Z normal along -X (west-facing).
  // +Math.PI/2 flips it to face +X.
  const rotationY = facing === -1 ? -Math.PI / 2 : Math.PI / 2
  return (
    <mesh
      position={[x, (y1 + y2) / 2, (z1 + z2) / 2]}
      rotation={[0, rotationY, 0]}
      receiveShadow
    >
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={localTex} roughness={0.9} metalness={0} />
    </mesh>
  )
}

// Slanted corrugated-metal awning above a doorway. Mounts a hair below the
// wall top, angles down toward the south, and projects `depth` meters out.
// Exported so the JSX below can stay commented-out without tripping
// TS `noUnusedLocals`.
export function Canopy({
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
  const mountY = WALL_HEIGHT + 0.4
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

// Fades a subtree's materials in/out based on whether the player is
// outside. Used to hide the raised roof/canopy the moment the player
// steps inside the building — otherwise the tall canopy pokes above
// the interior geometry when the camera pans up. Exported so it can
// stay while the canopy JSX is temporarily commented out.
export function OutsideOnlyFade({
  children,
  duration = 0.4,
}: {
  children: React.ReactNode
  duration?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const captured = useRef<Array<[THREE.Material, number, boolean]> | null>(null)
  const current = useRef(1)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    if (captured.current === null) {
      const list: Array<[THREE.Material, number, boolean]> = []
      const seen = new Set<THREE.Material>()
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) {
          if (!m || seen.has(m)) continue
          seen.add(m)
          list.push([m, m.opacity, m.transparent])
        }
      })
      captured.current = list
    }

    const zone = useGameStore.getState().activeZone
    // Anything not on the outside apron counts as "inside" — fade out.
    const outside = zone === 'office' || zone === 'outdoor'
    const target = outside ? 1 : 0
    const step = delta / duration
    if (current.current < target) current.current = Math.min(target, current.current + step)
    else if (current.current > target) current.current = Math.max(target, current.current - step)

    const t = current.current
    for (const [mat, originalOpacity] of captured.current) {
      const opaqueEnough = t >= 0.999
      mat.transparent = !opaqueEnough
      mat.opacity = originalOpacity * t
      mat.depthWrite = opaqueEnough
    }
    group.visible = t > 0.001
  })

  return <group ref={groupRef}>{children}</group>
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
      {/* CentralCorridor south wall — flanks (base 0→WALL_HEIGHT) */}
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

      {/* TheBakery south wall — brick between windows/doorway. Stops at
          the door: everything east of bDoorHi stays bare so the
          storefront row of glass reads without brick. */}
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
      {/* No brick above the bakery south door — leaves the header
          reading as the underlying dark wall/glass rather than brick. */}

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

      {/* West exterior — brick cladding on the -X face of TheCommons,
          TheLibrary, and TheAtrium. All three share the same wall plane
          (X = WEST_ROOM_WEST_X = -19). Each panel is a full-height
          brick strip covering the room's Z-span. */}
      <BrickPanelZ
        z1={THE_COMMONS.northZ}
        z2={THE_COMMONS.southZ}
        y1={0}
        y2={WALL_HEIGHT}
        x={THE_COMMONS.westX - WALL_THICKNESS / 2 - FACADE_EPS}
        facing={-1}
        tex={tex}
      />
      <BrickPanelZ
        z1={THE_LIBRARY.northZ}
        z2={THE_LIBRARY.southZ}
        y1={0}
        y2={WALL_HEIGHT}
        x={THE_LIBRARY.westX - WALL_THICKNESS / 2 - FACADE_EPS}
        facing={-1}
        tex={tex}
      />
      <BrickPanelZ
        z1={THE_ATRIUM.northZ}
        z2={THE_ATRIUM.southZ}
        y1={0}
        y2={WALL_HEIGHT}
        x={THE_ATRIUM.westX - WALL_THICKNESS / 2 - FACADE_EPS}
        facing={-1}
        tex={tex}
      />

      {/* Central corridor's west exterior wall — the stretches between
          west-side rooms (Commons, Library, Atrium) sit exposed to open
          air. Clad them in brick so the seams read as continuous with
          the room walls above/below. */}
      {(() => {
        // Sort rooms south → north (largest Z first in our -Z=north
        // convention, so numerically ascending Z is north → south).
        const rooms = [THE_ATRIUM, THE_LIBRARY, THE_COMMONS]
          .map((r) => ({ northZ: r.northZ, southZ: r.southZ }))
          .sort((a, b) => a.northZ - b.northZ)
        const gaps: [number, number][] = []
        let cursor = CENTRAL_CORRIDOR.northZ
        for (const r of rooms) {
          if (r.northZ - cursor > 0.01) gaps.push([cursor, r.northZ])
          cursor = r.southZ
        }
        if (CENTRAL_CORRIDOR.southZ - cursor > 0.01)
          gaps.push([cursor, CENTRAL_CORRIDOR.southZ])
        const corridorWestOuter =
          CENTRAL_CORRIDOR.westX - WALL_THICKNESS / 2 - FACADE_EPS
        return gaps.map(([z1, z2], i) => (
          <BrickPanelZ
            key={`corridor-west-${i}`}
            z1={z1}
            z2={z2}
            y1={0}
            y2={WALL_HEIGHT}
            x={corridorWestOuter}
            facing={-1}
            tex={tex}
          />
        ))
      })()}

      {/* Building number "52 / 56" on the brick pier between the two
          south doors. Sits a hair proud of the brick face so it renders
          on top without z-fighting. */}
      <BuildingNumber
        x={(cDoorHi + bDoorLo) / 2}
        z={wallSouthZ + 0.01}
        centerY={1.7}
        width={0.9}
        height={1.35}
        lines={['52', '56']}
      />

      {/* Orange canopy spanning from the corridor's south door across
          to the bakery's south door. Fades out the moment the player
          enters the building so it doesn't cap interior camera framing.
          TEMPORARILY DISABLED — revisiting geometry / mounting height. */}
      {/*
      <OutsideOnlyFade>
        {(() => {
          const spanLo = cDoorCenterX - CENTRAL_CORRIDOR.southDoorWidth / 2 - 0.8
          const spanHi =
            THE_BAKERY_SOUTH_DOOR.centerX + THE_BAKERY_SOUTH_DOOR.width / 2 + 0.3
          return (
            <Canopy
              x={(spanLo + spanHi) / 2}
              z={wallSouthZ}
              width={spanHi - spanLo}
              depth={1.6}
            />
          )
        })()}
      </OutsideOnlyFade>
      */}
    </group>
  )
}
