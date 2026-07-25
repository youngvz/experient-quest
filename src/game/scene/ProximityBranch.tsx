import { Suspense, type ReactNode } from 'react'
import { useIsRoomNearby } from '../state/gameStore'

interface ProximityBranchProps {
  // Room id that must be in the proximity set (see ProximityManager +
  // src/game/scene/proximity/anchors.ts) for `children` to mount.
  room: string
  children: ReactNode
  fallback?: ReactNode
}

// Range-based scene branch. Mirrors LazyBranch but subscribes to a
// single boolean via useIsRoomNearby(id) — so only *this* room's
// branch re-renders when its membership flips. Pair with React.lazy'd
// children so the JS chunk fetches on the same trigger.
export function ProximityBranch({ room, children, fallback = null }: ProximityBranchProps) {
  const nearby = useIsRoomNearby(room)
  if (!nearby) return null
  return <Suspense fallback={fallback}>{children}</Suspense>
}
