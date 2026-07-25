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
import { LazyBranch } from './LazyBranch'
import { NorthEastCorridor } from './NorthEastCorridor'
import { Player } from './Player'
import { ProximityBranch } from './ProximityBranch'
import { CentralCorridor } from './CentralCorridor'
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
const Outdoor = lazy(() => import('./Outdoor').then((m) => ({ default: m.Outdoor })))

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
      {/* Outdoor stays zone-based — a trigger-style branch, not a
          proximity one. Real outdoor doorway will replace this. */}
      <LazyBranch zone="outdoor">
        <FadeIn>
          <Outdoor />
        </FadeIn>
      </LazyBranch>

      <Suspense fallback={null}>
        <Player controlsDisabled={controlsDisabled} />
      </Suspense>
    </Physics>
  )
}
