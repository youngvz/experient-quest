import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import { DoubleSide, type Mesh, type MeshStandardMaterial } from 'three'
import { useActiveZone } from '../state/gameStore'

// A rising column of translucent smoke puffs. Each puff cycles from
// (spawnY, small, opaque-ish) → (spawnY + rise, large, transparent) over
// `period` seconds. Puffs are phase-offset so the column reads as a
// continuous plume rather than a synchronized pulse.
//
// Frame loop mutates ref'd meshes/materials directly — no React state
// per frame, no allocations. Cheap enough to run several per scene.
function SmokePlume({
  originY,
  rise = 1.6,
  radius = 0.16,
  count = 6,
  period = 2.2,
  jitterX = 0.08,
  jitterZ = 0.06,
  color = '#3a3d42',
  peakOpacity = 0.75,
}: {
  originY: number
  rise?: number
  radius?: number
  count?: number
  period?: number
  jitterX?: number
  jitterZ?: number
  color?: string
  peakOpacity?: number
}) {
  const meshes = useRef<(Mesh | null)[]>([])
  const mats = useRef<(MeshStandardMaterial | null)[]>([])
  // Per-puff constants baked at mount: phase offset (0..1) and a tiny
  // horizontal drift so no two puffs share a track.
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: i / count,
        driftX: (i % 2 === 0 ? 1 : -1) * jitterX * (0.5 + (i * 0.37) % 0.5),
        driftZ: (i % 3 === 0 ? -1 : 1) * jitterZ * (0.5 + (i * 0.23) % 0.5),
      })),
    [count, jitterX, jitterZ],
  )
  const clock = useRef(0)

  useFrame((_, delta) => {
    clock.current += delta
    for (let i = 0; i < puffs.length; i++) {
      const mesh = meshes.current[i]
      const mat = mats.current[i]
      if (!mesh || !mat) continue
      const p = puffs[i]!
      const t = ((clock.current / period + p.phase) % 1 + 1) % 1
      // Rise: t=0 at bottom, t=1 at top.
      mesh.position.y = originY + t * rise
      mesh.position.x = p.driftX * t
      mesh.position.z = p.driftZ * t
      // Grow from 0.6× to 1.6× radius.
      const s = 0.6 + t * 1.0
      mesh.scale.set(s, s, s)
      // Fade in quickly, fade out over the rise. Peak around t=0.15.
      const fadeIn = Math.min(1, t / 0.15)
      const fadeOut = 1 - t
      mat.opacity = peakOpacity * fadeIn * fadeOut
    }
  })

  return (
    <group>
      {puffs.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m
          }}
          position={[0, originY, 0]}
        >
          <sphereGeometry args={[radius, 10, 8]} />
          <meshStandardMaterial
            ref={(m) => {
              mats.current[i] = m as MeshStandardMaterial
            }}
            color={color}
            transparent
            opacity={0}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  )
}

// A cluster of small flickering flames — orange emissive cones that
// wobble in height and intensity on a per-flame frequency, so the group
// reads as a licking fire rather than a synchronized blink. Refs mutate
// per frame; no React state, no allocations.
function Flames({
  positions,
  height = 0.16,
  radius = 0.045,
}: {
  positions: [number, number, number][]
  height?: number
  radius?: number
}) {
  const meshes = useRef<(Mesh | null)[]>([])
  const mats = useRef<(MeshStandardMaterial | null)[]>([])
  const clock = useRef(0)
  const seeds = useMemo(
    () =>
      positions.map((_, i) => ({
        freq: 5.5 + (i * 1.7) % 3.5,
        phase: i * 0.83,
        heightScale: 0.75 + (i * 0.19) % 0.5,
      })),
    [positions],
  )

  useFrame((_, delta) => {
    clock.current += delta
    for (let i = 0; i < positions.length; i++) {
      const mesh = meshes.current[i]
      const mat = mats.current[i]
      if (!mesh || !mat) continue
      const s = seeds[i]!
      const wobble = Math.sin(clock.current * s.freq + s.phase)
      const wobble2 = Math.sin(clock.current * s.freq * 1.7 + s.phase + 0.5)
      mesh.scale.y = s.heightScale * (1 + wobble * 0.35)
      mesh.scale.x = 1 + wobble2 * 0.12
      mesh.scale.z = 1 + wobble2 * 0.12
      mat.emissiveIntensity = 1.6 + wobble * 0.6
    }
  })

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m
          }}
          position={[p[0], p[1] + height / 2, p[2]]}
        >
          <coneGeometry args={[radius, height, 8]} />
          <meshStandardMaterial
            ref={(m) => {
              mats.current[i] = m as MeshStandardMaterial
            }}
            color="#ff8a1c"
            emissive="#ff5a10"
            emissiveIntensity={1.6}
            transparent
            opacity={0.92}
            depthWrite={false}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

