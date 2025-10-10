import { PrismaClient } from '@prisma/client'
import type {
  PortfolioData,
  PortfolioHolding,
  TradeValidation,
  CorporateActionPreview,
  DividendDetails,
  RightIssueDetails,
  BonusIssueDetails,
} from '../types'

export class UIDataService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get calculated portfolio data for current player
   */
  async getPortfolioData(gameId: string): Promise<PortfolioData> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            portfolio: true,
          },
        },
        stocks: true,
      },
    })

    if (!game) throw new Error('Game not found')

    const currentPlayer = game.players[game.currentPlayerIndex]

    const holdings: PortfolioHolding[] = currentPlayer.portfolio.map((holding) => {
      const stock = game.stocks.find((s) => s.symbol === holding.symbol)
      const currentPrice = stock?.price || 0
      const totalValue = currentPrice * holding.quantity
      const costBasis = holding.averageCost * holding.quantity
      const profitLoss = totalValue - costBasis
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0

      return {
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageCost: holding.averageCost,
        currentPrice: Math.round(currentPrice * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      }
    })

    const portfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0)

    return {
      cash: currentPlayer.cash,
      holdings,
      totalValue: currentPlayer.cash + portfolioValue,
    }
  }

  /**
   * Validate a trade and return max quantity allowed
   */
  async validateTrade(
    gameId: string,
    type: 'buy' | 'sell',
    symbol: string,
    quantity?: number
  ): Promise<TradeValidation> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            portfolio: true,
          },
        },
        stocks: true,
      },
    })

    if (!game) throw new Error('Game not found')

    const currentPlayer = game.players[game.currentPlayerIndex]
    const stock = game.stocks.find((s) => s.symbol === symbol)

    if (!stock) {
      return {
        isValid: false,
        error: 'Stock not found',
        maxQuantity: 0,
      }
    }

    let maxQuantity = 0

    if (type === 'buy') {
      const maxByCash = Math.floor(currentPlayer.cash / stock.price)
      const maxByMarket = stock.availableQuantity
      maxQuantity = Math.min(maxByCash, maxByMarket)

      if (quantity) {
        const totalCost = stock.price * quantity
        if (totalCost > currentPlayer.cash) {
          return {
            isValid: false,
            error: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${currentPlayer.cash.toFixed(2)}`,
            maxQuantity,
          }
        }
        if (quantity > stock.availableQuantity) {
          return {
            isValid: false,
            error: `Only ${stock.availableQuantity} shares available`,
            maxQuantity,
          }
        }
      }
    } else if (type === 'sell') {
      const holding = currentPlayer.portfolio.find((h) => h.symbol === symbol)
      maxQuantity = holding?.quantity || 0

      if (quantity && (!holding || holding.quantity < quantity)) {
        return {
          isValid: false,
          error: `You only own ${holding?.quantity || 0} shares`,
          maxQuantity,
        }
      }
    }

    if (quantity && quantity <= 0) {
      return {
        isValid: false,
        error: 'Quantity must be greater than 0',
        maxQuantity,
      }
    }

    return {
      isValid: true,
      error: null,
      maxQuantity,
    }
  }

  /**
   * Get preview for corporate action
   */
  async getCorporateActionPreview(
    gameId: string,
    corporateActionId: string,
    stockSymbol: string,
    quantity?: number
  ): Promise<CorporateActionPreview> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            portfolio: true,
            corporateActions: true,
          },
        },
        stocks: true,
      },
    })

    if (!game) throw new Error('Game not found')

    const currentPlayer = game.players[game.currentPlayerIndex]
    const corporateAction = currentPlayer.corporateActions.find((ca) => ca.actionId === corporateActionId)

    if (!corporateAction) {
      return {
        isValid: false,
        error: 'Corporate action not found',
        preview: null,
      }
    }

    const stock = game.stocks.find((s) => s.symbol === stockSymbol)
    if (!stock) {
      return {
        isValid: false,
        error: 'Stock not found',
        preview: null,
      }
    }

    const holding = currentPlayer.portfolio.find((h) => h.symbol === stockSymbol)
    const details = JSON.parse(corporateAction.details)

    if (corporateAction.type === 'dividend') {
      const dividendDetails = details as DividendDetails
      const dividendPerShare = stock.price * dividendDetails.dividendPercentage
      const totalDividend = holding ? holding.quantity * dividendPerShare : 0
      const dividendPercent = dividendDetails.dividendPercentage * 100

      return {
        isValid: true,
        error: null,
        preview: {
          type: 'dividend',
          stockPrice: stock.price,
          dividendPerShare,
          totalDividend,
          dividendPercent,
          currentHoldings: holding?.quantity || 0,
        },
      }
    }

    if (corporateAction.type === 'right_issue') {
      const rightIssueDetails = details as RightIssueDetails
      const pricePerShare = stock.price * rightIssueDetails.discountPercentage
      const discountPercent = (1 - rightIssueDetails.discountPercentage) * 100

      const maxByHoldings = holding
        ? Math.floor(holding.quantity / rightIssueDetails.baseShares) * rightIssueDetails.ratio
        : 0
      const maxByMarket = stock.availableQuantity
      const maxByCash = pricePerShare > 0 ? Math.floor(currentPlayer.cash / pricePerShare) : 0
      const maxAllowed = Math.min(maxByHoldings, maxByMarket, maxByCash)

      let error = null
      if (quantity && quantity > maxAllowed) {
        error = `Maximum allowed is ${maxAllowed} shares`
      } else if (quantity && quantity <= 0) {
        error = 'Quantity must be greater than 0'
      }

      return {
        isValid: !error,
        error,
        preview: {
          type: 'right_issue',
          stockPrice: stock.price,
          pricePerShare,
          discountPercent,
          maxByHoldings,
          maxByMarket,
          maxByCash,
          maxAllowed,
          currentHoldings: holding?.quantity || 0,
          ratio: rightIssueDetails.ratio,
          baseShares: rightIssueDetails.baseShares,
        },
      }
    }

    if (corporateAction.type === 'bonus_issue') {
      const bonusDetails = details as BonusIssueDetails
      const bonusShares = holding
        ? Math.floor(holding.quantity / bonusDetails.baseShares) * bonusDetails.ratio
        : 0
      const newTotalShares = (holding?.quantity || 0) + bonusShares

      return {
        isValid: true,
        error: null,
        preview: {
          type: 'bonus_issue',
          stockPrice: stock.price,
          bonusShares,
          newTotalShares,
          currentHoldings: holding?.quantity || 0,
          ratio: bonusDetails.ratio,
          baseShares: bonusDetails.baseShares,
        },
      }
    }

    return {
      isValid: false,
      error: 'Unknown corporate action type',
      preview: null,
    }
  }
}
