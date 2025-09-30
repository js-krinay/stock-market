import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GameState, Player } from '@/types'
import { GameEngine } from '@/game'

interface AllPlayersTableProps {
  gameState: GameState
  game: GameEngine
  currentPlayer: Player
}

export function AllPlayersTable({ gameState, game, currentPlayer }: AllPlayersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 All Players</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Cash</TableHead>
              <TableHead>Holdings</TableHead>
              <TableHead>Net Worth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gameState.players.map((player) => {
              const playerPortfolio = game.getPlayerPortfolio(player.id)
              return (
                <TableRow
                  key={player.id}
                  className={player.id === currentPlayer.id ? 'bg-primary/10' : ''}
                >
                  <TableCell className="font-medium">
                    {player.name}
                    {player.id === currentPlayer.id && ' (Current)'}
                  </TableCell>
                  <TableCell>${player.cash.toFixed(2)}</TableCell>
                  <TableCell>{player.portfolio.length}</TableCell>
                  <TableCell>${playerPortfolio?.totalValue.toFixed(2)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
