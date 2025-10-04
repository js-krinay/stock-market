import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { GameState, Player } from '@/types'
import { PlayerCardsDialog } from './PlayerCardsDialog'
import { PlayerLogsDialog } from './PlayerLogsDialog'

interface AllPlayersTableProps {
  gameState: GameState
  currentPlayer: Player
}

export function AllPlayersTable({ gameState, currentPlayer }: AllPlayersTableProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [logsPlayer, setLogsPlayer] = useState<Player | null>(null)

  return (
    <>
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
                <TableHead>Cards</TableHead>
                <TableHead>Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameState.players.map((player) => {
                // Calculate net worth
                const portfolioValue = player.portfolio.reduce((total, holding) => {
                  const stock = gameState.stocks.find((s) => s.symbol === holding.symbol)
                  return total + (stock ? stock.price * holding.quantity : 0)
                }, 0)
                const totalValue = player.cash + portfolioValue

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
                    <TableCell>${totalValue.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPlayer(player)}>
                        View Cards
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setLogsPlayer(player)}>
                        View Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPlayer && (
        <PlayerCardsDialog
          playerName={selectedPlayer.name}
          cards={[...selectedPlayer.events, ...selectedPlayer.corporateActions]}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      <PlayerLogsDialog
        player={logsPlayer}
        isOpen={!!logsPlayer}
        onClose={() => setLogsPlayer(null)}
      />
    </>
  )
}
