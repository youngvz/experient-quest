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
import { LazyBranch } from './LazyBranch'
import { Player } from './Player'
import { CentralCorridor } from './CentralCorridor'
import { Televisions } from './Televisions'
import { Whiteboards } from './Whiteboards'

const TheLab = lazy(() => import('./TheLab').then((m) => ({ default: m.TheLab })))
const TheStation = lazy(() =>
  import('./TheStation').then((m) => ({ default: m.TheStation })),
)
const TheBakery = lazy(() => import('./TheBakery').then((m) => ({ default: m.TheBakery })))
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
      <Whiteboards />
      <Televisions />
      <ConferenceTable />
      <ConferenceLaptops />
      <ConferenceChairs />

      {/* Branch rooms mount when the player is in their zone or in an
          adjacent zone whose glass wall looks into them. */}
      <LazyBranch zone="the-lab" alsoMountFor={['central-corridor', 'the-station']}>
        <TheLab />
      </LazyBranch>
      <LazyBranch
        zone="the-station"
        alsoMountFor={['central-corridor', 'the-lab', 'the-boardroom']}
      >
        <TheStation />
      </LazyBranch>
      <LazyBranch zone="the-bakery" alsoMountFor={['office']}>
        <TheBakery />
      </LazyBranch>
      <LazyBranch zone="outdoor">
        <Outdoor />
      </LazyBranch>

      <Suspense fallback={null}>
        <Player controlsDisabled={controlsDisabled} />
      </Suspense>
    </Physics>
  )
}
