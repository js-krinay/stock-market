import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GameState, Stock } from '@/types'

interface StockMarketTableProps {
  gameState: GameState
  selectedSymbol: string
  onSelectStock: (symbol: string) => void
  onViewDetails: (stock: Stock) => void
}

export function StockMarketTable({
  gameState,
  selectedSymbol,
  onSelectStock,
  onViewDetails,
}: StockMarketTableProps) {
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'available'>('symbol')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: 'symbol' | 'price' | 'change' | 'available') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getSortedStocks = () => {
    const stocks = [...gameState.stocks]

    return stocks.sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'symbol':
          compareValue = a.symbol.localeCompare(b.symbol)
          break
        case 'price':
          compareValue = a.price - b.price
          break
        case 'change': {
          const currentRoundIndex = gameState.currentRound - 1
          const lastRoundPriceA =
            currentRoundIndex > 0 && a.priceHistory[currentRoundIndex - 1]
              ? a.priceHistory[currentRoundIndex - 1].price
              : a.priceHistory[0].price
          const lastRoundPriceB =
            currentRoundIndex > 0 && b.priceHistory[currentRoundIndex - 1]
              ? b.priceHistory[currentRoundIndex - 1].price
              : b.priceHistory[0].price
          const changeA = a.price - lastRoundPriceA
          const changeB = b.price - lastRoundPriceB
          compareValue = changeA - changeB
          break
        }
        case 'available':
          compareValue = a.availableQuantity - b.availableQuantity
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Stock Market</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-1">
                  Symbol
                  {sortBy === 'symbol' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
              </TableHead>
              <TableHead>Leadership</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-1">
                  Price
                  {sortBy === 'price' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('change')}
              >
                <div className="flex items-center gap-1">
                  Change
                  {sortBy === 'change' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('available')}
              >
                <div className="flex items-center gap-1">
                  Available
                  {sortBy === 'available' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
              </TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedStocks().map((stock) => {
              // Calculate change from last round's price
              const currentRoundIndex = gameState.currentRound - 1
              const lastRoundPrice =
                currentRoundIndex > 0 && stock.priceHistory[currentRoundIndex - 1]
                  ? stock.priceHistory[currentRoundIndex - 1].price
                  : stock.priceHistory[0].price

              const priceChange = stock.price - lastRoundPrice
              const priceChangePercent =
                lastRoundPrice !== 0 ? (priceChange / lastRoundPrice) * 100 : 0

              // Get leadership info for this stock
              const chairman = stock.chairmanId
                ? gameState.players.find((p) => p.id === stock.chairmanId)
                : null
              const director = stock.directorId
                ? gameState.players.find((p) => p.id === stock.directorId)
                : null

              return (
                <TableRow
                  key={stock.symbol}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => onSelectStock(stock.symbol)}
                  style={{
                    backgroundColor:
                      selectedSymbol === stock.symbol ? stock.color + '40' : undefined,
                    borderLeft: `4px solid ${stock.color}`,
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stock.color }}
                      />
                      {stock.symbol}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {chairman && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-600 font-semibold">🏆</span>
                          <span className="text-muted-foreground">{chairman.name}</span>
                        </div>
                      )}
                      {director && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600 font-semibold">👔</span>
                          <span className="text-muted-foreground">{director.name}</span>
                        </div>
                      )}
                      {!chairman && !director && <span className="text-gray-400">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${stock.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {priceChange !== 0 ? (
                      <span
                        className={
                          priceChange > 0
                            ? 'text-green-600 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {priceChange > 0 ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)}
                        <span className="text-xs ml-1">
                          ({priceChange > 0 ? '+' : ''}
                          {priceChangePercent.toFixed(2)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stock.availableQuantity.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(stock)
                      }}
                    >
                      📊
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
