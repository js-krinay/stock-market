import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GameState, Player, CorporateAction } from '@/types'

interface TradePanelProps {
  gameState: GameState
  currentPlayer: Player
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onTrade: (type: 'buy' | 'sell', symbol: string, quantity: number) => void
  onSkip: () => void
  onPlayCorporateAction: (actionId: string, quantity?: number, stockSymbol?: string) => void
  message: string | null
}

export function TradePanel({
  gameState,
  currentPlayer,
  selectedSymbol,
  onSelectSymbol,
  onTrade,
  onSkip,
  onPlayCorporateAction,
  message,
}: TradePanelProps) {
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'corporate'>('buy')
  const [selectedCorporateAction, setSelectedCorporateAction] = useState<string>('')
  const [corporateActionStock, setCorporateActionStock] = useState<string>('')
  const [rightIssueQuantity, setRightIssueQuantity] = useState('')

  const selectedStock = gameState.stocks.find((s) => s.symbol === selectedSymbol)
  const quantity = parseInt(tradeQuantity) || 0

  // Get unplayed corporate actions for the current player
  const getCorporateActions = (): CorporateAction[] => {
    return currentPlayer.cards
      .filter((card) => card.type === 'corporate_action' && !(card.data as CorporateAction).played)
      .map((card) => card.data as CorporateAction)
  }

  const corporateActions = getCorporateActions()
  const selectedAction = corporateActions.find((a) => a.id === selectedCorporateAction)

  const getTradeValidation = () => {
    if (tradeType === 'corporate') {
      if (!selectedCorporateAction) {
        return { isValid: false, error: 'Please select a corporate action to play' }
      }

      const action = selectedAction
      if (!action) {
        return { isValid: false, error: 'Selected corporate action not found' }
      }

      if (!corporateActionStock) {
        return { isValid: false, error: 'Please select a stock for the corporate action' }
      }

      // For right issues, validate quantity
      if (action.type === 'right_issue') {
        const qty = parseInt(rightIssueQuantity) || 0
        if (qty <= 0) {
          return { isValid: false, error: 'Please enter a valid quantity for right issue' }
        }
      }

      return { isValid: true, error: null }
    }
    if (!selectedSymbol || !tradeQuantity || quantity <= 0) {
      return { isValid: false, error: 'Please select a stock and enter a valid quantity' }
    }

    if (!selectedStock) {
      return { isValid: false, error: 'Selected stock not found' }
    }

    if (tradeType === 'buy') {
      const totalCost = selectedStock.price * quantity
      if (totalCost > currentPlayer.cash) {
        return {
          isValid: false,
          error: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${currentPlayer.cash.toFixed(2)}`,
        }
      }
      if (quantity > selectedStock.availableQuantity) {
        return { isValid: false, error: `Only ${selectedStock.availableQuantity} shares available` }
      }
    } else if (tradeType === 'sell') {
      const holding = currentPlayer.portfolio.find((h) => h.symbol === selectedSymbol)
      if (!holding || holding.quantity < quantity) {
        return { isValid: false, error: `You only own ${holding?.quantity || 0} shares` }
      }
    }

    return { isValid: true, error: null }
  }

  const validation = getTradeValidation()

  const handleTrade = () => {
    if (validation.isValid) {
      if (tradeType === 'corporate') {
        const qty = selectedAction?.type === 'right_issue' ? parseInt(rightIssueQuantity) : undefined
        // Pass stock symbol along with the corporate action
        onPlayCorporateAction(selectedCorporateAction, qty, corporateActionStock)
        setSelectedCorporateAction('')
        setCorporateActionStock('')
        setRightIssueQuantity('')
      } else if (selectedStock) {
        onTrade(tradeType, selectedSymbol, quantity)
        setTradeQuantity('')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Error Display */}
        {!validation.isValid && selectedSymbol && tradeQuantity && (
          <div className="p-3 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
            ⚠️ {validation.error}
          </div>
        )}

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-3 rounded-lg ${message.includes('success') || message.includes('Bought') || message.includes('Sold') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {message}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={tradeType === 'buy' ? 'default' : 'outline'}
            onClick={() => setTradeType('buy')}
            className="flex-1"
          >
            Buy
          </Button>
          <Button
            variant={tradeType === 'sell' ? 'default' : 'outline'}
            onClick={() => setTradeType('sell')}
            className="flex-1"
          >
            Sell
          </Button>
          <Button
            variant={tradeType === 'corporate' ? 'default' : 'outline'}
            onClick={() => setTradeType('corporate')}
            className="flex-1"
          >
            💼 Corporate
          </Button>
        </div>

        {tradeType === 'corporate' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Corporate Action</label>
                <Select value={selectedCorporateAction} onValueChange={setSelectedCorporateAction}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a corporate action" />
                  </SelectTrigger>
                  <SelectContent>
                    {corporateActions.map((action) => (
                      <SelectItem key={action.id} value={action.id}>
                        {action.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Select Stock</label>
                <Select value={corporateActionStock} onValueChange={setCorporateActionStock}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameState.stocks.map((stock) => (
                      <SelectItem key={stock.symbol} value={stock.symbol}>
                        {stock.symbol} - {stock.name} (${stock.price.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedAction && (
              <>
                {selectedAction.type === 'right_issue' && corporateActionStock && (
                  (() => {
                    const rightIssueDetails = selectedAction.details as any
                    const pricePerShare = rightIssueDetails.price || 0
                    const ratio = rightIssueDetails.ratio || 1
                    const baseShares = rightIssueDetails.baseShares || 2

                    // Get selected stock and player's holding
                    const stock = gameState.stocks.find(s => s.symbol === corporateActionStock)
                    const holding = currentPlayer.portfolio.find(h => h.symbol === corporateActionStock)

                    // Calculate max allowed by holdings (based on right issue ratio)
                    const maxByHoldings = holding ? Math.floor(holding.quantity / baseShares) * ratio : 0

                    // Calculate max allowed by available stock in market
                    const maxByMarket = stock ? stock.availableQuantity : 0

                    // Calculate max allowed by cash
                    const maxByCash = pricePerShare > 0 ? Math.floor(currentPlayer.cash / pricePerShare) : 0

                    // Overall max is the minimum of all three
                    const maxAllowed = Math.min(maxByHoldings, maxByMarket, maxByCash)

                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="text-xs text-amber-900 space-y-1">
                            <div className="font-semibold mb-2">Maximum Allowed: {maxAllowed} shares</div>
                            <div>• By holdings: {maxByHoldings} shares ({holding?.quantity || 0} owned, {ratio}:{baseShares} ratio)</div>
                            <div>• By market availability: {maxByMarket} shares</div>
                            <div>• By cash: {maxByCash} shares (${currentPlayer.cash.toFixed(2)} available)</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium">Quantity</label>
                            <Input
                              type="number"
                              value={rightIssueQuantity}
                              onChange={(e) => setRightIssueQuantity(e.target.value)}
                              placeholder="Enter quantity"
                              max={maxAllowed}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="text-sm text-muted-foreground">
                              {rightIssueQuantity && parseInt(rightIssueQuantity) > 0 && (
                                <div className="p-2 rounded bg-gray-50 border">
                                  <div className="text-xs">
                                    Price: ${pricePerShare.toFixed(2)} per share
                                  </div>
                                  <div className="text-xs font-semibold mt-1">
                                    Total: ${(parseInt(rightIssueQuantity) * pricePerShare).toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                )}

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-1">{selectedAction.title}</div>
                  <div className="text-xs text-blue-700">
                    {selectedAction.type === 'right_issue'
                      ? `Offer new shares to existing shareholders at $${((selectedAction.details as any).price || 0).toFixed(2)} per share (1:2 ratio)`
                      : selectedAction.description
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Stock Symbol</label>
              <Select value={selectedSymbol} onValueChange={onSelectSymbol}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a stock" />
                </SelectTrigger>
                <SelectContent>
                  {gameState.stocks.map((stock) => (
                    <SelectItem key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name} (${stock.price.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Trade Summary */}
        {tradeType !== 'corporate' && selectedStock && quantity > 0 && validation.isValid && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Price per share:</span>
                <span className="text-sm font-medium text-blue-900">
                  ${selectedStock.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Quantity:</span>
                <span className="text-sm font-medium text-blue-900">{quantity}</span>
              </div>
              <div className="border-t border-blue-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-blue-900">
                    {tradeType === 'buy' ? '💳 Amount to Debit:' : '💰 Amount to Credit:'}
                  </span>
                  <span
                    className={`text-lg font-bold ${tradeType === 'buy' ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {tradeType === 'buy' ? '-' : '+'}${(selectedStock.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
              {tradeType === 'buy' && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-blue-600">Cash after trade:</span>
                  <span className="text-xs font-medium text-blue-800">
                    ${(currentPlayer.cash - selectedStock.price * quantity).toFixed(2)}
                  </span>
                </div>
              )}
              {tradeType === 'sell' && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-blue-600">Cash after trade:</span>
                  <span className="text-xs font-medium text-blue-800">
                    ${(currentPlayer.cash + selectedStock.price * quantity).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleTrade} disabled={!validation.isValid} className="flex-1">
            {tradeType === 'buy' ? 'Buy Stock' : tradeType === 'sell' ? 'Sell Stock' : 'Play Corporate Action'}
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip Turn
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
