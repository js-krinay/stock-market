import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { useGameStore } from '@/store/gameStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { trpc } from '@/utils/trpc'

export function Leaderboard() {
  const gameId = useGameStore((state) => state.gameId)
  const setView = useGameStore((state) => state.setView)
  const setGameId = useGameStore((state) => state.setGameId)

  const { data: gameState } = trpc.game.getGameState.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId }
  )

  const { data: rankings, isLoading } = trpc.game.getPlayerRankings.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId }
  )

  if (isLoading || !rankings || !gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const handleNewGame = () => {
    setGameId('')
    setView('setup')
  }

  const handleBackToGame = () => {
    if (gameState.currentRound <= gameState.maxRounds) {
      setView('game')
    }
  }

  // Keyboard shortcuts for leaderboard
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Escape',
        description: 'Back to game',
        handler: handleBackToGame,
      },
    ],
  })

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">🏆 Leaderboard</CardTitle>
              {gameState.currentRound <= gameState.maxRounds && (
                <Button variant="outline" onClick={handleBackToGame}>
                  ← Back to Game <span className="keyboard-hint ml-2">Esc</span>
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">
              Round {gameState.currentRound} of {gameState.maxRounds}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Net Worth</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Holdings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((entry) => {
                  const getRankingRowClass = (rank: number) => {
                    switch (rank) {
                      case 1:
                        return 'bg-yellow-100 dark:bg-yellow-900/30'
                      case 2:
                        return 'bg-gray-100 dark:bg-gray-800/50'
                      case 3:
                        return 'bg-orange-100 dark:bg-orange-900/30'
                      default:
                        return ''
                    }
                  }

                  return (
                    <TableRow key={entry.player.id} className={getRankingRowClass(entry.rank)}>
                      <TableCell className="text-2xl font-bold">
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                        {entry.rank > 3 && entry.rank}
                      </TableCell>
                      <TableCell className="font-semibold text-lg">{entry.player.name}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${entry.totalValue.toFixed(2)}
                      </TableCell>
                      <TableCell>${entry.player.cash.toFixed(2)}</TableCell>
                      <TableCell>{entry.player.portfolio.length} stocks</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {gameState.currentRound > gameState.maxRounds && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center text-2xl">🎉 Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl mb-4">
                <strong>{rankings[0].player.name}</strong> wins with a net worth of{' '}
                <strong className="text-green-600">${rankings[0].totalValue.toFixed(2)}</strong>!
              </p>
              <Button onClick={handleNewGame}>Start New Game</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
