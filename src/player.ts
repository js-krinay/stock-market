import { Player, Stock } from './types'

export class PlayerManager {
  createPlayer(id: string, name: string, startingCash: number = 10000): Player {
    return {
      id,
      name,
      cash: startingCash,
      portfolio: [],
      actionHistory: [],
    }
  }

  buyStock(player: Player, stock: Stock, quantity: number): { success: boolean; message: string } {
    const totalCost = stock.price * quantity

    if (totalCost > player.cash) {
      return { success: false, message: 'Insufficient funds' }
    }

    if (quantity <= 0) {
      return { success: false, message: 'Invalid quantity' }
    }

    const existingHolding = player.portfolio.find((h) => h.symbol === stock.symbol)

    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity
      const totalValue = existingHolding.averageCost * existingHolding.quantity + totalCost
      existingHolding.quantity = totalQuantity
      existingHolding.averageCost = totalValue / totalQuantity
    } else {
      player.portfolio.push({
        symbol: stock.symbol,
        quantity,
        averageCost: stock.price,
      })
    }

    player.cash -= totalCost
    player.cash = Math.round(player.cash * 100) / 100

    return {
      success: true,
      message: `Bought ${quantity} shares of ${stock.symbol} for $${totalCost.toFixed(2)}`,
    }
  }

  sellStock(player: Player, stock: Stock, quantity: number): { success: boolean; message: string } {
    const holding = player.portfolio.find((h) => h.symbol === stock.symbol)

    if (!holding) {
      return { success: false, message: 'You do not own this stock' }
    }

    if (quantity > holding.quantity) {
      return { success: false, message: 'Insufficient shares to sell' }
    }

    if (quantity <= 0) {
      return { success: false, message: 'Invalid quantity' }
    }

    const totalRevenue = stock.price * quantity
    player.cash += totalRevenue
    player.cash = Math.round(player.cash * 100) / 100

    holding.quantity -= quantity

    if (holding.quantity === 0) {
      player.portfolio = player.portfolio.filter((h) => h.symbol !== stock.symbol)
    }

    return {
      success: true,
      message: `Sold ${quantity} shares of ${stock.symbol} for $${totalRevenue.toFixed(2)}`,
    }
  }

  getPortfolioValue(player: Player, stocks: Stock[]): number {
    const stockValue = player.portfolio.reduce((total, holding) => {
      const stock = stocks.find((s) => s.symbol === holding.symbol)
      return total + (stock ? stock.price * holding.quantity : 0)
    }, 0)

    return Math.round((player.cash + stockValue) * 100) / 100
  }

  getPortfolioDetails(
    player: Player,
    stocks: Stock[]
  ): Array<{
    symbol: string
    quantity: number
    averageCost: number
    currentPrice: number
    totalValue: number
    profitLoss: number
    profitLossPercent: number
  }> {
    return player.portfolio.map((holding) => {
      const stock = stocks.find((s) => s.symbol === holding.symbol)
      const currentPrice = stock?.price || 0
      const totalValue = currentPrice * holding.quantity
      const costBasis = holding.averageCost * holding.quantity
      const profitLoss = totalValue - costBasis
      const profitLossPercent = (profitLoss / costBasis) * 100

      return {
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageCost: holding.averageCost,
        currentPrice,
        totalValue: Math.round(totalValue * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      }
    })
  }
}
