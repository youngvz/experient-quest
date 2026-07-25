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
import { Player } from './Player'
import { CentralCorridor } from './CentralCorridor'
import { Televisions } from './Televisions'
import { TheBakery } from './TheBakery'
import { TheBakeryCabinets } from './TheBakeryCabinets'
import { TheLab } from './TheLab'
import { TheLabCabinets } from './TheLabCabinets'
import { TheStation } from './TheStation'
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
        <TheLab />
        <TheLabCabinets />
        <TheStation />
        <TheBakeryCabinets />
        <Whiteboards />
        <Televisions />
        <ConferenceTable />
        <ConferenceLaptops />
        <ConferenceChairs />
        {/* LazyBranch slots go here for future rooms whose contents are
            heavy enough to warrant zone-gated mounting (e.g. lots of GLBs).
            Small shells like TheLab render eagerly above. */}
        <Suspense fallback={null}>
          <Player controlsDisabled={controlsDisabled} />
        </Suspense>
      </Physics>
    </>
  )
}
