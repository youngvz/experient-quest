// Outdoor area scaffold. Mounted only when useActiveZone() === 'outdoor'
// via the LazyBranch in OfficeWorld.tsx. All outdoor content (foliage,
// terrain, sky, etc.) belongs in this module tree so LazyBranch keeps
// it out of the entry chunk.
//
// TODO: replace the placeholder marker with real outdoor geometry.
export function Outdoor() {
  return (
    <mesh position={[0, 0.01, 30]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.1, 32]} />
      <meshBasicMaterial color="#00ff88" />
    </mesh>
  )
}
