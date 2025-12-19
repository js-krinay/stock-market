import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGameStore } from '@/store/gameStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'

export function SetupScreen() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [existingGameId, setExistingGameId] = useState('')
  const [playerCount, setPlayerCount] = useState(2)
  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: 24 }, (_, i) => (i < 2 ? `Player ${i + 1}` : ''))
  )
  const [rounds, setRounds] = useState(10)
  const setGameId = useGameStore((state) => state.setGameId)
  const setView = useGameStore((state) => state.setView)

  const createGameMutation = trpc.game.createGame.useMutation({
    onSuccess: (data) => {
      setGameId(data.gameId)
      setView('game')
      toast.success('Game Started', {
        description: 'Good luck and have fun!',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Failed to Start Game', {
        description: error.message,
        duration: 4000,
      })
    },
  })

  const getGameState = trpc.game.getGameState.useQuery(
    { gameId: existingGameId },
    { enabled: false }
  )

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
      toast.error('Invalid Setup', {
        description: 'Please enter at least 2 player names',
        duration: 4000,
      })
      return
    }
    createGameMutation.mutate({
      playerNames: validNames,
      maxRounds: rounds,
    })
  }

  const handleJoinGame = async () => {
    if (!existingGameId.trim()) {
      toast.error('Missing Game ID', {
        description: 'Please enter a game ID to join',
        duration: 4000,
      })
      return
    }

    try {
      const result = await getGameState.refetch()
      if (result.data) {
        setGameId(existingGameId)
        setView('game')
        toast.success('Connected', {
          description: 'Successfully joined the game!',
          duration: 3000,
        })
      }
    } catch (error: any) {
      if (error.message?.includes('Game not found')) {
        toast.error('Game Not Found', {
          description: 'Please check the game ID and try again',
          duration: 4000,
        })
      } else {
        toast.error('Connection Failed', {
          description: error.message || 'Unknown error occurred',
          duration: 4000,
        })
      }
    }
  }

  // Keyboard shortcuts for setup screen
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '1',
        ctrl: true,
        description: 'Switch to Create Game mode',
        handler: () => setMode('create'),
      },
      {
        key: '2',
        ctrl: true,
        description: 'Switch to Join Game mode',
        handler: () => setMode('join'),
      },
      {
        key: 'Enter',
        description: 'Start or join game',
        handler: () => {
          if (mode === 'create') {
            handleStartGame()
          } else {
            handleJoinGame()
          }
        },
        preventDefault: false, // Allow Enter in input fields
      },
    ],
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl mb-2">🎮 Stock Market Game</CardTitle>
          <CardDescription className="text-lg">
            Turn-based stock trading competition
          </CardDescription>
          <Button
            variant="link"
            onClick={() => setView('tutorial')}
            className="mt-2 text-muted-foreground hover:text-primary"
          >
            📖 How to Play
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
              className="flex-1"
            >
              Create New Game
            </Button>
            <Button
              variant={mode === 'join' ? 'default' : 'outline'}
              onClick={() => setMode('join')}
              className="flex-1"
            >
              Join Existing Game
            </Button>
          </div>

          {mode === 'create' ? (
            <>
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

              <Button
                onClick={handleStartGame}
                className="w-full text-lg py-6"
                size="lg"
                disabled={createGameMutation.isPending}
              >
                {createGameMutation.isPending ? 'Starting Game...' : 'Start Game'}
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Game ID</label>
                <Input
                  type="text"
                  placeholder="Enter game ID (e.g., cmgazgh0i0000rpehjl4uljam)"
                  value={existingGameId}
                  onChange={(e) => setExistingGameId(e.target.value)}
                  className="w-full font-mono"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Get the game ID from another player or your game URL
                </p>
              </div>

              <Button
                onClick={handleJoinGame}
                className="w-full text-lg py-6"
                size="lg"
                disabled={getGameState.isFetching}
              >
                {getGameState.isFetching ? 'Connecting...' : 'Join Game'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
