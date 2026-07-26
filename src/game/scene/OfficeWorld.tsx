import { useGLTF } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, lazy, useEffect } from 'react'
import { CHARACTERS } from '../characters/characters'
import { ConferenceChairs } from './ConferenceChairs'
import { ConferenceFloor } from './ConferenceFloor'
import { ConferenceLaptops } from './ConferenceLaptops'
import { ConferenceRoom } from './ConferenceRoom'
import { ConferenceTable } from './ConferenceTable'
import { CorridorPocket } from './CorridorPocket'
import { EastCorridor } from './EastCorridor'
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
      <Suspense fallback={null}>
        <SouthApronBushes />
      </Suspense>
      <Suspense fallback={null}>
        <SouthApronGrass />
      </Suspense>
      <Suspense fallback={null}>
        <SouthApronFlowers />
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
