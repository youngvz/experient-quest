import { Suspense } from 'react'
import { Exterior } from './Exterior'
import { OfficeLighting } from './OfficeLighting'
import OfficeWorld from './OfficeWorld'

interface OfficeSceneProps {
  controlsDisabled: boolean
}

// Mounts the whole office (walls, props, NPCs, physics world) from the
// first frame. OfficeWorld reads phase internally: during 'title' its
// Physics tree is paused and Player is unmounted, so the mount hitch is
// hidden behind the title overlay. Un-lazifying it here means the JS
// chunk is part of the main bundle and available before Start.
export function OfficeScene({ controlsDisabled }: OfficeSceneProps) {
  return (
    <>
      <OfficeLighting />
      <Suspense fallback={null}>
        <Exterior />
      </Suspense>
      <Suspense fallback={null}>
        <OfficeWorld controlsDisabled={controlsDisabled} />
      </Suspense>
    </>
  )
}
