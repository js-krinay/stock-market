/**
 * Pure functions for trading calculations and validations
 * No I/O, database calls, or side effects
 */

export interface TradeValidationResult {
  isValid: boolean
  error?: string
}

export interface CostCalculation {
  totalCost: number
  pricePerShare: number
  quantity: number
}

export interface PortfolioUpdate {
  newQuantity: number
  newAverageCost: number
}

/**
 * Validate a buy trade
 */
export function validateBuyTrade(
  quantity: number,
  stockPrice: number,
  stockAvailableQuantity: number,
  playerCash: number
): TradeValidationResult {
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be positive' }
  }

  if (stockPrice <= 0) {
    return { isValid: false, error: 'Stock cannot be traded at $0' }
  }

  if (quantity > stockAvailableQuantity) {
    return { isValid: false, error: `Only ${stockAvailableQuantity} shares available` }
  }

  const totalCost = stockPrice * quantity
  if (totalCost > playerCash) {
    return { isValid: false, error: 'Insufficient funds' }
  }

  return { isValid: true }
}

/**
 * Validate a sell trade
 */
export function validateSellTrade(
  quantity: number,
  stockPrice: number,
  playerHolding: number
): TradeValidationResult {
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be positive' }
  }

  if (stockPrice <= 0) {
    return { isValid: false, error: 'Stock cannot be traded at $0' }
  }

  if (playerHolding === 0) {
    return { isValid: false, error: 'You do not own any shares of this stock' }
  }

  if (quantity > playerHolding) {
    return { isValid: false, error: `You only own ${playerHolding} shares` }
  }

  return { isValid: true }
}

/**
 * Calculate total cost of a trade
 */
export function calculateTradeCost(quantity: number, pricePerShare: number): CostCalculation {
  return {
    totalCost: quantity * pricePerShare,
    pricePerShare,
    quantity,
  }
}

/**
 * Calculate new average cost after buying more shares
 */
export function calculateNewAverageCost(
  currentQuantity: number,
  currentAverageCost: number,
  newQuantity: number,
  newPricePerShare: number
): number {
  const totalCost = currentQuantity * currentAverageCost + newQuantity * newPricePerShare
  const totalQuantity = currentQuantity + newQuantity
  return totalQuantity > 0 ? totalCost / totalQuantity : 0
}

/**
 * Calculate portfolio update after a buy
 */
export function calculateBuyPortfolioUpdate(
  currentQuantity: number,
  currentAverageCost: number,
  buyQuantity: number,
  buyPrice: number
): PortfolioUpdate {
  const newQuantity = currentQuantity + buyQuantity
  const newAverageCost = calculateNewAverageCost(
    currentQuantity,
    currentAverageCost,
    buyQuantity,
    buyPrice
  )

  return { newQuantity, newAverageCost }
}

/**
 * Calculate portfolio update after a sell
 */
export function calculateSellPortfolioUpdate(
  currentQuantity: number,
  currentAverageCost: number,
  sellQuantity: number
): PortfolioUpdate {
  const newQuantity = currentQuantity - sellQuantity

  // Average cost remains the same when selling
  return { newQuantity, newAverageCost: currentAverageCost }
}

/**
 * Calculate profit/loss on a sale
 */
export function calculateSaleProfit(
  sellQuantity: number,
  sellPrice: number,
  averageCost: number
): number {
  const revenue = sellQuantity * sellPrice
  const cost = sellQuantity * averageCost
  return revenue - cost
}

/**
 * Calculate current value of a holding
 */
export function calculateHoldingValue(quantity: number, currentPrice: number): number {
  return quantity * currentPrice
}

/**
 * Calculate unrealized profit/loss on a holding
 */
export function calculateUnrealizedProfit(
  quantity: number,
  currentPrice: number,
  averageCost: number
): number {
  const currentValue = calculateHoldingValue(quantity, currentPrice)
  const costBasis = quantity * averageCost
  return currentValue - costBasis
}

/**
 * Calculate portfolio total value
 */
export function calculatePortfolioValue(
  holdings: Array<{ quantity: number; averageCost: number }>,
  stockPrices: number[]
): number {
  return holdings.reduce((total, holding, index) => {
    return total + calculateHoldingValue(holding.quantity, stockPrices[index])
  }, 0)
}

/**
 * Calculate net worth
 */
export function calculateNetWorth(cash: number, portfolioValue: number): number {
  return cash + portfolioValue
}
