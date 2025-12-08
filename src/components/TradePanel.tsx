import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GameState, Player } from '@/types'
import { trpc } from '@/utils/trpc'
import { useGameStore } from '@/store/gameStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

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
  const gameId = useGameStore((state) => state.gameId)
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'corporate'>('buy')
  const [selectedCorporateAction, setSelectedCorporateAction] = useState<string>('')
  const [corporateActionStock, setCorporateActionStock] = useState<string>('')
  const [rightIssueQuantity, setRightIssueQuantity] = useState('')

  const selectedStock = gameState.stocks.find((s) => s.symbol === selectedSymbol)
  const quantity = parseInt(tradeQuantity) || 0

  // Get unplayed corporate actions
  const corporateActions = currentPlayer.corporateActions.filter((action) => !action.played)
  const selectedAction = corporateActions.find((a) => a.id === selectedCorporateAction)

  // Query trade validation from server
  const { data: tradeValidation } = trpc.game.validateTrade.useQuery(
    {
      gameId: gameId!,
      type: tradeType === 'buy' || tradeType === 'sell' ? tradeType : 'buy',
      symbol: selectedSymbol,
      quantity: quantity > 0 ? quantity : undefined,
    },
    {
      enabled:
        !!gameId &&
        !!selectedSymbol &&
        (tradeType === 'buy' || tradeType === 'sell') &&
        !gameState.isComplete,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  )

  // Query corporate action preview from server
  const { data: corporateActionPreview } = trpc.game.getCorporateActionPreview.useQuery(
    {
      gameId: gameId!,
      corporateActionId: selectedCorporateAction,
      stockSymbol: corporateActionStock,
      quantity:
        selectedAction?.type === 'right_issue' && parseInt(rightIssueQuantity) > 0
          ? parseInt(rightIssueQuantity)
          : undefined,
    },
    {
      enabled:
        !!gameId &&
        !!selectedCorporateAction &&
        !!corporateActionStock &&
        tradeType === 'corporate' &&
        !gameState.isComplete,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  )

  // Reset quantity when switching trade type or symbol
  useEffect(() => {
    setTradeQuantity('')
  }, [tradeType, selectedSymbol])

  // Sync corporate action stock with selected symbol when in corporate mode
  useEffect(() => {
    if (tradeType === 'corporate' && selectedSymbol) {
      setCorporateActionStock(selectedSymbol)
    }
  }, [selectedSymbol, tradeType])

  const handleTrade = () => {
    if (tradeType === 'corporate') {
      if (corporateActionPreview?.isValid) {
        const qty =
          selectedAction?.type === 'right_issue' ? parseInt(rightIssueQuantity) : undefined
        onPlayCorporateAction(selectedCorporateAction, qty, corporateActionStock)
        setSelectedCorporateAction('')
        setCorporateActionStock('')
        setRightIssueQuantity('')
      }
    } else if (tradeValidation?.isValid && selectedStock) {
      onTrade(tradeType, selectedSymbol, quantity)
      setTradeQuantity('')
    }
  }

  const maxQuantity = tradeValidation?.maxQuantity || 0
  const preview = corporateActionPreview?.preview

  // Keyboard shortcuts for trade panel
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'b',
        description: 'Switch to Buy mode',
        handler: () => setTradeType('buy'),
      },
      {
        key: 's',
        description: 'Switch to Sell mode',
        handler: () => setTradeType('sell'),
      },
      {
        key: 'c',
        description: 'Switch to Corporate action mode',
        handler: () => setTradeType('corporate'),
      },
      {
        key: 'k',
        description: 'Skip turn',
        handler: () => onSkip(),
      },
      {
        key: 'm',
        description: 'Set quantity to Max',
        handler: () => {
          if (tradeType === 'buy' || tradeType === 'sell') {
            setTradeQuantity(maxQuantity.toString())
          } else if (tradeType === 'corporate' && selectedAction?.type === 'right_issue') {
            setRightIssueQuantity((preview?.maxAllowed || 0).toString())
          }
        },
      },
      {
        key: 'Enter',
        description: 'Execute trade',
        handler: () => {
          if (
            tradeType === 'corporate' ? corporateActionPreview?.isValid : tradeValidation?.isValid
          ) {
            handleTrade()
          }
        },
        preventDefault: false, // Allow Enter in input fields
      },
    ],
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Error Display */}
        {tradeType !== 'corporate' && tradeValidation && !tradeValidation.isValid && (
          <Alert variant="warning">
            <AlertDescription>⚠️ {tradeValidation.error}</AlertDescription>
          </Alert>
        )}

        {tradeType === 'corporate' && corporateActionPreview && !corporateActionPreview.isValid && (
          <Alert variant="warning">
            <AlertDescription>⚠️ {corporateActionPreview.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            variant={tradeType === 'buy' ? 'default' : 'outline'}
            onClick={() => setTradeType('buy')}
            className={`flex-1 ${tradeType === 'buy' ? 'trade-mode-active' : ''}`}
          >
            Buy <span className="keyboard-hint ml-2">B</span>
          </Button>
          <Button
            variant={tradeType === 'sell' ? 'default' : 'outline'}
            onClick={() => setTradeType('sell')}
            className={`flex-1 ${tradeType === 'sell' ? 'trade-mode-active' : ''}`}
          >
            Sell <span className="keyboard-hint ml-2">S</span>
          </Button>
          <Button
            variant={tradeType === 'corporate' ? 'default' : 'outline'}
            onClick={() => setTradeType('corporate')}
            className={`flex-1 ${tradeType === 'corporate' ? 'trade-mode-active' : ''}`}
          >
            💼 Corporate <span className="keyboard-hint ml-2">C</span>
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

            {/* Corporate Action Preview */}
            {preview && (
              <>
                {preview.type === 'dividend' && (
                  <Alert variant="success">
                    <AlertDescription>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold mb-2">💵 Dividend Preview</div>
                        <div>• Stock price: ${preview.stockPrice?.toFixed(2) || '0.00'}</div>
                        <div>
                          • Dividend rate: {preview.dividendPercent?.toFixed(0)}% of stock price
                        </div>
                        <div>
                          • Per share dividend: ${preview.dividendPerShare?.toFixed(2) || '0.00'}
                        </div>
                        <div>• Your holdings: {preview.currentHoldings || 0} shares</div>
                        <div className="font-semibold mt-2 pt-2 border-t border-green-300">
                          • Total you'll receive: ${preview.totalDividend?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {preview.type === 'right_issue' && (
                  <>
                    <Alert variant="warning">
                      <AlertDescription>
                        <div className="text-xs space-y-1">
                          <div className="font-semibold mb-2">
                            Maximum Allowed: {preview.maxAllowed || 0} shares
                          </div>
                          <div>
                            • By holdings: {preview.maxByHoldings || 0} shares (
                            {preview.currentHoldings || 0} owned, {preview.ratio}:{preview.baseShares}{' '}
                            ratio)
                          </div>
                          <div>• By market availability: {preview.maxByMarket || 0} shares</div>
                          <div>
                            • By cash: {preview.maxByCash || 0} shares ($
                            {currentPlayer.cash.toFixed(2)} available)
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            value={rightIssueQuantity}
                            onChange={(e) => setRightIssueQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            max={preview.maxAllowed || 0}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setRightIssueQuantity((preview.maxAllowed || 0).toString())
                            }
                            disabled={!preview.maxAllowed || preview.maxAllowed === 0}
                            className="px-3"
                          >
                            Max
                          </Button>
                        </div>
                      </div>

                      {rightIssueQuantity && parseInt(rightIssueQuantity) > 0 && (
                        <div className="p-2 rounded bg-gray-50 border">
                          <div className="text-xs">
                            Price: ${preview.pricePerShare?.toFixed(2) || '0.00'} per share (
                            {preview.discountPercent?.toFixed(0)}% discount)
                          </div>
                          <div className="text-xs font-semibold mt-1">
                            Total: $
                            {(parseInt(rightIssueQuantity) * (preview.pricePerShare || 0)).toFixed(
                              2
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {preview.type === 'bonus_issue' && (
                  <Alert variant="warning">
                    <AlertDescription>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold mb-2">🎁 Bonus Issue Preview</div>
                        <div>
                          • Stock: {corporateActionStock} (${preview.stockPrice?.toFixed(2) || '0.00'}
                          )
                        </div>
                        <div>
                          • Bonus ratio: {preview.ratio}:{preview.baseShares} (get {preview.ratio}{' '}
                          free share{(preview.ratio || 0) > 1 ? 's' : ''} for every{' '}
                          {preview.baseShares} you own)
                        </div>
                        <div>• Your current holdings: {preview.currentHoldings || 0} shares</div>
                        <div className="font-semibold mt-2 pt-2 border-t border-amber-300">
                          • Bonus shares you'll receive: {preview.bonusShares || 0} shares
                        </div>
                        <div className="font-semibold">
                          • New total holdings: {preview.newTotalShares || 0} shares
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert variant="info">
                  <AlertDescription>
                    <div className="text-sm font-semibold mb-1">{selectedAction?.title}</div>
                    <div className="text-xs">{selectedAction?.description}</div>
                  </AlertDescription>
                </Alert>
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
                  title={`Max: ${maxQuantity} shares`}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trade Summary */}
        {tradeType !== 'corporate' && selectedStock && quantity > 0 && tradeValidation?.isValid && (
          <Alert variant="info">
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Price per share:</span>
                  <span className="text-sm font-medium">${selectedStock.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quantity:</span>
                  <span className="text-sm font-medium">{quantity}</span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">
                      {tradeType === 'buy' ? '💳 Amount to Debit:' : '💰 Amount to Credit:'}
                    </span>
                    <span
                      className={`text-lg font-bold ${tradeType === 'buy' ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {tradeType === 'buy' ? '-' : '+'}${(selectedStock.price * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs">Cash after trade:</span>
                  <span className="text-xs font-medium">
                    $
                    {(
                      currentPlayer.cash +
                      (tradeType === 'buy' ? -1 : 1) * selectedStock.price * quantity
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleTrade}
            disabled={
              gameState.isComplete ||
              (tradeType === 'corporate'
                ? !corporateActionPreview?.isValid
                : !tradeValidation?.isValid)
            }
            className="flex-1"
          >
            {tradeType === 'buy'
              ? 'Buy Stock'
              : tradeType === 'sell'
                ? 'Sell Stock'
                : 'Play Corporate Action'}{' '}
            <span className="keyboard-hint ml-2">Enter</span>
          </Button>
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={gameState.isComplete}
            className="flex-1"
          >
            Skip Turn <span className="keyboard-hint ml-2">K</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
