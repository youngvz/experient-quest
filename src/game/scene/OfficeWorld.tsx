import { useGLTF } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { CHARACTERS } from '../characters/characters'
import { useGameStore } from '../state/gameStore'
import { ConferenceChairs } from './ConferenceChairs'
import { ConferenceFloor } from './ConferenceFloor'
import { ConferenceLaptops } from './ConferenceLaptops'
import { ConferenceRoom } from './ConferenceRoom'
import { ConferenceTable } from './ConferenceTable'
import { CommonTree } from './CommonTree'
import { CorridorPocket } from './CorridorPocket'
import { EastCorridor } from './EastCorridor'
import { Employee } from './Employee'
import { FadeIn } from './FadeIn'
import { NorthEastCorridor } from './NorthEastCorridor'
import { Player } from './Player'
import { ProximityBranch } from './ProximityBranch'
import { CentralCorridor } from './CentralCorridor'
import { SouthApron } from './SouthApron'
import { SouthApronBushes } from './SouthApronBushes'
import { SouthApronFlowers } from './SouthApronFlowers'
import { SouthApronGrass } from './SouthApronGrass'
import { SouthFacade } from './SouthFacade'
import { TheBakery } from './TheBakery'
import { Televisions } from './Televisions'
import { TheArchive } from './TheArchive'
import { TheAtrium } from './TheAtrium'
import { TheCommons } from './TheCommons'
import { TheLibrary } from './TheLibrary'
import { Whiteboards } from './Whiteboards'

// Wave clips vs idle-only clips. Swapping the array identity re-runs the
// Employee's animation effect, which stops the wave and starts the idle.
const JACQUELYN_WAVE = [/wave/i, /greet/i, /hello/i]
const JACQUELYN_IDLE = [/idle/i, /stand/i, /breath/i]

function Jacquelyn() {
  const hasSpoken = useGameStore((s) => s.completedStopIds.has('jacquelyn'))
  const clipPatterns = useMemo(
    () => (hasSpoken ? JACQUELYN_IDLE : JACQUELYN_WAVE),
    [hasSpoken],
  )
  return (
    <Employee
      url={CHARACTERS.jacquelyn.glbUrl}
      position={[-9.5, 0, 22]}
      rotationY={0}
      clipPatterns={clipPatterns}
    />
  )
}

const TheLab = lazy(() => import('./TheLab').then((m) => ({ default: m.TheLab })))
const TheStation = lazy(() =>
  import('./TheStation').then((m) => ({ default: m.TheStation })),
)
const TheGarage = lazy(() =>
  import('./TheGarage').then((m) => ({ default: m.TheGarage })),
)
interface OfficeWorldProps {
  controlsDisabled: boolean
}

export default function OfficeWorld({ controlsDisabled }: OfficeWorldProps) {
  useEffect(() => {
    useGLTF.preload(CHARACTERS.youngvz.glbUrl)
    useGLTF.preload(CHARACTERS.distasi.glbUrl)
    useGLTF.preload(CHARACTERS.jacquelyn.glbUrl)
    useGLTF.preload(CHARACTERS.catherine.glbUrl)
    useGLTF.preload(CHARACTERS.juan.glbUrl)
    useGLTF.preload(CHARACTERS.tenant.glbUrl)
    useGLTF.preload(CHARACTERS.sarah.glbUrl)
  }, [])

  return (
    <Physics gravity={[0, -9.81, 0]} timeStep="vary">
      {/* Always-mounted shell: conference room + corridors are the spawn-side
          area and must be present from frame 1. */}
      <ConferenceFloor />
      <ConferenceRoom />
      <CentralCorridor />
      <EastCorridor />
      <CorridorPocket />
      <NorthEastCorridor />
      <Whiteboards />
      <Televisions />
      <ConferenceTable />
      <ConferenceLaptops />
      <ConferenceChairs />

      {/* West-side storefront rooms — always mounted so their glass
          facades are visible from the moment the player enters the
          corridor. Non-explorable (no doors) so their footprint is
          fixed and small enough to justify skipping ProximityBranch. */}
      <TheCommons />
      <TheLibrary />
      <TheAtrium />
      <TheArchive />

      {/* The Bakery is adjacent to the spawn point — eagerly imported
          so it's on-screen from frame 1 with no pop-in through the
          conference room's glass. */}
      <TheBakery />

      {/* Outdoor terrain south of the building. Always-on so the grass
          and sidewalk are visible through The Bakery's south glass from
          inside — must live inside <Physics> because grass slabs carry
          RigidBody colliders. */}
      <SouthApron />
      <SouthFacade />
      {/* Jacquelyn — greeter on the south sidewalk in front of the 5256
          door, waving at the incoming player until they talk to her. */}
      <Suspense fallback={null}>
        <Jacquelyn />
      </Suspense>
      <Suspense fallback={null}>
        <SouthApronBushes />
      </Suspense>
      <Suspense fallback={null}>
        <SouthApronGrass />
      </Suspense>
      <Suspense fallback={null}>
        <SouthApronFlowers />
      </Suspense>
      {/* Two trees flanking the south sidewalk (X=-13..-10.5) that leads
          up to the corridor doorway. West tree sits in the pocket grass;
          east tree in the main-strip grass. Trunk colliders keep the
          player on the sidewalk; canopies read as a park-style entrance. */}
      <Suspense fallback={null}>
        <CommonTree position={[-15.7, 30]} rotationY={0.4} />
        <CommonTree position={[-7.5, 30]} rotationY={-0.8} />
      </Suspense>

      {/* Branch rooms mount by *distance* from the player (see
          proximity/anchors.ts for radii). Lab and Station stream in
          as the player walks north up the corridor; FadeIn smooths
          the transition once each chunk finishes parsing. */}
      <ProximityBranch room="the-lab">
        <FadeIn>
          <TheLab />
        </FadeIn>
      </ProximityBranch>
      <ProximityBranch room="the-station">
        <FadeIn>
          <TheStation />
        </FadeIn>
      </ProximityBranch>
      <ProximityBranch room="the-garage">
        <FadeIn>
          <TheGarage />
        </FadeIn>
      </ProximityBranch>
      <Suspense fallback={null}>
        <Player controlsDisabled={controlsDisabled} />
      </Suspense>
    </Physics>
  )
}
