import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Stock } from '@/types'
import { GameHeader } from './GameHeader'
import { StockMarketTable } from './StockMarketTable'
import { TradePanel } from './TradePanel'
import { AllPlayersTable } from './AllPlayersTable'
import { PortfolioTable } from './PortfolioTable'
import { StockDetailsDialog } from './StockDetailsDialog'
import { toast } from 'sonner'
import { trpc } from '@/utils/trpc'

export function FullGameScreen() {
  const gameId = useGameStore((state) => state.gameId)
  const setView = useGameStore((state) => state.setView)
  const isProcessingRound = useGameStore((state) => state.isProcessingRound)
  const setProcessingRound = useGameStore((state) => state.setProcessingRound)

  const [tradeSymbol, setTradeSymbol] = useState('')
  const [selectedStockDetails, setSelectedStockDetails] = useState<Stock | null>(null)

  const { data: gameState, isLoading } = trpc.game.getGameState.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId, refetchInterval: false }
  )

  const { data: portfolioData } = trpc.game.getPortfolioData.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId && !!gameState, refetchInterval: false }
  )

  const utils = trpc.useUtils()

  // Redirect to leaderboard when game is complete
  useEffect(() => {
    if (gameState?.isComplete) {
      setView('leaderboard')
    }
  }, [gameState?.isComplete, setView])

  const executeTradeMutation = trpc.game.executeTrade.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Trade Successful', {
          description: result.message,
          duration: 3000,
        })
        setTradeSymbol('')

        // Show toasts if any (for dividends/bonus issues)
        if (result.toasts && result.toasts.length > 0) {
          result.toasts.forEach((toastData) => {
            toast.success(toastData.playerName, {
              description: toastData.message,
              duration: 5000,
            })
          })
        }

        // Automatically end turn after successful trade
        endTurnMutation.mutate({ gameId: gameId! })
      } else {
        toast.error('Trade Failed', {
          description: result.message,
          duration: 3000,
        })
      }
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message,
        duration: 3000,
      })
    },
  })

  const endTurnMutation = trpc.game.endTurn.useMutation({
    onSuccess: async (result) => {
      if (result.roundEnded) {
        setProcessingRound(true)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setProcessingRound(false)
      }

      // Refetch game state and portfolio data
      await utils.game.getGameState.invalidate()
      await utils.game.getPortfolioData.invalidate()

      if (result.gameOver) {
        setView('leaderboard')
      }
    },
  })

  // Early return after all hooks
  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading game...</p>
        </div>
      </div>
    )
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  const handleTrade = async (type: 'buy' | 'sell', symbol: string, quantity: number) => {
    executeTradeMutation.mutate({
      gameId: gameId!,
      action: { type, symbol, quantity },
    })
  }

  const handleSkip = async () => {
    executeTradeMutation.mutate({
      gameId: gameId!,
      action: { type: 'skip' },
    })
  }

  const handlePlayCorporateAction = async (
    actionId: string,
    quantity?: number,
    stockSymbol?: string
  ) => {
    executeTradeMutation.mutate({
      gameId: gameId!,
      action: {
        type: 'play_corporate_action',
        corporateActionId: actionId,
        quantity,
        symbol: stockSymbol,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-4">
        {/* Header */}
        <GameHeader gameState={gameState} onViewLeaderboard={() => setView('leaderboard')} />

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
            onPlayCorporateAction={handlePlayCorporateAction}
          />
        </div>

        {/* Portfolio */}
        {portfolioData && (
          <PortfolioTable gameState={gameState} currentPlayer={currentPlayer} portfolio={portfolioData} />
        )}

        {/* All Players */}
        <AllPlayersTable gameState={gameState} currentPlayer={currentPlayer} />
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
