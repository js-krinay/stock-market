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
