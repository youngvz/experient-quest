import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { Chairs } from './Chairs'
import { ConferenceLaptops } from './ConferenceLaptops'
import { ConferenceTable } from './ConferenceTable'
import { Exterior } from './Exterior'
import { Floor } from './Floor'
import { Hallway } from './Hallway'
import { Player } from './Player'
import { Television } from './Television'
import { Walls } from './Walls'
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
        <Whiteboard />
        <Television />
        <ConferenceTable />
        <ConferenceLaptops />
        <Chairs />
        <Suspense fallback={null}>
          <Player controlsDisabled={controlsDisabled} />
        </Suspense>
      </Physics>
    </>
  )
}
