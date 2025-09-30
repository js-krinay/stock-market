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

interface PortfolioHolding {
  symbol: string
  quantity: number
  averageCost: number
  currentPrice: number
  totalValue: number
  profitLoss: number
  profitLossPercent: number
}

interface PlayerPortfolio {
  cash: number
  holdings: PortfolioHolding[]
  totalValue: number
}

interface PortfolioTableProps {
  gameState: GameState
  currentPlayer: Player
  portfolio: PlayerPortfolio | null
}

export function PortfolioTable({ gameState, currentPlayer, portfolio }: PortfolioTableProps) {
  if (!portfolio || portfolio.holdings.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💼 Your Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Avg Cost</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.holdings.map((holding) => {
              const leadership = gameState.stockLeadership.find((l) => l.symbol === holding.symbol)
              const isChairman = leadership?.chairmanId === currentPlayer.id
              const isDirector = leadership?.directorId === currentPlayer.id
              const stock = gameState.stocks.find((s) => s.symbol === holding.symbol)
              const ownershipPct = stock
                ? ((holding.quantity / stock.totalQuantity) * 100).toFixed(1)
                : '0'

              return (
                <TableRow key={holding.symbol}>
                  <TableCell className="font-medium">{holding.symbol}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      {isChairman && (
                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          <span>🏆</span>
                          <span className="font-semibold">Chairman</span>
                        </div>
                      )}
                      {isDirector && (
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          <span>👔</span>
                          <span className="font-semibold">Director</span>
                        </div>
                      )}
                      {!isChairman && !isDirector && (
                        <span className="text-muted-foreground">{ownershipPct}%</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{holding.quantity}</TableCell>
                  <TableCell>${holding.averageCost.toFixed(2)}</TableCell>
                  <TableCell>${holding.currentPrice.toFixed(2)}</TableCell>
                  <TableCell>${holding.totalValue.toFixed(2)}</TableCell>
                  <TableCell
                    className={holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {holding.profitLoss >= 0 ? '+' : ''}
                    {holding.profitLoss.toFixed(2)}({holding.profitLossPercent.toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <div className="mt-4 text-right">
          <p className="text-lg">
            <strong>Total Portfolio Value:</strong> ${portfolio.totalValue.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
