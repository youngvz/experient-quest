import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { ConferenceChairs } from './ConferenceChairs'
import { ConferenceFloor } from './ConferenceFloor'
import { ConferenceLaptops } from './ConferenceLaptops'
import { ConferenceRoom } from './ConferenceRoom'
import { ConferenceTable } from './ConferenceTable'
import { CorridorPocket } from './CorridorPocket'
import { EastCorridor } from './EastCorridor'
import { Exterior } from './Exterior'
import { LazyBranch } from './LazyBranch'
import { Player } from './Player'
import { CentralCorridor } from './CentralCorridor'
import { Televisions } from './Televisions'
import { TheBakery } from './TheBakery'
import { TheBakeryCabinets } from './TheBakeryCabinets'
import { Whiteboards } from './Whiteboards'

interface OfficeSceneProps {
  controlsDisabled: boolean
}

export function OfficeScene({ controlsDisabled }: OfficeSceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={0.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight args={['#c9a680', '#1a1d24', 0.5]} />
      <Suspense fallback={null}>
        <Exterior />
      </Suspense>
      <Physics gravity={[0, -9.81, 0]} timeStep="vary">
        <ConferenceFloor />
        <ConferenceRoom />
        <TheBakery />
        <CentralCorridor />
        <EastCorridor />
        <CorridorPocket />
        <TheBakeryCabinets />
        <Whiteboards />
        <Televisions />
        <ConferenceTable />
        <ConferenceLaptops />
        <ConferenceChairs />
        {/* Branch slots. Each <LazyBranch> mounts its children only when
            the player is in the matching zone; the corridor stays cheap.
            When a real branch scene is built, wire it here with a lazy
            import: const Foo = lazy(() => import('./FooBranch')). */}
        <LazyBranch zone="branch-alpha">
          {/* No scene yet — this slot is proof-of-plumbing. Drop the
              branch component in here when it exists. */}
          {null}
        </LazyBranch>
        <Suspense fallback={null}>
          <Player controlsDisabled={controlsDisabled} />
        </Suspense>
      </Physics>
    </>
  )
}
