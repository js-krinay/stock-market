import { PrismaClient } from '@prisma/client'

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export class RoundProcessor {
  constructor(private prisma: PrismaClient) {}

  /**
   * Process end of round
   */
  async processEndOfRound(
    gameId: string,
    onCardsGenerated: (gameId: string) => Promise<void>
  ): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) throw new Error('Game not found')

    // Process all events: accumulate, apply impacts, add history, and cleanup
    await this.processRoundEvents(gameId, game.currentRound)

    // Expire all active rights issues at round end
    await this.prisma.corporateAction.updateMany({
      where: {
        gameId,
        type: 'right_issue',
        status: 'active',
      },
      data: { status: 'expired' },
    })

    // Move to next round
    const nextRound = game.currentRound + 1
    const gameOver = nextRound > game.maxRounds

    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        currentRound: gameOver ? game.currentRound : nextRound,
        currentTurnInRound: 1,
        currentPlayerIndex: 0,
        isComplete: gameOver,
      },
    })

    if (!gameOver) {
      // Reset all player turn indices
      await this.prisma.player.updateMany({
        where: { gameId },
        data: { currentTurnIndex: 0 },
      })

      // Generate cards for next round
      await onCardsGenerated(gameId)
    }
  }

  /**
   * Process all round events in a single transaction
   */
  private async processRoundEvents(gameId: string, currentRound: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Step 1: Load game with stocks
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: { stocks: true },
      })

      if (!game) throw new Error('Game not found')

      // Step 2: Load all event cards for the current round
      const eventCards = await tx.gameCard.findMany({
        where: { gameId, round: currentRound, type: 'event' },
        include: { event: true },
      })

      if (eventCards.length === 0) return

      // Step 3: Store pre-round prices for calculating percentage impacts
      const preRoundPrices: { [symbol: string]: number } = {}
      game.stocks.forEach((stock) => {
        preRoundPrices[stock.symbol] = stock.price
      })

      // Step 4: Separate events (stock vs cash)
      const stockEvents: any[] = []
      let netCashImpact = 0

      for (const card of eventCards) {
        if (!card.event) continue

        if (card.event.type === 'inflation' || card.event.type === 'deflation') {
          netCashImpact += card.event.impact
        } else {
          stockEvents.push(card.event)
        }
      }

      // Step 5: Process stock price impacts
      await this.processStockImpactsInTransaction(tx, game, stockEvents, preRoundPrices)

      // Step 6: Process cash impacts
      await this.processCashImpactsInTransaction(
        tx,
        gameId,
        netCashImpact,
        game.currentRound,
        game.currentTurnInRound
      )

      // Step 7: Add price history for all stocks
      const updatedStocks = await tx.stock.findMany({
        where: { gameId },
      })

      for (const stock of updatedStocks) {
        await tx.priceHistory.create({
          data: {
            round: currentRound,
            price: Math.round(stock.price * 100) / 100,
            stockId: stock.id,
          },
        })
      }
    })
  }

  /**
   * Calculate stock price impacts within transaction
   */
  private async processStockImpactsInTransaction(
    tx: TransactionClient,
    game: any,
    events: any[],
    preRoundPrices: { [symbol: string]: number }
  ): Promise<void> {
    if (events.length === 0) return

    // Group events by stock to calculate total impact per stock
    const stockImpacts: { [stockId: string]: number } = {}

    for (const event of events) {
      const affectedStocks = JSON.parse(event.affectedStocks)

      for (const stock of game.stocks) {
        if (affectedStocks.includes(stock.symbol)) {
          stockImpacts[stock.id] = (stockImpacts[stock.id] || 0) + event.impact
        }
      }
    }

    // Apply accumulated impacts to each stock
    for (const [stockId, totalImpact] of Object.entries(stockImpacts)) {
      const stock = game.stocks.find((s: any) => s.id === stockId)
      if (stock) {
        const newPrice = Math.round(Math.max(0, stock.price + totalImpact) * 100) / 100
        await tx.stock.update({
          where: { id: stockId },
          data: { price: newPrice },
        })
      }
    }

    // Update each event with its priceDiff and actualImpact
    const updatedStocks = await tx.stock.findMany({
      where: { gameId: game.id },
    })

    for (const event of events) {
      const affectedStocks = JSON.parse(event.affectedStocks)
      const priceDiff: { [symbol: string]: number } = {}
      const actualImpact: { [symbol: string]: number } = {}

      updatedStocks.forEach((stock: any) => {
        if (affectedStocks.includes(stock.symbol)) {
          priceDiff[stock.symbol] = event.impact
          const percentChange = (event.impact / preRoundPrices[stock.symbol]) * 100
          actualImpact[stock.symbol] = Math.round(percentChange * 100) / 100
        } else {
          priceDiff[stock.symbol] = 0
          actualImpact[stock.symbol] = 0
        }
      })

      await tx.marketEvent.update({
        where: { id: event.id },
        data: {
          priceDiff: JSON.stringify(priceDiff),
          actualImpact: JSON.stringify(actualImpact),
        },
      })
    }
  }

  /**
   * Calculate and apply cash impacts within transaction
   */
  private async processCashImpactsInTransaction(
    tx: TransactionClient,
    gameId: string,
    netCashImpact: number,
    currentRound: number,
    currentTurn: number
  ): Promise<void> {
    if (netCashImpact === 0) return

    const players = await tx.player.findMany({
      where: { gameId },
    })

    for (const player of players) {
      const cashChange = player.cash * (netCashImpact / 100)
      const newCash = Math.max(0, player.cash + cashChange)

      await tx.player.update({
        where: { id: player.id },
        data: { cash: Math.round(newCash * 100) / 100 },
      })

      // Log the cash change
      const actionType = netCashImpact > 0 ? 'deflation_gain' : 'inflation_loss'
      const description =
        netCashImpact > 0
          ? `Deflation: +${Math.abs(netCashImpact)}% purchasing power (+$${Math.abs(cashChange).toFixed(2)})`
          : `Inflation: -${Math.abs(netCashImpact)}% purchasing power (-$${Math.abs(cashChange).toFixed(2)})`

      await tx.turnAction.create({
        data: {
          round: currentRound,
          turn: currentTurn,
          actionType,
          result: description,
          totalValue: Math.round(cashChange * 100) / 100,
          playerId: player.id,
        },
      })
    }
  }
}
