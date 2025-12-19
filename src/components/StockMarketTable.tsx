import { useState, useEffect, useRef } from 'react'
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
import { chairmanIcon, directorIcon } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({})
  const previousPricesRef = useRef<Record<string, number>>({})

  // Track price changes and trigger flash animation
  useEffect(() => {
    const newFlashes: Record<string, 'up' | 'down' | null> = {}
    let hasChanges = false

    gameState.stocks.forEach((stock) => {
      const prevPrice = previousPricesRef.current[stock.symbol]
      if (prevPrice !== undefined && prevPrice !== stock.price) {
        newFlashes[stock.symbol] = stock.price > prevPrice ? 'up' : 'down'
        hasChanges = true
      }
      previousPricesRef.current[stock.symbol] = stock.price
    })

    if (hasChanges) {
      setPriceFlash(newFlashes)
      // Clear flash after animation
      const timer = setTimeout(() => setPriceFlash({}), 1000)
      return () => clearTimeout(timer)
    }
  }, [gameState.stocks])

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

  const sortedStocks = getSortedStocks()

  // Reset focused index when stocks change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [sortBy, sortOrder])

  // Keyboard shortcuts for stock table
  useKeyboardShortcuts({
    shortcuts: [
      // Number keys for quick stock selection
      {
        key: '1',
        description: 'Select first stock',
        handler: () => sortedStocks[0] && onSelectStock(sortedStocks[0].symbol),
      },
      {
        key: '2',
        description: 'Select second stock',
        handler: () => sortedStocks[1] && onSelectStock(sortedStocks[1].symbol),
      },
      {
        key: '3',
        description: 'Select third stock',
        handler: () => sortedStocks[2] && onSelectStock(sortedStocks[2].symbol),
      },
      {
        key: '4',
        description: 'Select fourth stock',
        handler: () => sortedStocks[3] && onSelectStock(sortedStocks[3].symbol),
      },
      {
        key: '5',
        description: 'Select fifth stock',
        handler: () => sortedStocks[4] && onSelectStock(sortedStocks[4].symbol),
      },
      {
        key: '6',
        description: 'Select sixth stock',
        handler: () => sortedStocks[5] && onSelectStock(sortedStocks[5].symbol),
      },
      // Arrow key navigation
      {
        key: 'ArrowDown',
        description: 'Navigate stock list down',
        handler: () => {
          const newIndex = Math.min(focusedIndex + 1, sortedStocks.length - 1)
          setFocusedIndex(newIndex)
          if (sortedStocks[newIndex]) {
            onSelectStock(sortedStocks[newIndex].symbol)
          }
        },
      },
      {
        key: 'ArrowUp',
        description: 'Navigate stock list up',
        handler: () => {
          const newIndex = Math.max(focusedIndex - 1, 0)
          setFocusedIndex(newIndex)
          if (sortedStocks[newIndex]) {
            onSelectStock(sortedStocks[newIndex].symbol)
          }
        },
      },
      // Sorting shortcuts
      {
        key: 's',
        shift: true,
        description: 'Sort by Symbol',
        handler: () => handleSort('symbol'),
      },
      {
        key: 'p',
        shift: true,
        description: 'Sort by Price',
        handler: () => handleSort('price'),
      },
      {
        key: 'c',
        shift: true,
        description: 'Sort by Change',
        handler: () => handleSort('change'),
      },
      {
        key: 'a',
        shift: true,
        description: 'Sort by Available',
        handler: () => handleSort('available'),
      },
    ],
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Stock Market</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
              {sortedStocks.map((stock, index) => {
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

                const isSelected = selectedSymbol === stock.symbol

                return (
                  <TableRow
                    key={stock.symbol}
                    className={`cursor-pointer hover:bg-muted keyboard-focusable-row ${
                      isSelected ? 'keyboard-selected-row' : ''
                    }`}
                    tabIndex={0}
                    onClick={() => {
                      onSelectStock(stock.symbol)
                      setFocusedIndex(index)
                    }}
                    onFocus={() => setFocusedIndex(index)}
                    style={{
                      backgroundColor: isSelected ? stock.color + '40' : undefined,
                      borderLeft: `4px solid ${stock.color}`,
                    }}
                    data-stock-index={index}
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
                            <span className="text-yellow-600 font-semibold">{chairmanIcon}</span>
                            <span className="text-muted-foreground">{chairman.name}</span>
                          </div>
                        )}
                        {director && (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-semibold">{directorIcon}</span>
                            <span className="text-muted-foreground">{director.name}</span>
                          </div>
                        )}
                        {!chairman && !director && <span className="text-gray-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'font-semibold transition-colors duration-300',
                        priceFlash[stock.symbol] === 'up' && 'bg-green-100 dark:bg-green-900/30',
                        priceFlash[stock.symbol] === 'down' && 'bg-red-100 dark:bg-red-900/30'
                      )}
                    >
                      ${stock.price.toFixed(2)}
                    </TableCell>
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
        </div>
      </CardContent>
    </Card>
  )
}
