import { Physics } from '@react-three/rapier'
import { Desk } from './Desk'
import { Floor } from './Floor'
import { Player } from './Player'
import { Television } from './Television'
import { Walls } from './Walls'

interface OfficeSceneProps {
  controlsDisabled: boolean
}

export function OfficeScene({ controlsDisabled }: OfficeSceneProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight args={['#8ea3c4', '#1a1d24', 0.4]} />
      <Physics gravity={[0, -9.81, 0]}>
        <Floor />
        <Walls />
        <Desk />
        <Television />
        <Player controlsDisabled={controlsDisabled} />
      </Physics>
    </>
  )
}
