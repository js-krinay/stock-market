import { PrismaClient } from '@prisma/client'
import type { TradeAction } from '../types'
import { mapDbActionToAppAction } from './mappers'
import {
  validateBuyTrade,
  validateSellTrade,
  calculateBuyPortfolioUpdate,
  calculateSellPortfolioUpdate,
  calculateSaleProfit,
} from '../utils/trading'
import { Errors } from '../errors'
import { ITradeService, TradeResult } from '../interfaces/ITradeService'

export class TradeExecutor implements ITradeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Execute a trade action
   */
  async executeTrade(
    gameId: string,
    action: TradeAction,
    onLeadershipUpdate: () => Promise<void>
  ): Promise<TradeResult> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: { portfolio: true },
        },
        stocks: true,
      },
    })

    if (!game) throw Errors.gameNotFound(gameId)

    const currentPlayer = game.players[game.currentPlayerIndex]

    if (action.type === 'skip') {
      return await this.handleSkip(game.currentRound, game.currentTurnInRound, currentPlayer.id)
    }

    if (action.type === 'play_corporate_action') {
      return await this.handleCorporateAction(game, action, currentPlayer, onLeadershipUpdate)
    }

    // Buy/Sell logic
    if (!action.symbol || !action.quantity) {
      return { success: false, message: 'Invalid trade action' }
    }

    const stock = game.stocks.find((s) => s.symbol === action.symbol)
    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }

    if (stock.price <= 0) {
      return { success: false, message: 'Stock cannot be traded at $0' }
    }

    if (action.type === 'buy') {
      return await this.handleBuy(game, currentPlayer, stock, action.quantity, onLeadershipUpdate)
    } else if (action.type === 'sell') {
      return await this.handleSell(game, currentPlayer, stock, action.quantity, onLeadershipUpdate)
    }

    return { success: false, message: 'Invalid trade action type' }
  }

  private async handleSkip(round: number, turn: number, playerId: string) {
    await this.prisma.turnAction.create({
      data: {
        round,
        turn,
        actionType: 'skip',
        result: 'Turn skipped',
        playerId,
      },
    })
    return { success: true, message: 'Turn skipped' }
  }

  private async handleBuy(
    game: any,
    currentPlayer: any,
    stock: any,
    quantity: number,
    onLeadershipUpdate: () => Promise<void>
  ) {
    // Validate trade using pure function
    const validation = validateBuyTrade(
      quantity,
      stock.price,
      stock.availableQuantity,
      currentPlayer.cash
    )
    if (!validation.isValid) {
      return { success: false, message: validation.error! }
    }

    const totalCost = stock.price * quantity

    // Update stock availability
    await this.prisma.stock.update({
      where: { id: stock.id },
      data: { availableQuantity: stock.availableQuantity - quantity },
    })

    // Update or create portfolio holding
    const existingHolding = currentPlayer.portfolio.find((h: any) => h.symbol === stock.symbol)

    if (existingHolding) {
      // Use pure function to calculate new portfolio state
      const { newQuantity, newAverageCost } = calculateBuyPortfolioUpdate(
        existingHolding.quantity,
        existingHolding.averageCost,
        quantity,
        stock.price
      )

      await this.prisma.stockHolding.update({
        where: { id: existingHolding.id },
        data: {
          quantity: newQuantity,
          averageCost: Math.round(newAverageCost * 100) / 100,
        },
      })
    } else {
      await this.prisma.stockHolding.create({
        data: {
          symbol: stock.symbol,
          quantity: quantity,
          averageCost: stock.price,
          playerId: currentPlayer.id,
          stockId: stock.id,
        },
      })
    }

    // Update player cash
    await this.prisma.player.update({
      where: { id: currentPlayer.id },
      data: { cash: Math.round((currentPlayer.cash - totalCost) * 100) / 100 },
    })

    // Log action
    await this.prisma.turnAction.create({
      data: {
        round: game.currentRound,
        turn: game.currentTurnInRound,
        actionType: 'buy',
        symbol: stock.symbol,
        quantity: quantity,
        price: stock.price,
        totalValue: totalCost,
        result: `Bought ${quantity} shares of ${stock.symbol} for $${totalCost.toFixed(2)}`,
        playerId: currentPlayer.id,
      },
    })

    await onLeadershipUpdate()

    return {
      success: true,
      message: `Bought ${quantity} shares of ${stock.symbol} for $${totalCost.toFixed(2)}`,
    }
  }

  private async handleSell(
    game: any,
    currentPlayer: any,
    stock: any,
    quantity: number,
    onLeadershipUpdate: () => Promise<void>
  ) {
    const holding = currentPlayer.portfolio.find((h: any) => h.symbol === stock.symbol)
    const playerHolding = holding?.quantity || 0

    // Validate trade using pure function
    const validation = validateSellTrade(quantity, stock.price, playerHolding)
    if (!validation.isValid) {
      return { success: false, message: validation.error! }
    }

    const totalRevenue = stock.price * quantity

    // Calculate profit using pure function
    const profit = calculateSaleProfit(quantity, stock.price, holding.averageCost)

    // Update portfolio
    if (quantity === holding.quantity) {
      await this.prisma.stockHolding.delete({
        where: { id: holding.id },
      })
    } else {
      // Use pure function to calculate new portfolio state
      const { newQuantity } = calculateSellPortfolioUpdate(
        holding.quantity,
        holding.averageCost,
        quantity
      )

      await this.prisma.stockHolding.update({
        where: { id: holding.id },
        data: { quantity: newQuantity },
      })
    }

    // Update stock availability
    await this.prisma.stock.update({
      where: { id: stock.id },
      data: { availableQuantity: stock.availableQuantity + quantity },
    })

    // Update player cash
    await this.prisma.player.update({
      where: { id: currentPlayer.id },
      data: { cash: Math.round((currentPlayer.cash + totalRevenue) * 100) / 100 },
    })

    // Log action with profit/loss
    const profitText =
      profit > 0
        ? `(+$${profit.toFixed(2)} profit)`
        : profit < 0
          ? `($${Math.abs(profit).toFixed(2)} loss)`
          : '(breakeven)'

    await this.prisma.turnAction.create({
      data: {
        round: game.currentRound,
        turn: game.currentTurnInRound,
        actionType: 'sell',
        symbol: stock.symbol,
        quantity: quantity,
        price: stock.price,
        totalValue: totalRevenue,
        result: `Sold ${quantity} shares of ${stock.symbol} for $${totalRevenue.toFixed(2)} ${profitText}`,
        playerId: currentPlayer.id,
      },
    })

    await onLeadershipUpdate()

    return {
      success: true,
      message: `Sold ${quantity} shares of ${stock.symbol} for $${totalRevenue.toFixed(2)} ${profitText}`,
    }
  }

  private async handleCorporateAction(
    game: any,
    action: TradeAction,
    currentPlayer: any,
    onLeadershipUpdate: () => Promise<void>
  ) {
    if (!action.corporateActionId) {
      return { success: false, message: 'Corporate action ID required' }
    }
    if (!action.symbol) {
      return { success: false, message: 'Stock symbol required for corporate action' }
    }

    // Find the corporate action
    const corporateActionDb = await this.prisma.corporateAction.findFirst({
      where: { actionId: action.corporateActionId, gameId: game.id },
    })

    if (!corporateActionDb || corporateActionDb.played) {
      return { success: false, message: 'Corporate action not found or already played' }
    }

    const stock = game.stocks.find((s: any) => s.symbol === action.symbol)
    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }

    // For rights issue: snapshot eligible players and set expiry tracking
    if (corporateActionDb.type === 'right_issue') {
      // Find all players who own the stock
      const eligiblePlayerIds: string[] = []
      for (const player of game.players) {
        const holding = player.portfolio.find((h: any) => h.symbol === action.symbol)
        if (holding && holding.quantity > 0) {
          eligiblePlayerIds.push(player.id)
        }
      }

      // Update corporate action with eligibility snapshot and expiry tracking
      // Will expire when this player's turn comes again (checked in gameService.endTurn)
      await this.prisma.corporateAction.update({
        where: { id: corporateActionDb.id },
        data: {
          symbol: action.symbol,
          played: true,
          status: 'active',
          expiresAtPlayerId: currentPlayer.id,
          eligiblePlayerIds: JSON.stringify(eligiblePlayerIds),
        },
      })

      // Reload the updated corporate action
      const updatedCorporateActionDb = await this.prisma.corporateAction.findUnique({
        where: { id: corporateActionDb.id },
      })
      if (!updatedCorporateActionDb) {
        return { success: false, message: 'Failed to update corporate action' }
      }

      const corporateAction = mapDbActionToAppAction(updatedCorporateActionDb)

      // Player who plays it executes it immediately for themselves
      return await this.handleRightIssue(
        game,
        action,
        currentPlayer,
        stock,
        corporateAction,
        onLeadershipUpdate
      )
    } else {
      // For dividend and bonus issue, just update and process
      await this.prisma.corporateAction.update({
        where: { id: corporateActionDb.id },
        data: { symbol: action.symbol, played: true },
      })

      const corporateAction = mapDbActionToAppAction({
        ...corporateActionDb,
        symbol: action.symbol,
      })

      if (corporateAction.type === 'dividend') {
        return await this.handleDividend(game, action, stock, currentPlayer)
      } else if (corporateAction.type === 'bonus_issue') {
        return await this.handleBonusIssue(game, action, stock, corporateAction, onLeadershipUpdate)
      }
    }

    return { success: false, message: 'Unknown corporate action type' }
  }

  private async handleRightIssue(
    game: any,
    action: TradeAction,
    currentPlayer: any,
    stock: any,
    corporateAction: any,
    onLeadershipUpdate: () => Promise<void>
  ) {
    if (!action.quantity) {
      return { success: false, message: 'Quantity required for right issue' }
    }

    const details = corporateAction.details as any
    const holding = currentPlayer.portfolio.find((h: any) => h.symbol === action.symbol)

    if (!holding) {
      return { success: false, message: `No ${stock.name} holdings - not eligible` }
    }

    const eligibleShares = Math.floor(holding.quantity / details.baseShares) * details.ratio

    if (action.quantity > eligibleShares) {
      return {
        success: false,
        message: `Can only buy up to ${eligibleShares} ${stock.name} shares`,
      }
    }

    // Calculate right issue price using discount from corporate action details
    const discountPercentage = details.discountPercentage
    if (!discountPercentage) {
      throw Errors.internal('Right issue discount percentage not found in corporate action details')
    }
    const rightIssuePrice = stock.price * discountPercentage
    const totalCost = action.quantity * rightIssuePrice

    if (totalCost > currentPlayer.cash) {
      return { success: false, message: 'Insufficient funds' }
    }

    // Update portfolio
    const newQuantity = holding.quantity + action.quantity
    const newAverageCost = (holding.averageCost * holding.quantity + totalCost) / newQuantity

    await this.prisma.stockHolding.update({
      where: { id: holding.id },
      data: {
        quantity: newQuantity,
        averageCost: Math.round(newAverageCost * 100) / 100,
      },
    })

    // Update player cash
    await this.prisma.player.update({
      where: { id: currentPlayer.id },
      data: { cash: Math.round((currentPlayer.cash - totalCost) * 100) / 100 },
    })

    // Log action
    const discountPercent = ((1 - discountPercentage) * 100).toFixed(0)
    await this.prisma.turnAction.create({
      data: {
        round: game.currentRound,
        turn: game.currentTurnInRound,
        actionType: 'right_issue_purchased',
        symbol: action.symbol,
        quantity: action.quantity,
        totalValue: totalCost,
        corporateActionId: action.corporateActionId,
        result: `Right issue purchased - Bought ${action.quantity} ${stock.name} shares at $${rightIssuePrice.toFixed(2)} (${details.ratio}:${details.baseShares} ratio, ${discountPercent}% discount)`,
        playerId: currentPlayer.id,
      },
    })

    await onLeadershipUpdate()

    return {
      success: true,
      message: `Purchased ${action.quantity} ${stock.name} shares at $${rightIssuePrice.toFixed(2)} for $${totalCost.toFixed(2)}`,
    }
  }

  private async handleDividend(game: any, action: TradeAction, stock: any, currentPlayer: any) {
    const toasts: Array<{ playerName: string; message: string }> = []

    // Prepare shareholders data for business logic
    const shareholders = game.players
      .map((player: any) => {
        const holding = player.portfolio.find((h: any) => h.symbol === action.symbol)
        if (holding && holding.quantity > 0) {
          return {
            playerId: player.id,
            playerName: player.name,
            quantity: holding.quantity,
            averageCost: holding.averageCost,
          }
        }
        return null
      })
      .filter((s: any) => s !== null)

    // Use business logic to calculate dividends
    const { calculateDividendDistribution } = await import('../utils/corporateActions')
    const distributions = calculateDividendDistribution(stock.price, shareholders, action.symbol!)

    // Apply distributions to database
    for (const distribution of distributions) {
      const player = game.players.find((p: any) => p.id === distribution.playerId)

      await this.prisma.player.update({
        where: { id: distribution.playerId },
        data: { cash: Math.round((player.cash + distribution.dividendAmount) * 100) / 100 },
      })

      toasts.push({
        playerName: distribution.playerName,
        message: `Received ${stock.name} dividend: $${distribution.dividendAmount.toFixed(2)}`,
      })

      await this.prisma.turnAction.create({
        data: {
          round: game.currentRound,
          turn: game.currentTurnInRound,
          actionType: 'dividend_received',
          symbol: action.symbol,
          quantity: distribution.quantity,
          totalValue: distribution.dividendAmount,
          result: `Received dividend: $${distribution.dividendAmount.toFixed(2)}`,
          playerId: distribution.playerId,
        },
      })
    }

    // Log the main action
    const totalDividends = distributions.reduce((sum, d) => sum + d.dividendAmount, 0)
    await this.prisma.turnAction.create({
      data: {
        round: game.currentRound,
        turn: game.currentTurnInRound,
        actionType: 'dividend_declared',
        symbol: action.symbol,
        totalValue: totalDividends,
        corporateActionId: action.corporateActionId,
        result: `Dividend declared for ${stock.name} - Paid $${totalDividends.toFixed(2)} to ${distributions.length} shareholders (5% per share)`,
        playerId: currentPlayer.id,
      },
    })

    return {
      success: true,
      message: `Dividend declared for ${stock.name}. Paid to ${toasts.length} shareholders.`,
      toasts,
    }
  }

  private async handleBonusIssue(
    game: any,
    action: TradeAction,
    stock: any,
    corporateAction: any,
    onLeadershipUpdate: () => Promise<void>
  ) {
    const toasts: Array<{ playerName: string; message: string }> = []
    const details = corporateAction.details as any

    // Prepare shareholders data for business logic
    const shareholders = game.players
      .map((player: any) => {
        const holding = player.portfolio.find((h: any) => h.symbol === action.symbol)
        if (holding && holding.quantity > 0) {
          return {
            playerId: player.id,
            playerName: player.name,
            quantity: holding.quantity,
            averageCost: holding.averageCost,
            holdingId: holding.id, // Keep for database update
          }
        }
        return null
      })
      .filter((s: any) => s !== null)

    // Use business logic to calculate bonus shares
    const { calculateBonusIssueDistribution } = await import('../utils/corporateActions')
    const { MAX_STOCK_QUANTITY } = await import('../constants')
    const result = calculateBonusIssueDistribution(
      shareholders,
      action.symbol!,
      details,
      MAX_STOCK_QUANTITY
    )

    // Apply distributions to database (scaled down if necessary)
    for (const distribution of result.distributions) {
      const shareholder = shareholders.find((s: any) => s.playerId === distribution.playerId)

      await this.prisma.stockHolding.update({
        where: { id: shareholder.holdingId },
        data: {
          quantity: distribution.newQuantity,
          averageCost: distribution.newAverageCost,
        },
      })

      toasts.push({
        playerName: distribution.playerName,
        message: `Received ${distribution.bonusShares} bonus ${stock.name} shares`,
      })

      await this.prisma.turnAction.create({
        data: {
          round: game.currentRound,
          turn: game.currentTurnInRound,
          actionType: 'bonus_received',
          symbol: action.symbol,
          quantity: distribution.bonusShares,
          result: `Received ${distribution.bonusShares} bonus shares`,
          playerId: distribution.playerId,
        },
      })
    }

    // Log the main action
    const bonusType = result.wouldExceedLimit ? 'Partial bonus issue' : 'Bonus issue'
    const limitNote = result.wouldExceedLimit ? ` (scaled to ${result.maxStockQuantity} limit)` : ''

    await this.prisma.turnAction.create({
      data: {
        round: game.currentRound,
        turn: game.currentTurnInRound,
        actionType: 'bonus_issue_declared',
        symbol: action.symbol,
        quantity: result.totalBonusShares,
        corporateActionId: action.corporateActionId,
        result: `${bonusType} declared for ${stock.name} - Issued ${result.totalBonusShares} shares to ${result.distributions.length} shareholders (${details.ratio}:${details.baseShares} ratio)${limitNote}`,
        playerId: game.players[game.currentPlayerIndex].id,
      },
    })

    await onLeadershipUpdate()

    const successMessage = result.wouldExceedLimit
      ? `Partial bonus issue declared for ${stock.name} (scaled to fit ${result.maxStockQuantity} limit). Issued to ${toasts.length} shareholders.`
      : `Bonus issue declared for ${stock.name}. Issued to ${toasts.length} shareholders.`

    return {
      success: true,
      message: successMessage,
      toasts,
    }
  }
}
