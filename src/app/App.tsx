import { ContentOverlay } from '../components/ContentOverlay/ContentOverlay'
import { DialogueOverlay } from '../components/DialogueOverlay/DialogueOverlay'
import { GameCanvas } from '../components/GameCanvas/GameCanvas'
import { InteractionPrompt } from '../components/InteractionPrompt/InteractionPrompt'
import { QuestLog } from '../components/QuestLog/QuestLog'
import { QuestToast } from '../components/QuestToast/QuestToast'
import { QuestUnlockedModal } from '../components/QuestUnlockedModal/QuestUnlockedModal'
import { TouchControls } from '../components/TouchControls/TouchControls'
import { useCoarsePointer } from '../hooks/useCoarsePointer'
import './App.css'

export function App() {
  const isCoarse = useCoarsePointer()
  return (
    <div className="app">
      <GameCanvas />
      <InteractionPrompt />
      <QuestLog />
      <QuestToast />
      <ContentOverlay />
      <DialogueOverlay />
      <QuestUnlockedModal />
      {isCoarse && <TouchControls />}
    </div>
  )
}
