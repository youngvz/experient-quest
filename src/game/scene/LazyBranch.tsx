import { Suspense, type ReactNode } from 'react'
import { useActiveZone } from '../state/gameStore'

interface LazyBranchProps {
  // The zone ID this branch is tied to. When useActiveZone() returns this
  // value, `children` is mounted; otherwise nothing renders.
  zone: string
  // Optional zone IDs to *also* keep the branch mounted for — useful when
  // a branch should stay hot while the player is in the corridor right
  // outside it (avoids visible unmount-on-exit).
  alsoMountFor?: readonly string[]
  children: ReactNode
  // Optional Suspense fallback. Defaults to null. Rendered in-scene, so
  // whatever mesh you put here becomes visible during load — usually you
  // want an invisible fallback and rely on the corridor geometry.
  fallback?: ReactNode
}

// Conditional-mount wrapper for scene branches. Real branch modules should
// be code-split via React.lazy so their JS + GLBs don't ship in the
// initial bundle:
//
//   const MeetingRoom = lazy(() => import('./MeetingRoom'))
//   <LazyBranch zone="branch-alpha">
//     <MeetingRoom />
//   </LazyBranch>
//
// The wrapper is deliberately small: mount = React GC, unmount = physics
// + textures + GLBs are dropped and the browser can free them.
export function LazyBranch({ zone, alsoMountFor, children, fallback = null }: LazyBranchProps) {
  const active = useActiveZone()
  const shouldMount = active === zone || alsoMountFor?.includes(active) === true
  if (!shouldMount) return null
  return <Suspense fallback={fallback}>{children}</Suspense>
}
