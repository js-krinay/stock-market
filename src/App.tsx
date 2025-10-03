import { useGameStore } from './store/gameStore'
import { SetupScreen } from './components/SetupScreen'
import { FullGameScreen } from './components/FullGameScreen'
import { Leaderboard } from './components/Leaderboard'
import { Toaster } from 'sonner'

function App() {
  const currentView = useGameStore((state) => state.currentView)

  return (
    <>
      {currentView === 'setup' && <SetupScreen />}
      {currentView === 'game' && <FullGameScreen />}
      {currentView === 'leaderboard' && <Leaderboard />}
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
