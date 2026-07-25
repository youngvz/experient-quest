import { Suspense, lazy } from 'react'
import { Exterior } from './Exterior'

const OfficeWorld = lazy(() => import('./OfficeWorld'))

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
      <Suspense fallback={null}>
        <OfficeWorld controlsDisabled={controlsDisabled} />
      </Suspense>
    </>
  )
}
