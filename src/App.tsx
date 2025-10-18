import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { SetupScreen } from './components/SetupScreen'
import { FullGameScreen } from './components/FullGameScreen'
import { Leaderboard } from './components/Leaderboard'
import { Tutorial } from './components/Tutorial'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { Toaster } from 'sonner'
import './styles/keyboard-focus.css'

function App() {
  const currentView = useGameStore((state) => state.currentView)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Global keyboard shortcut to toggle help
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '?',
        shift: true, // Shift+/ produces ?
        description: 'Show keyboard shortcuts help',
        handler: () => setShowKeyboardHelp((prev) => !prev),
      },
    ],
  })

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <div id="main-content">
        {currentView === 'setup' && <SetupScreen />}
        {currentView === 'tutorial' && <Tutorial />}
        {currentView === 'game' && <FullGameScreen />}
        {currentView === 'leaderboard' && <Leaderboard />}
      </div>

      {/* Keyboard shortcuts help overlay */}
      <KeyboardShortcutsHelp open={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />

      <Toaster position="top-right" richColors expand visibleToasts={9} />
    </>
  )
}

export default App