// A stainless-steel kitchen holding / frying station with hotel pans of
// food, a knob control panel, a wire-rack warming shelf, and a KDS
// tablet on an arm. Local +Z is the "front" face where the pans and
// controls point; rotate so +Z faces into the room. Wrapped in one
// fixed cuboid collider around the plinth footprint — the cantilevered
// side pan and tablet arm are cosmetic and don't block the player.
export function KitchenStation({
  position,
  rotationY = 0,
  scale = 1,
  smoke = false,
}: {
  position: [number, number]
  rotationY?: number
  scale?: number
  smoke?: boolean
}) {
  const [x, z] = position
  const w = 1.2 * scale // footprint width along local X
  const d = 0.7 * scale // footprint depth along local Z (front is +Z)
  const totalH = 2.0 * scale

  // Vertical levels (bottom → top).
  const plinthH = 0.35 * scale
  const midShelfY = 0.9 * scale
  const midShelfH = 0.06 * scale
  const topShelfY = 1.55 * scale
  const topShelfH = 0.05 * scale

  const steel = '#c9ccd1'
  const steelDark = '#9ea3aa'
  const rim = '#8b9098'
  const panBody = '#d5d9dd'
  const panFood = '#c4832a'
  const panFoodDark = '#8a5a1c'
  const screenBezel = '#101216'

  // Hotel pan primitive — inset food fill on top so the food reads as
  // "sitting inside" the pan. Sizes in metres before scale.
  function HotelPan({
    center,
    size,
    food = true,
  }: {
    center: [number, number, number]
    size: [number, number, number]
    food?: boolean
  }) {
    const [pw, ph, pd] = size
    return (
      <group position={center}>
        {/* Pan body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pw, ph, pd]} />
          <meshStandardMaterial color={panBody} roughness={0.35} metalness={0.65} />
        </mesh>
        {/* Rim highlight */}
        <mesh position={[0, ph / 2 + 0.003, 0]}>
          <boxGeometry args={[pw * 1.02, 0.006, pd * 1.02]} />
          <meshStandardMaterial color={rim} roughness={0.4} metalness={0.7} />
        </mesh>
        {food && (
          <>
            {/* Base food layer */}
            <mesh position={[0, ph / 2 - 0.015, 0]}>
              <boxGeometry args={[pw * 0.86, 0.03, pd * 0.86]} />
              <meshStandardMaterial color={panFoodDark} roughness={0.85} />
            </mesh>
            {/* A few chunky nuggets/filets on top */}
            {[
              [-0.3, 0.3],
              [0.25, 0.2],
              [-0.1, -0.15],
              [0.3, -0.25],
              [-0.28, -0.05],
              [0.05, 0.05],
            ].map(([fx, fz], i) => (
              <mesh
                key={i}
                castShadow
                position={[fx * pw * 0.6, ph / 2 + 0.02, fz * pd * 0.6]}
                rotation={[0, i * 0.7, 0]}
              >
                <boxGeometry args={[pw * 0.16, 0.045, pd * 0.14]} />
                <meshStandardMaterial color={panFood} roughness={0.85} />
              </mesh>
            ))}
          </>
        )}
      </group>
    )
  }

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        args={[w / 2, totalH / 2, d / 2]}
        position={[x, totalH / 2, z]}
        rotation={[0, rotationY, 0]}
      />
      <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
        {/* --- Plinth: solid base pedestal --- */}
        <mesh castShadow receiveShadow position={[0, plinthH / 2, 0]}>
          <boxGeometry args={[w, plinthH, d]} />
          <meshStandardMaterial color={steel} roughness={0.4} metalness={0.65} />
        </mesh>
        {/* Kick-strip toe recess */}
        <mesh position={[0, 0.03, d / 2 + 0.001]}>
          <boxGeometry args={[w * 0.98, 0.06, 0.02]} />
          <meshStandardMaterial color={steelDark} roughness={0.5} metalness={0.5} />
        </mesh>

        {/* --- Bottom shelf pans (2 pans sit on top of the plinth) --- */}
        <HotelPan
          center={[-w * 0.22, plinthH + 0.075, 0]}
          size={[w * 0.4, 0.15, d * 0.55]}
        />
        <HotelPan
          center={[w * 0.22, plinthH + 0.075, 0]}
          size={[w * 0.4, 0.15, d * 0.55]}
        />

        {/* --- Back tower: continuous vertical support behind the shelves --- */}
        <mesh
          castShadow
          receiveShadow
          position={[0, totalH / 2, -d / 2 + 0.05]}
        >
          <boxGeometry args={[w, totalH, 0.1]} />
          <meshStandardMaterial color={steel} roughness={0.35} metalness={0.7} />
        </mesh>

        {/* --- Mid shelf: houses control panel + supports the middle pans --- */}
        <mesh castShadow receiveShadow position={[0, midShelfY, 0]}>
          <boxGeometry args={[w, midShelfH, d]} />
          <meshStandardMaterial color={steel} roughness={0.35} metalness={0.7} />
        </mesh>
        {/* Control panel face on the front (+Z) side of the mid shelf */}
        <mesh position={[0, midShelfY - 0.02, d / 2 + 0.001]}>
          <planeGeometry args={[w * 0.85, midShelfH * 0.85]} />
          <meshStandardMaterial color={steelDark} roughness={0.5} metalness={0.55} />
        </mesh>
        {/* Four control knobs across the front of the mid shelf */}
        {[-0.3, -0.1, 0.1, 0.3].map((tx, i) => (
          <mesh
            key={`knob-${i}`}
            castShadow
            position={[tx * w, midShelfY - 0.02, d / 2 + 0.02]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.022, 0.022, 0.03, 12]} />
            <meshStandardMaterial color="#2a2c31" roughness={0.4} metalness={0.7} />
          </mesh>
        ))}

        {/* --- Middle pans: two hotel pans on the mid shelf --- */}
        <HotelPan
          center={[-w * 0.18, midShelfY + midShelfH / 2 + 0.075, 0.02]}
          size={[w * 0.32, 0.15, d * 0.5]}
        />
        <HotelPan
          center={[w * 0.18, midShelfY + midShelfH / 2 + 0.075, 0.02]}
          size={[w * 0.32, 0.15, d * 0.5]}
        />

        {/* --- Cantilevered side pan on the -X face (mid-shelf level) --- */}
        <group position={[-w / 2 - 0.18, midShelfY + midShelfH / 2 + 0.075, 0]}>
          {/* Support bracket */}
          <mesh position={[0.14, -0.08, 0]}>
            <boxGeometry args={[0.28, 0.03, 0.06]} />
            <meshStandardMaterial color={steelDark} roughness={0.4} metalness={0.7} />
          </mesh>
          <HotelPan center={[0, 0, 0]} size={[0.34, 0.15, 0.42]} />
        </group>

        {/* --- Warming rack: parallel wires between mid and top shelves --- */}
        {Array.from({ length: 9 }).map((_, i) => {
          const zOff = -d / 2 + 0.15 + i * ((d - 0.3) / 8)
          return (
            <mesh
              key={`wire-${i}`}
              castShadow
              position={[0, topShelfY - 0.02, zOff]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.008, 0.008, w * 0.94, 8]} />
              <meshStandardMaterial color={steelDark} roughness={0.35} metalness={0.85} />
            </mesh>
          )
        })}
        {/* Wire rack side rails so the wires read as a continuous grill */}
        {[-1, 1].map((s) => (
          <mesh
            key={`rail-${s}`}
            castShadow
            position={[(s * w) / 2 - s * 0.03, topShelfY - 0.02, 0]}
          >
            <boxGeometry args={[0.02, 0.02, d - 0.24]} />
            <meshStandardMaterial color={steelDark} roughness={0.4} metalness={0.75} />
          </mesh>
        ))}

        {/* --- Top shelf slab --- */}
        <mesh castShadow receiveShadow position={[0, topShelfY, 0]}>
          <boxGeometry args={[w, topShelfH, d]} />
          <meshStandardMaterial color={steel} roughness={0.35} metalness={0.7} />
        </mesh>

        {/* --- Top hood / chimney on the left rear --- */}
        <mesh
          castShadow
          position={[-w * 0.35, topShelfY + 0.15, -d / 2 + 0.18]}
        >
          <boxGeometry args={[0.32, 0.3, 0.34]} />
          <meshStandardMaterial color={steel} roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh
          castShadow
          position={[-w * 0.35, topShelfY + 0.45, -d / 2 + 0.18]}
        >
          <boxGeometry args={[0.14, 0.32, 0.14]} />
          <meshStandardMaterial color={steel} roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Smoke + fire effects. Only mount when the player is inside
            TheLab — from anywhere else the station is 20+ m away behind
            glass and the animated plumes aren't worth their per-frame
            cost (4× useFrame per smoking station + ~32 transparent
            spheres). Effects unmount cleanly and remount on re-entry. */}
        {smoke && (
          <SmokeFireEffects
            w={w}
            d={d}
            midShelfY={midShelfY}
            midShelfH={midShelfH}
            topShelfY={topShelfY}
          />
        )}

        {/* --- KDS tablet on an arm (right side, above the warming rack) --- */}
        <group position={[w * 0.18, topShelfY + 0.28, 0.02]}>
          {/* Vertical arm */}
          <mesh castShadow position={[0, -0.12, -0.1]}>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshStandardMaterial color={steelDark} roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Tablet body */}
          <mesh castShadow rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[0.34, 0.5, 0.03]} />
            <meshStandardMaterial color={screenBezel} roughness={0.5} />
          </mesh>
          {/* Screen face — emissive, faces +Z */}
          <mesh position={[0, 0, 0.017]} rotation={[-0.08, 0, 0]}>
            <planeGeometry args={[0.3, 0.44]} />
            <meshStandardMaterial
              color="#f4f5f6"
              emissive="#ffffff"
              emissiveIntensity={0.35}
              roughness={0.4}
              side={DoubleSide}
            />
          </mesh>
          {/* A few colored stripes standing in for order rows */}
          {[0.14, 0.06, -0.02, -0.1].map((yy, i) => (
            <mesh
              key={`row-${i}`}
              position={[0, yy, 0.019]}
              rotation={[-0.08, 0, 0]}
            >
              <planeGeometry args={[0.26, 0.05]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#e8ebef' : '#d4d9df'}
                roughness={0.6}
              />
            </mesh>
          ))}
          {/* Green header bar at the top of the screen */}
          <mesh position={[0, 0.2, 0.019]} rotation={[-0.08, 0, 0]}>
            <planeGeometry args={[0.3, 0.05]} />
            <meshStandardMaterial
              color="#3a8f4a"
              emissive="#3a8f4a"
              emissiveIntensity={0.25}
              roughness={0.5}
            />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
}

