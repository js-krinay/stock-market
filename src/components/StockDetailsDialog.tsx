import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GameState, Stock } from '@/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { chairmanIcon, directorIcon } from '@/lib/utils'
import { getEventCardClasses, getEventEmoji } from '@/lib/event-styles'
import type { EventType, EventSeverity } from '@/lib/event-styles'
import { useDialogKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface StockDetailsDialogProps {
  stock: Stock | null
  gameState: GameState
  onClose: () => void
}

export function StockDetailsDialog({ stock, gameState, onClose }: StockDetailsDialogProps) {
  // Add Escape key handler to close dialog
  useDialogKeyboardShortcuts(onClose, !!stock)

  if (!stock) return null

  return (
    <Dialog open={!!stock} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: stock.color }} />
            {stock.name} ({stock.symbol})
          </DialogTitle>
          <DialogDescription>Stock Symbol: {stock.symbol}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">${stock.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Shares</p>
              <p className="text-2xl font-bold">{stock.availableQuantity.toLocaleString()}</p>
            </div>
          </div>

          {/* Price History Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Price History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stock.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="round"
                  label={{ value: 'Round', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => `Round ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={stock.color}
                  strokeWidth={2}
                  dot={{ fill: stock.color, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Price Statistics */}
          {stock.priceHistory.length > 1 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Starting Price</p>
                <p className="text-lg font-semibold">${stock.priceHistory[0].price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Highest Price</p>
                <p className="text-lg font-semibold">
                  ${Math.max(...stock.priceHistory.map((h) => h.price)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lowest Price</p>
                <p className="text-lg font-semibold">
                  ${Math.min(...stock.priceHistory.map((h) => h.price)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Events Affecting This Stock */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Events Affecting {stock.symbol}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {gameState.eventHistory
                .filter(
                  (event) =>
                    event.affectedStocks.includes(stock.symbol) &&
                    event.round <= gameState.currentRound
                )
                .map((event, idx) => {
                  const isExcluded = !!event.excludedBy
                  const eventColors = getEventCardClasses(
                    event.type as EventType,
                    event.severity as EventSeverity
                  )
                  const typeEmoji = getEventEmoji(event.type as EventType, isExcluded)
                  const impactSign = event.impact > 0 ? '+' : ''

                  const excludedByPlayer = isExcluded
                    ? gameState.players.find((p) => p.id === event.excludedBy)
                    : null

                  // Determine leadership role for the excluder
                  let leadershipRole = 'Leader'
                  let leadershipIcon = '👤'
                  if (isExcluded && stock) {
                    if (stock.chairmanId === event.excludedBy) {
                      leadershipRole = 'Chairman'
                      leadershipIcon = chairmanIcon
                    } else if (stock.directorId === event.excludedBy) {
                      leadershipRole = 'Director'
                      leadershipIcon = directorIcon
                    }
                  }

                  return (
                    <div
                      key={idx}
                      className={`text-xs border rounded p-2 ${eventColors} ${isExcluded ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{isExcluded ? '🚫' : typeEmoji}</span>
                            <span className="font-semibold">{event.title}</span>
                            <span className="px-1.5 py-0.5 rounded text-xs bg-black/10">
                              {event.severity}
                            </span>
                            {isExcluded && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-200 text-yellow-900 font-semibold">
                                EXCLUDED
                              </span>
                            )}
                          </div>
                          <p className={isExcluded ? 'opacity-70 line-through' : 'opacity-90'}>
                            {event.description}
                          </p>
                          {isExcluded && excludedByPlayer && (
                            <p className="mt-1 text-xs font-medium text-yellow-800">
                              ⚠️ Excluded by {excludedByPlayer.name} ({leadershipIcon}{' '}
                              {leadershipRole})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-75">Round {event.round}</p>
                          <p className={`font-semibold ${isExcluded ? 'line-through' : ''}`}>
                            {impactSign}${Math.abs(event.impact).toFixed(2)}
                          </p>
                          {isExcluded && (
                            <p className="text-xs font-medium text-gray-600">No Impact</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              {gameState.eventHistory.filter(
                (event) =>
                  event.affectedStocks.includes(stock.symbol) &&
                  event.round <= gameState.currentRound
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No events have affected this stock yet
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
