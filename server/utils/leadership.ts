/**
 * Pure functions for leadership calculations
 * No I/O, database calls, or side effects
 */

export interface OwnershipData {
  playerId: string
  quantity: number
  percentage: number
}

export interface LeadershipResult {
  chairmanId: string | null
  directorId: string | null
}

/**
 * Calculate ownership percentages for all players
 */
export function calculateOwnership(
  players: Array<{ id: string; holdings: Array<{ symbol: string; quantity: number }> }>,
  stockSymbol: string,
  totalQuantity: number
): OwnershipData[] {
  const ownership = players.map((player) => {
    const holding = player.holdings.find((h) => h.symbol === stockSymbol)
    const quantity = holding?.quantity || 0
    const percentage = (quantity / totalQuantity) * 100
    return { playerId: player.id, quantity, percentage }
  })

  // Sort by quantity descending
  return ownership.sort((a, b) => b.quantity - a.quantity)
}

/**
 * Determine chairman from ownership data
 * Chairman requires ≥50% ownership
 * Chairman is the highest qualifying shareholder
 * In case of a tie, existing chairman is retained if they are among the tied players
 */
export function determineChairman(
  ownership: OwnershipData[],
  currentChairmanId: string | null,
  chairmanThreshold: number
): string | null {
  const chairmanThresholdPercent = chairmanThreshold * 100

  // Find all qualifying shareholders (ownership is already sorted by quantity desc)
  const qualifyingOwners = ownership.filter((o) => o.percentage >= chairmanThresholdPercent)

  if (qualifyingOwners.length === 0) {
    return null
  }

  // Get the highest quantity among qualifiers
  const highestQuantity = qualifyingOwners[0].quantity

  // Check if there's a tie at the top
  const tiedOwners = qualifyingOwners.filter((o) => o.quantity === highestQuantity)

  // If there's a tie and the current chairman is among the tied players, retain them
  if (tiedOwners.length > 1 && currentChairmanId) {
    const currentChairmanInTie = tiedOwners.find((o) => o.playerId === currentChairmanId)
    if (currentChairmanInTie) {
      return currentChairmanId
    }
  }

  // Otherwise, return the highest qualifying shareholder
  return qualifyingOwners[0].playerId
}

/**
 * Determine director from ownership data
 * Director requires ≥25% ownership and cannot be the chairman
 * Director is the highest qualifying shareholder
 * In case of a tie, existing director is retained if they are among the tied players
 */
export function determineDirector(
  ownership: OwnershipData[],
  currentDirectorId: string | null,
  chairmanId: string | null,
  directorThreshold: number
): string | null {
  const directorThresholdPercent = directorThreshold * 100

  // Find all qualifying shareholders (ownership is already sorted by quantity desc)
  const qualifyingOwners = ownership.filter(
    (o) => o.percentage >= directorThresholdPercent && o.playerId !== chairmanId
  )

  if (qualifyingOwners.length === 0) {
    return null
  }

  // Get the highest quantity among qualifiers
  const highestQuantity = qualifyingOwners[0].quantity

  // Check if there's a tie at the top
  const tiedOwners = qualifyingOwners.filter((o) => o.quantity === highestQuantity)

  // If there's a tie and the current director is among the tied players, retain them
  if (tiedOwners.length > 1 && currentDirectorId) {
    const currentDirectorInTie = tiedOwners.find((o) => o.playerId === currentDirectorId)
    if (currentDirectorInTie) {
      return currentDirectorId
    }
  }

  // Otherwise, return the highest qualifying shareholder
  return qualifyingOwners[0].playerId
}

/**
 * Calculate leadership for a stock
 */
export function calculateLeadership(
  players: Array<{ id: string; holdings: Array<{ symbol: string; quantity: number }> }>,
  stockSymbol: string,
  totalQuantity: number,
  currentChairmanId: string | null,
  currentDirectorId: string | null,
  chairmanThreshold: number,
  directorThreshold: number
): LeadershipResult {
  const ownership = calculateOwnership(players, stockSymbol, totalQuantity)
  const chairmanId = determineChairman(ownership, currentChairmanId, chairmanThreshold)
  const directorId = determineDirector(ownership, currentDirectorId, chairmanId, directorThreshold)

  return { chairmanId, directorId }
}

/**
 * Check if a player is chairman or director of any stock
 */
export function isPlayerLeader(
  playerId: string,
  stocks: Array<{ chairmanId: string | null; directorId: string | null }>
): boolean {
  return stocks.some((stock) => stock.chairmanId === playerId || stock.directorId === playerId)
}

/**
 * Get stocks where player is chairman or director
 */
export function getLeadershipStocks(
  playerId: string,
  stocks: Array<{ symbol: string; chairmanId: string | null; directorId: string | null }>
): string[] {
  return stocks
    .filter((stock) => stock.chairmanId === playerId || stock.directorId === playerId)
    .map((stock) => stock.symbol)
}
