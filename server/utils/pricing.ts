/**
 * Pure functions for stock price calculations
 * No I/O, database calls, or side effects
 */

export interface PriceImpact {
  newPrice: number
  absoluteChange: number
  percentageChange: number
}

/**
 * Apply price impact to a stock
 */
export function applyPriceImpact(
  currentPrice: number,
  impactAmount: number,
  minPrice: number = 0
): PriceImpact {
  const newPrice = Math.max(minPrice, currentPrice + impactAmount)
  const absoluteChange = newPrice - currentPrice
  const percentageChange = currentPrice > 0 ? (absoluteChange / currentPrice) * 100 : 0

  return {
    newPrice: Math.round(newPrice * 100) / 100, // Round to 2 decimal places
    absoluteChange: Math.round(absoluteChange * 100) / 100,
    percentageChange: Math.round(percentageChange * 100) / 100,
  }
}

/**
 * Calculate percentage change between two prices
 */
export function calculatePriceChangePercentage(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0
  const change = ((newPrice - oldPrice) / oldPrice) * 100
  return Math.round(change * 100) / 100
}

/**
 * Apply multiple price impacts to a stock
 */
export function applyMultiplePriceImpacts(
  currentPrice: number,
  impacts: number[],
  minPrice: number = 0
): PriceImpact {
  const totalImpact = impacts.reduce((sum, impact) => sum + impact, 0)
  return applyPriceImpact(currentPrice, totalImpact, minPrice)
}

/**
 * Calculate price after percentage change (for inflation/deflation)
 */
export function applyPercentageChange(
  currentPrice: number,
  percentage: number,
  minPrice: number = 0
): PriceImpact {
  const impactAmount = currentPrice * (percentage / 100)
  return applyPriceImpact(currentPrice, impactAmount, minPrice)
}

/**
 * Apply cash impact from inflation/deflation
 */
export function applyCashImpact(
  currentCash: number,
  percentage: number,
  minCash: number = 0
): number {
  const impactAmount = currentCash * (percentage / 100)
  const newCash = currentCash + impactAmount
  return Math.max(minCash, Math.round(newCash * 100) / 100)
}

/**
 * Calculate stock price impacts for multiple stocks
 */
export function calculateStockImpacts(
  stocks: Array<{ symbol: string; price: number }>,
  events: Array<{ affectedStocks: string[]; impact: number }>
): Map<string, PriceImpact> {
  const impactMap = new Map<string, number[]>()

  // Collect all impacts per stock
  for (const event of events) {
    for (const stock of stocks) {
      if (event.affectedStocks.includes(stock.symbol)) {
        if (!impactMap.has(stock.symbol)) {
          impactMap.set(stock.symbol, [])
        }
        impactMap.get(stock.symbol)!.push(event.impact)
      }
    }
  }

  // Calculate final price for each stock
  const results = new Map<string, PriceImpact>()
  for (const stock of stocks) {
    const impacts = impactMap.get(stock.symbol) || []
    results.set(stock.symbol, applyMultiplePriceImpacts(stock.price, impacts))
  }

  return results
}
