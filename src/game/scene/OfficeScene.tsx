import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { Cabinets } from './Cabinets'
import { Chairs } from './Chairs'
import { ConferenceLaptops } from './ConferenceLaptops'
import { ConferenceTable } from './ConferenceTable'
import { EastCorridor } from './EastCorridor'
import { Exterior } from './Exterior'
import { Floor } from './Floor'
import { Hallway } from './Hallway'
import { LazyBranch } from './LazyBranch'
import { Player } from './Player'
import { Television } from './Television'
import { Walls } from './Walls'
import { WestCorridor } from './WestCorridor'
import { Whiteboard } from './Whiteboard'

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
        <Floor />
        <Walls />
        <Hallway />
        <WestCorridor />
        <EastCorridor />
        <Cabinets />
        <Whiteboard />
        <Television />
        <ConferenceTable />
        <ConferenceLaptops />
        <Chairs />
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
