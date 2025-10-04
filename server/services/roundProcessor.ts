import { PrismaClient } from '@prisma/client'
import {
  applyMultiplePriceImpacts,
  applyCashImpact,
  calculatePriceChangePercentage,
} from '../utils/pricing'

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

      // Step 2: Load all events for the current round
      const events = await tx.marketEvent.findMany({
        where: { gameId, round: currentRound },
      })

      if (events.length === 0) return

      // Step 3: Store pre-round prices for calculating percentage impacts
      const preRoundPrices: { [symbol: string]: number } = {}
      game.stocks.forEach((stock) => {
        preRoundPrices[stock.symbol] = stock.price
      })

      // Step 4: Separate events (stock vs cash)
      const stockEvents: any[] = []
      let netCashImpact = 0

      for (const event of events) {
        if (event.type === 'inflation' || event.type === 'deflation') {
          netCashImpact += event.impact
        } else {
          stockEvents.push(event)
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
    const stockImpacts: { [stockId: string]: number[] } = {}

    for (const event of events) {
      const affectedStocks = JSON.parse(event.affectedStocks)

      for (const stock of game.stocks) {
        if (affectedStocks.includes(stock.symbol)) {
          if (!stockImpacts[stock.id]) {
            stockImpacts[stock.id] = []
          }
          stockImpacts[stock.id].push(event.impact)
        }
      }
    }

    // Apply accumulated impacts to each stock using pure function
    for (const [stockId, impacts] of Object.entries(stockImpacts)) {
      const stock = game.stocks.find((s: any) => s.id === stockId)
      if (stock) {
        const priceImpact = applyMultiplePriceImpacts(stock.price, impacts)
        await tx.stock.update({
          where: { id: stockId },
          data: { price: priceImpact.newPrice },
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
          actualImpact[stock.symbol] = calculatePriceChangePercentage(
            preRoundPrices[stock.symbol],
            stock.price
          )
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
      const newCash = applyCashImpact(player.cash, netCashImpact)
      const cashChange = newCash - player.cash

      await tx.player.update({
        where: { id: player.id },
        data: { cash: newCash },
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
