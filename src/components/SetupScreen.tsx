import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGameStore } from '@/store/gameStore'

export function SetupScreen() {
  const [playerCount, setPlayerCount] = useState(2)
  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: 24 }, (_, i) => (i < 2 ? `Player ${i + 1}` : ''))
  )
  const [rounds, setRounds] = useState(10)
  const startGame = useGameStore((state) => state.startGame)

  const handlePlayerCountChange = (count: number) => {
    const validCount = Math.max(2, Math.min(24, count))
    setPlayerCount(validCount)
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  const handleStartGame = () => {
    const validNames = playerNames.slice(0, playerCount).filter((name) => name.trim().length > 0)
    if (validNames.length < 2) {
      alert('Please enter at least 2 player names!')
      return
    }
    startGame(validNames, rounds)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl mb-2">🎮 Stock Market Game</CardTitle>
          <CardDescription className="text-lg">
            Turn-based stock trading competition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Number of Players (2-24)</label>
            <Input
              type="number"
              min={2}
              max={24}
              value={playerCount}
              onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 2)}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i}>
                <label className="block text-sm font-medium mb-2">Player {i + 1} Name</label>
                <Input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={playerNames[i]}
                  onChange={(e) => handlePlayerNameChange(i, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Rounds (5-20)</label>
            <Input
              type="number"
              min={5}
              max={20}
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value) || 10)}
              className="w-full"
            />
          </div>

          <Button onClick={handleStartGame} className="w-full text-lg py-6" size="lg">
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