// Smoke + fire subtree — extracted so it can unmount entirely when the
// player leaves TheLab. Unmounting kills the 4× useFrame per smoking
// station (chimney plume, 2 fire-pan plumes, flames) and drops 32
// transparent sphere meshes + 5 emissive cones out of the draw list.
function SmokeFireEffects({
  w,
  d,
  midShelfY,
  midShelfH,
  topShelfY,
}: {
  w: number
  d: number
  midShelfY: number
  midShelfH: number
  topShelfY: number
}) {
  const activeZone = useActiveZone()
  if (activeZone !== 'the-lab') return null
  return (
    <>
      {/* Chimney plume */}
      <group position={[-w * 0.35, 0, -d / 2 + 0.18]}>
        <SmokePlume originY={topShelfY + 0.62} />
      </group>

      {/* Flames on the mid-shelf pans */}
      <Flames
        positions={[
          [-w * 0.24, midShelfY + midShelfH / 2 + 0.15, -0.04],
          [-w * 0.12, midShelfY + midShelfH / 2 + 0.15, 0.06],
          [w * 0.14, midShelfY + midShelfH / 2 + 0.15, -0.05],
          [w * 0.22, midShelfY + midShelfH / 2 + 0.15, 0.08],
          [w * 0.18, midShelfY + midShelfH / 2 + 0.15, -0.02],
        ]}
      />

      {/* Secondary plumes rising from the flame pans */}
      {[-w * 0.18, w * 0.18].map((px, i) => (
        <group key={`fire-smoke-${i}`} position={[px, 0, 0.02]}>
          <SmokePlume
            originY={midShelfY + midShelfH / 2 + 0.22}
            rise={1.0}
            radius={0.1}
            count={5}
            period={1.8}
            jitterX={0.06}
            jitterZ={0.04}
            peakOpacity={0.8}
          />
        </group>
      ))}
    </>
  )
}
