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
import {
  GameState,
  Player,
  CorporateAction,
  DividendDetails,
  RightIssueDetails,
  BonusIssueDetails,
} from '@/types'

interface TradePanelProps {
  gameState: GameState
  currentPlayer: Player
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onTrade: (type: 'buy' | 'sell', symbol: string, quantity: number) => void
  onSkip: () => void
  onPlayCorporateAction: (actionId: string, quantity?: number, stockSymbol?: string) => void
}

export function TradePanel({
  gameState,
  currentPlayer,
  selectedSymbol,
  onSelectSymbol,
  onTrade,
  onSkip,
  onPlayCorporateAction,
}: TradePanelProps) {
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'corporate'>('buy')
  const [selectedCorporateAction, setSelectedCorporateAction] = useState<string>('')
  const [corporateActionStock, setCorporateActionStock] = useState<string>('')
  const [rightIssueQuantity, setRightIssueQuantity] = useState('')

  const selectedStock = gameState.stocks.find((s) => s.symbol === selectedSymbol)
  const quantity = parseInt(tradeQuantity) || 0

  // Calculate max allowed quantity for buy/sell
  const getMaxQuantity = (): number => {
    if (!selectedStock) return 0

    if (tradeType === 'buy') {
      const maxByCash = Math.floor(currentPlayer.cash / selectedStock.price)
      const maxByMarket = selectedStock.availableQuantity
      return Math.min(maxByCash, maxByMarket)
    } else if (tradeType === 'sell') {
      const holding = currentPlayer.portfolio.find((h) => h.symbol === selectedSymbol)
      return holding?.quantity || 0
    }

    return 0
  }

  const maxQuantity = getMaxQuantity()

  // Get unplayed corporate actions for the current player
  const getCorporateActions = (): CorporateAction[] => {
    return currentPlayer.cards
      .filter((card) => {
        if (card.type !== 'corporate_action' || !card.data) return false
        const action = card.data as CorporateAction
        return !action.played
      })
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
        const qty =
          selectedAction?.type === 'right_issue' ? parseInt(rightIssueQuantity) : undefined
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
                {selectedAction.type === 'dividend' &&
                  corporateActionStock &&
                  (() => {
                    const dividendDetails = selectedAction.details as DividendDetails
                    const dividendPercentage = dividendDetails.dividendPercentage

                    // Get selected stock and player's holding
                    const stock = gameState.stocks.find((s) => s.symbol === corporateActionStock)
                    const holding = currentPlayer.portfolio.find(
                      (h) => h.symbol === corporateActionStock
                    )

                    // Calculate dividend amounts
                    const dividendPerShare = stock ? stock.price * dividendPercentage : 0
                    const totalDividend = holding ? holding.quantity * dividendPerShare : 0
                    const dividendPercent = (dividendPercentage * 100).toFixed(0)

                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div className="text-xs text-emerald-900 space-y-1">
                            <div className="font-semibold mb-2">💵 Dividend Preview</div>
                            <div>• Stock price: ${stock?.price.toFixed(2) || '0.00'}</div>
                            <div>• Dividend rate: {dividendPercent}% of stock price</div>
                            <div>• Per share dividend: ${dividendPerShare.toFixed(2)}</div>
                            <div>• Your holdings: {holding?.quantity || 0} shares</div>
                            <div className="font-semibold text-emerald-700 mt-2 pt-2 border-t border-emerald-300">
                              • Total you'll receive: ${totalDividend.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                {selectedAction.type === 'right_issue' &&
                  corporateActionStock &&
                  (() => {
                    const rightIssueDetails = selectedAction.details as RightIssueDetails
                    const ratio = rightIssueDetails.ratio
                    const baseShares = rightIssueDetails.baseShares
                    const discountPercentage = rightIssueDetails.discountPercentage

                    // Get selected stock and player's holding
                    const stock = gameState.stocks.find((s) => s.symbol === corporateActionStock)
                    const holding = currentPlayer.portfolio.find(
                      (h) => h.symbol === corporateActionStock
                    )

                    // Right issue price uses discount from backend
                    const pricePerShare = stock ? stock.price * discountPercentage : 0
                    const discountPercent = ((1 - discountPercentage) * 100).toFixed(0)

                    // Calculate max allowed by holdings (based on right issue ratio)
                    const maxByHoldings = holding
                      ? Math.floor(holding.quantity / baseShares) * ratio
                      : 0

                    // Calculate max allowed by available stock in market
                    const maxByMarket = stock ? stock.availableQuantity : 0

                    // Calculate max allowed by cash at discounted price
                    const maxByCash =
                      pricePerShare > 0 ? Math.floor(currentPlayer.cash / pricePerShare) : 0

                    // Overall max is the minimum of all three
                    const maxAllowed = Math.min(maxByHoldings, maxByMarket, maxByCash)

                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="text-xs text-amber-900 space-y-1">
                            <div className="font-semibold mb-2">
                              Maximum Allowed: {maxAllowed} shares
                            </div>
                            <div>
                              • By holdings: {maxByHoldings} shares ({holding?.quantity || 0} owned,{' '}
                              {ratio}:{baseShares} ratio)
                            </div>
                            <div>• By market availability: {maxByMarket} shares</div>
                            <div>
                              • By cash: {maxByCash} shares (${currentPlayer.cash.toFixed(2)}{' '}
                              available)
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Quantity</label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                value={rightIssueQuantity}
                                onChange={(e) => setRightIssueQuantity(e.target.value)}
                                placeholder="Enter quantity"
                                max={maxAllowed}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRightIssueQuantity(maxAllowed.toString())}
                                disabled={maxAllowed === 0}
                                className="px-3"
                              >
                                Max
                              </Button>
                            </div>
                          </div>

                          {rightIssueQuantity && parseInt(rightIssueQuantity) > 0 && (
                            <div className="p-2 rounded bg-gray-50 border">
                              <div className="text-xs">
                                Price: ${pricePerShare.toFixed(2)} per share ({discountPercent}%
                                discount)
                              </div>
                              <div className="text-xs font-semibold mt-1">
                                Total: ${(parseInt(rightIssueQuantity) * pricePerShare).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                {selectedAction.type === 'bonus_issue' &&
                  corporateActionStock &&
                  (() => {
                    const bonusDetails = selectedAction.details as BonusIssueDetails
                    const ratio = bonusDetails.ratio
                    const baseShares = bonusDetails.baseShares

                    // Get selected stock and player's holding
                    const stock = gameState.stocks.find((s) => s.symbol === corporateActionStock)
                    const holding = currentPlayer.portfolio.find(
                      (h) => h.symbol === corporateActionStock
                    )

                    // Calculate bonus shares
                    const bonusShares = holding
                      ? Math.floor(holding.quantity / baseShares) * ratio
                      : 0
                    const newTotalShares = (holding?.quantity || 0) + bonusShares

                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="text-xs text-amber-900 space-y-1">
                            <div className="font-semibold mb-2">🎁 Bonus Issue Preview</div>
                            <div>
                              • Stock: {stock?.name || corporateActionStock} ($
                              {stock?.price.toFixed(2) || '0.00'})
                            </div>
                            <div>
                              • Bonus ratio: {ratio}:{baseShares} (get {ratio} free share
                              {ratio > 1 ? 's' : ''} for every {baseShares} you own)
                            </div>
                            <div>• Your current holdings: {holding?.quantity || 0} shares</div>
                            <div className="font-semibold text-amber-700 mt-2 pt-2 border-t border-amber-300">
                              • Bonus shares you'll receive: {bonusShares} shares
                            </div>
                            <div className="font-semibold text-amber-700">
                              • New total holdings: {newTotalShares} shares
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-1">
                    {selectedAction.title}
                  </div>
                  <div className="text-xs text-blue-700">
                    {selectedAction.type === 'right_issue'
                      ? `Offer new shares to existing shareholders at $${((selectedAction.details as any).price || 0).toFixed(2)} per share (1:2 ratio)`
                      : selectedAction.description}
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
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTradeQuantity(maxQuantity.toString())}
                  disabled={maxQuantity === 0}
                  className="px-3"
                  title={
                    tradeType === 'buy'
                      ? `Max: ${maxQuantity} shares (limited by ${Math.floor(currentPlayer.cash / (selectedStock?.price || 1)) < (selectedStock?.availableQuantity || 0) ? 'cash' : 'market availability'})`
                      : `Max: ${maxQuantity} shares (your holdings)`
                  }
                >
                  Max
                </Button>
              </div>
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
            {tradeType === 'buy'
              ? 'Buy Stock'
              : tradeType === 'sell'
                ? 'Sell Stock'
                : 'Play Corporate Action'}
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip Turn
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
