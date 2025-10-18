import { useGameStore } from './store/gameStore'
import { SetupScreen } from './components/SetupScreen'
import { FullGameScreen } from './components/FullGameScreen'
import { Leaderboard } from './components/Leaderboard'
import { Tutorial } from './components/Tutorial'
import { Toaster } from 'sonner'

function App() {
  const currentView = useGameStore((state) => state.currentView)

  return (
    <>
      {currentView === 'setup' && <SetupScreen />}
      {currentView === 'tutorial' && <Tutorial />}
      {currentView === 'game' && <FullGameScreen />}
      {currentView === 'leaderboard' && <Leaderboard />}
      <Toaster position="top-right" richColors expand visibleToasts={9} />
    </>
  )
}

export default App
