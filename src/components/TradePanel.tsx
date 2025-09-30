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
import { GameState, Player } from '@/types'

interface TradePanelProps {
  gameState: GameState
  currentPlayer: Player
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onTrade: (type: 'buy' | 'sell', symbol: string, quantity: number) => void
  onSkip: () => void
  message: string | null
}

export function TradePanel({
  gameState,
  currentPlayer,
  selectedSymbol,
  onSelectSymbol,
  onTrade,
  onSkip,
  message,
}: TradePanelProps) {
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')

  const selectedStock = gameState.stocks.find((s) => s.symbol === selectedSymbol)
  const quantity = parseInt(tradeQuantity) || 0

  const getTradeValidation = () => {
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
    if (validation.isValid && selectedStock) {
      onTrade(tradeType, selectedSymbol, quantity)
      setTradeQuantity('')
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
        </div>

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

        {/* Trade Summary */}
        {selectedStock && quantity > 0 && validation.isValid && (
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
            {tradeType === 'buy' ? 'Buy Stock' : 'Sell Stock'}
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip Turn
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
