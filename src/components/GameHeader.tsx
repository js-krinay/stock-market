import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameState } from '@/types'

interface GameHeaderProps {
  gameState: GameState
  onViewLeaderboard: () => void
}

export function GameHeader({ gameState, onViewLeaderboard }: GameHeaderProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>🎮 Stock Market Game</span>
          <Button variant="outline" onClick={onViewLeaderboard}>
            🏆 Leaderboard
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <div>
            <p className="text-sm text-muted-foreground">Pending Events</p>
            <p className="text-2xl font-bold text-orange-600">
              {gameState.roundEvents[gameState.currentRound]?.length || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
