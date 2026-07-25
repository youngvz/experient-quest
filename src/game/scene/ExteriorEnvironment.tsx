import { Environment } from '@react-three/drei'

// Sky lighting for reflective materials (TVs, monitors). Split into its
// own lazy chunk so drei's EXRLoader + the drei-CDN HDR fetch happen
// after first paint rather than blocking the entry chunk.
export default function ExteriorEnvironment() {
  return <Environment preset="sunset" background={false} />
}
