/**
 * Pure business logic for corporate action calculations
 * No state, no I/O - just computation
 *
 * For corporate action generation, use CorporateActionGenerator service
 */

export interface ShareholderHolding {
  playerId: string
  playerName: string
  quantity: number
  averageCost: number
}

export interface DividendCalculation {
  playerId: string
  playerName: string
  symbol: string
  quantity: number
  dividendAmount: number
}

export interface BonusIssueCalculation {
  playerId: string
  playerName: string
  symbol: string
  originalQuantity: number
  bonusShares: number
  newQuantity: number
  newAverageCost: number
}

export interface BonusIssueDistributionResult {
  distributions: BonusIssueCalculation[]
  totalBonusShares: number
  wouldExceedLimit: boolean
  maxStockQuantity: number
  currentIssuedQuantity: number
}

/**
 * Calculate dividend distribution for all shareholders
 * @param stockPrice Current price of the stock
 * @param shareholders Array of shareholders with their holdings for the specific stock
 * @param symbol Stock symbol
 * @returns Array of dividend calculations for each shareholder
 */
export function calculateDividendDistribution(
  stockPrice: number,
  shareholders: ShareholderHolding[],
  symbol: string
): DividendCalculation[] {
  // Calculate dividend as 5% of stock price per share
  const dividendPerShare = stockPrice * 0.05

  const distributions: DividendCalculation[] = []

  for (const shareholder of shareholders) {
    if (shareholder.quantity > 0) {
      const dividendAmount = shareholder.quantity * dividendPerShare

      distributions.push({
        playerId: shareholder.playerId,
        playerName: shareholder.playerName,
        symbol,
        quantity: shareholder.quantity,
        dividendAmount: Math.round(dividendAmount * 100) / 100,
      })
    }
  }

  return distributions
}

/**
 * Calculate bonus issue distribution for all shareholders
 * @param shareholders Array of shareholders with their holdings for the specific stock
 * @param symbol Stock symbol
 * @param bonusDetails Bonus issue details (ratio and baseShares)
 * @param maxStockQuantity Maximum allowed stock quantity (default 200000)
 * @returns Distribution result with validation information
 */
export function calculateBonusIssueDistribution(
  shareholders: ShareholderHolding[],
  symbol: string,
  bonusDetails: BonusIssueDetails,
  maxStockQuantity: number = 200000
): BonusIssueDistributionResult {
  const distributions: BonusIssueCalculation[] = []

  // Calculate current issued quantity from all shareholders' holdings
  let currentIssuedQuantity = 0
  for (const shareholder of shareholders) {
    if (shareholder.quantity > 0) {
      currentIssuedQuantity += shareholder.quantity
    }
  }

  // Step 1: Calculate intended bonus shares for each shareholder
  const intendedDistributions: Array<{
    shareholder: ShareholderHolding
    intendedBonus: number
  }> = []
  let totalIntendedBonus = 0

  for (const shareholder of shareholders) {
    if (shareholder.quantity > 0) {
      const intendedBonus =
        Math.floor(shareholder.quantity / bonusDetails.baseShares) * bonusDetails.ratio

      if (intendedBonus > 0) {
        intendedDistributions.push({ shareholder, intendedBonus })
        totalIntendedBonus += intendedBonus
      }
    }
  }

  // Step 2: Check if bonus would exceed limit
  const wouldExceedLimit = currentIssuedQuantity + totalIntendedBonus > maxStockQuantity
  const availableShares = maxStockQuantity - currentIssuedQuantity

  // Step 3: Calculate scaling factor if needed
  let scalingFactor = 1
  if (wouldExceedLimit && totalIntendedBonus > 0) {
    scalingFactor = availableShares / totalIntendedBonus
  }

  // Step 4: Calculate final distributions (scaled if necessary)
  let totalBonusShares = 0
  for (const { shareholder, intendedBonus } of intendedDistributions) {
    // Scale down the bonus if it would exceed limit
    const actualBonus = wouldExceedLimit ? Math.floor(intendedBonus * scalingFactor) : intendedBonus

    const newQuantity = shareholder.quantity + actualBonus
    const newAverageCost = (shareholder.averageCost * shareholder.quantity) / newQuantity

    distributions.push({
      playerId: shareholder.playerId,
      playerName: shareholder.playerName,
      symbol,
      originalQuantity: shareholder.quantity,
      bonusShares: actualBonus,
      newQuantity,
      newAverageCost: Math.round(newAverageCost * 100) / 100,
    })

    totalBonusShares += actualBonus
  }

  return {
    distributions,
    totalBonusShares,
    wouldExceedLimit,
    maxStockQuantity,
    currentIssuedQuantity,
  }
}
