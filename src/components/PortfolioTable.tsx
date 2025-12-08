import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GameState, Player } from '@/types'
import { chairmanIcon, directorIcon } from '@/lib/utils'

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
              const stock = gameState.stocks.find((s) => s.symbol === holding.symbol)
              const isChairman = stock?.chairmanId === currentPlayer.id
              const isDirector = stock?.directorId === currentPlayer.id
              const ownershipPct = stock
                ? ((holding.quantity / stock.totalQuantity) * 100).toFixed(1)
                : '0'

              return (
                <TableRow key={holding.symbol}>
                  <TableCell className="font-medium">{holding.symbol}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      {isChairman && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 gap-1">
                          <span>{chairmanIcon}</span>
                          <span>Chairman</span>
                        </Badge>
                      )}
                      {isDirector && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
                          <span>{directorIcon}</span>
                          <span>Director</span>
                        </Badge>
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
