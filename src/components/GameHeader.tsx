import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameState } from '@/types'
import { toast } from 'sonner'
import { useGameStore } from '@/store/gameStore'

interface GameHeaderProps {
  gameState: GameState
  onViewLeaderboard: () => void
}

export function GameHeader({ gameState, onViewLeaderboard }: GameHeaderProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const gameId = useGameStore((state) => state.gameId)

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
      toast.success('Game ID copied to clipboard!')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center flex-wrap gap-2">
          <span>🎮 Stock Market Game</span>
          <div className="flex gap-2 items-center">
            <Button variant="ghost" size="sm" onClick={copyGameId} className="font-mono text-xs">
              📋 {gameId?.slice(0, 8)}...
            </Button>
            <Button variant="outline" onClick={onViewLeaderboard}>
              🏆 Leaderboard
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Round</p>
            <p className="text-2xl font-bold">
              {gameState.currentRound} / {gameState.maxRounds}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Turn</p>
            <p className="text-2xl font-bold">
              {gameState.currentTurnInRound} / {gameState.turnsPerRound}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Player</p>
            <p className="text-2xl font-bold">{currentPlayer.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="text-2xl font-bold text-green-600">${currentPlayer.cash.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
