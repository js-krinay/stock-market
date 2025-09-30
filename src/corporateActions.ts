import {
  CorporateAction,
  DividendDetails,
  RightIssueDetails,
  BonusIssueDetails,
  Player,
  Stock,
} from './types'

export class CorporateActionManager {
  processDividend(
    action: CorporateAction,
    player: Player,
    stock: Stock
  ): { amount: number; message: string } {
    const details = action.details as DividendDetails
    const holding = player.portfolio.find((h) => h.symbol === action.symbol)

    if (!holding) {
      return { amount: 0, message: 'No holdings to receive dividend' }
    }

    const dividendAmount = holding.quantity * details.amountPerShare
    player.cash += dividendAmount
    player.cash = Math.round(player.cash * 100) / 100

    return {
      amount: dividendAmount,
      message: `Received dividend: ${holding.quantity} shares × $${details.amountPerShare} = $${dividendAmount.toFixed(2)}`,
    }
  }

  processRightIssue(
    action: CorporateAction,
    player: Player,
    stock: Stock
  ): {
    eligibleShares: number
    offerPrice: number
    message: string
  } {
    const details = action.details as RightIssueDetails
    const holding = player.portfolio.find((h) => h.symbol === action.symbol)

    if (!holding) {
      return {
        eligibleShares: 0,
        offerPrice: details.price,
        message: 'No holdings - not eligible for right issue',
      }
    }

    // Calculate how many new shares can be purchased
    // e.g., 1:5 means 1 new share for every 5 existing shares
    const eligibleShares = Math.floor(holding.quantity / details.baseShares) * details.ratio

    if (eligibleShares === 0) {
      return {
        eligibleShares: 0,
        offerPrice: details.price,
        message: `Insufficient shares for right issue (need ${details.baseShares} shares)`,
      }
    }

    return {
      eligibleShares,
      offerPrice: details.price,
      message: `Eligible for ${eligibleShares} shares at $${details.price.toFixed(2)} each (${details.ratio}:${details.baseShares} ratio)`,
    }
  }

  acceptRightIssue(
    action: CorporateAction,
    player: Player,
    stock: Stock,
    sharesToBuy: number
  ): { success: boolean; message: string } {
    const details = action.details as RightIssueDetails
    const holding = player.portfolio.find((h) => h.symbol === action.symbol)

    if (!holding) {
      return { success: false, message: 'No holdings - not eligible' }
    }

    const eligibleShares = Math.floor(holding.quantity / details.baseShares) * details.ratio

    if (sharesToBuy > eligibleShares) {
      return { success: false, message: `Can only buy up to ${eligibleShares} shares` }
    }

    if (sharesToBuy <= 0) {
      return { success: false, message: 'Invalid quantity' }
    }

    const totalCost = sharesToBuy * details.price

    if (totalCost > player.cash) {
      return { success: false, message: 'Insufficient funds' }
    }

    // Add shares to portfolio
    const totalQuantity = holding.quantity + sharesToBuy
    const totalValue = holding.averageCost * holding.quantity + totalCost
    holding.quantity = totalQuantity
    holding.averageCost = totalValue / totalQuantity

    player.cash -= totalCost
    player.cash = Math.round(player.cash * 100) / 100

    return {
      success: true,
      message: `Purchased ${sharesToBuy} shares at $${details.price.toFixed(2)} for $${totalCost.toFixed(2)}`,
    }
  }

  processBonusIssue(
    action: CorporateAction,
    player: Player,
    stock: Stock
  ): { bonusShares: number; message: string } {
    const details = action.details as BonusIssueDetails
    const holding = player.portfolio.find((h) => h.symbol === action.symbol)

    if (!holding) {
      return {
        bonusShares: 0,
        message: 'No holdings - not eligible for bonus issue',
      }
    }

    // Calculate bonus shares
    // e.g., 1:10 means 1 bonus share for every 10 existing shares
    const bonusShares = Math.floor(holding.quantity / details.baseShares) * details.ratio

    if (bonusShares === 0) {
      return {
        bonusShares: 0,
        message: `Insufficient shares for bonus issue (need ${details.baseShares} shares)`,
      }
    }

    // Add bonus shares - average cost is adjusted down
    const oldQuantity = holding.quantity
    const newQuantity = oldQuantity + bonusShares
    const totalCost = holding.averageCost * oldQuantity
    holding.quantity = newQuantity
    holding.averageCost = totalCost / newQuantity

    return {
      bonusShares,
      message: `Received ${bonusShares} bonus shares (${details.ratio}:${details.baseShares} ratio). New holding: ${newQuantity} shares`,
    }
  }

  generateCorporateAction(
    stocks: Stock[],
    currentRound: number,
    currentTurn: number
  ): CorporateAction | null {
    // 30% chance of a corporate action
    if (Math.random() > 0.3) {
      return null
    }

    const actionTypes: ('dividend' | 'right_issue' | 'bonus_issue')[] = [
      'dividend',
      'right_issue',
      'bonus_issue',
    ]
    const type = actionTypes[Math.floor(Math.random() * actionTypes.length)]
    const stock = stocks[Math.floor(Math.random() * stocks.length)]

    const id = `${type}-${stock.symbol}-${currentRound}-${currentTurn}`

    switch (type) {
      case 'dividend':
        return {
          id,
          type: 'dividend',
          symbol: stock.symbol,
          title: `${stock.name} Declares Dividend`,
          description: `${stock.name} announces dividend payout to shareholders`,
          details: {
            amountPerShare: Math.round(stock.price * (0.02 + Math.random() * 0.05) * 100) / 100, // 2-7% of stock price
          } as DividendDetails,
          round: currentRound,
          createdAtTurn: currentTurn,
          playersProcessed: [],
        }

      case 'right_issue':
        // Fixed ratio: 1 for every 2 shares
        return {
          id,
          type: 'right_issue',
          symbol: stock.symbol,
          title: `${stock.name} Announces Right Issue`,
          description: `${stock.name} offers new shares to existing shareholders at discounted price (1:2 ratio)`,
          details: {
            ratio: 1,
            baseShares: 2,
            price: Math.round(stock.price * (0.7 + Math.random() * 0.2) * 100) / 100, // 70-90% of market price
          } as RightIssueDetails,
          round: currentRound,
          createdAtTurn: currentTurn,
          playersProcessed: [],
        }

      case 'bonus_issue':
        // Fixed ratio: 1 for every 5 shares
        return {
          id,
          type: 'bonus_issue',
          symbol: stock.symbol,
          title: `${stock.name} Announces Bonus Issue`,
          description: `${stock.name} issues bonus shares to existing shareholders (1:5 ratio)`,
          details: {
            ratio: 1,
            baseShares: 5,
          } as BonusIssueDetails,
          round: currentRound,
          createdAtTurn: currentTurn,
          playersProcessed: [],
        }
    }
  }
}
