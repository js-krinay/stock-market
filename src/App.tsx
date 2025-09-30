import { useGameStore } from './store/gameStore'
import { SetupScreen } from './components/SetupScreen'
import { FullGameScreen } from './components/FullGameScreen'
import { Leaderboard } from './components/Leaderboard'

function App() {
  const currentView = useGameStore((state) => state.currentView)

  return (
    <>
      {currentView === 'setup' && <SetupScreen />}
      {currentView === 'game' && <FullGameScreen />}
      {currentView === 'leaderboard' && <Leaderboard />}
    </>
  )
}

export default App
