import { ContentOverlay } from '../components/ContentOverlay/ContentOverlay'
import { DialogueOverlay } from '../components/DialogueOverlay/DialogueOverlay'
import { GameCanvas } from '../components/GameCanvas/GameCanvas'
import { InteractionPrompt } from '../components/InteractionPrompt/InteractionPrompt'
import './App.css'

export function App() {
  return (
    <div className="app">
      <GameCanvas />
      <InteractionPrompt />
      <ContentOverlay />
      <DialogueOverlay />
    </div>
  )
}
