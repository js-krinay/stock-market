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
import { useGameStore } from '@/store/gameStore'

export function Leaderboard() {
  const game = useGameStore((state) => state.game)
  const gameState = useGameStore((state) => state.gameState)
  const setView = useGameStore((state) => state.setView)

  if (!game || !gameState) {
    return <div>Loading...</div>
  }

  const rankings = game.getPlayerRankings()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">🏆 Leaderboard</CardTitle>
              <Button variant="outline" onClick={() => setView('game')}>
                ← Back to Game
              </Button>
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
                  const bgColor =
                    entry.rank === 1
                      ? 'bg-yellow-100'
                      : entry.rank === 2
                        ? 'bg-gray-100'
                        : entry.rank === 3
                          ? 'bg-orange-100'
                          : ''

                  return (
                    <TableRow key={entry.player.id} className={bgColor}>
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
              <Button onClick={() => setView('setup')}>Start New Game</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
