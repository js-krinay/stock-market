import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Stock } from '@/types'
import { GameHeader } from './GameHeader'
import { StockMarketTable } from './StockMarketTable'
import { TradePanel } from './TradePanel'
import { AllPlayersTable } from './AllPlayersTable'
import { EventsTicker } from './EventsTicker'
import { PortfolioTable } from './PortfolioTable'
import { StockDetailsDialog } from './StockDetailsDialog'

export function FullGameScreen() {
  const gameState = useGameStore((state) => state.gameState)
  const game = useGameStore((state) => state.game)
  const executeTrade = useGameStore((state) => state.executeTrade)
  const endTurn = useGameStore((state) => state.endTurn)
  const setView = useGameStore((state) => state.setView)
  const isProcessingRound = useGameStore((state) => state.isProcessingRound)

  const [tradeSymbol, setTradeSymbol] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [selectedStockDetails, setSelectedStockDetails] = useState<Stock | null>(null)

  if (!gameState || !game) {
    return <div>Loading...</div>
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const portfolio = game.getPlayerPortfolio(currentPlayer.id)

  const handleTrade = async (type: 'buy' | 'sell', symbol: string, quantity: number) => {
    const result = executeTrade({
      type,
      symbol,
      quantity,
    })

    if (result) {
      setMessage(result.message)
      setTimeout(() => setMessage(null), 3000)

      if (result.success) {
        setTradeSymbol('')

        // Automatically end turn after successful trade
        const turnResult = await endTurn()
        if (turnResult?.gameOver) {
          setView('leaderboard')
        }
      }
    }
  }

  const handleSkip = async () => {
    const result = executeTrade({ type: 'skip' })

    if (result) {
      setMessage(result.message)
      setTimeout(() => setMessage(null), 3000)

      // Automatically end turn after skipping
      if (result.success) {
        const turnResult = await endTurn()
        if (turnResult?.gameOver) {
          setView('leaderboard')
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-4">
        {/* Header */}
        <GameHeader gameState={gameState} onViewLeaderboard={() => setView('leaderboard')} />

        {/* Market News Ticker */}
        <EventsTicker gameState={gameState} />

        <div className="grid md:grid-cols-2 gap-4">
          {/* Stock Market */}
          <StockMarketTable
            gameState={gameState}
            selectedSymbol={tradeSymbol}
            onSelectStock={setTradeSymbol}
            onViewDetails={setSelectedStockDetails}
          />

          {/* Trading Panel */}
          <TradePanel
            gameState={gameState}
            currentPlayer={currentPlayer}
            selectedSymbol={tradeSymbol}
            onSelectSymbol={setTradeSymbol}
            onTrade={handleTrade}
            onSkip={handleSkip}
            message={message}
          />
        </div>

        {/* Portfolio */}
        <PortfolioTable gameState={gameState} currentPlayer={currentPlayer} portfolio={portfolio} />

        {/* All Players */}
        <AllPlayersTable gameState={gameState} game={game} currentPlayer={currentPlayer} />
      </div>

      {/* Stock Details Dialog */}
      <StockDetailsDialog
        stock={selectedStockDetails}
        gameState={gameState}
        onClose={() => setSelectedStockDetails(null)}
      />

      {/* Round Processing Overlay */}
      {isProcessingRound && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Processing Round End</h3>
              <p className="text-gray-600 mt-2">Applying all accumulated events...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
