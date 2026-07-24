import { ContentOverlay } from '../components/ContentOverlay/ContentOverlay'
import { GameCanvas } from '../components/GameCanvas/GameCanvas'
import { InteractionPrompt } from '../components/InteractionPrompt/InteractionPrompt'
import './App.css'

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Experient Quest</h1>
        <p className="app__subtitle">Interactive Technology Status Meeting — Prototype</p>
      </header>

      <main className="app__stage">
        <div className="app__game-wrapper">
          <GameCanvas />
          <InteractionPrompt />
        </div>
      </main>

      <section className="app__controls" aria-label="Controls">
        <h2 className="app__controls-title">Controls</h2>
        <ul className="app__controls-list">
          <li>
            <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd>{' '}
            <kbd>↓</kbd> <kbd>→</kbd> — Move
          </li>
          <li>
            <kbd>E</kbd> — Interact
          </li>
          <li>
            <kbd>Esc</kbd> — Close overlay
          </li>
        </ul>
      </section>

      <ContentOverlay />
    </div>
  )
}
