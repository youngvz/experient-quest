import { ContentOverlay } from '../components/ContentOverlay/ContentOverlay'
import { GameCanvas } from '../components/GameCanvas/GameCanvas'
import { InteractionPrompt } from '../components/InteractionPrompt/InteractionPrompt'
import './App.css'

export function App() {
  return (
    <div className="app">
      <GameCanvas />
      <InteractionPrompt />
      <ContentOverlay />
    </div>
  )
}
