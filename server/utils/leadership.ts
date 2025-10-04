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
 */
export function determineChairman(
  ownership: OwnershipData[],
  currentChairmanId: string | null,
  chairmanThreshold: number
): string | null {
  const chairmanThresholdPercent = chairmanThreshold * 100

  // Check if existing chairman still qualifies
  if (currentChairmanId) {
    const existingChairman = ownership.find((o) => o.playerId === currentChairmanId)
    if (existingChairman && existingChairman.percentage >= chairmanThresholdPercent) {
      return currentChairmanId
    }
  }

  // Find new chairman
  const topHolder = ownership.find((o) => o.percentage >= chairmanThresholdPercent)
  return topHolder ? topHolder.playerId : null
}

/**
 * Determine director from ownership data
 * Director requires ≥25% ownership and cannot be the chairman
 */
export function determineDirector(
  ownership: OwnershipData[],
  currentDirectorId: string | null,
  chairmanId: string | null,
  directorThreshold: number
): string | null {
  const directorThresholdPercent = directorThreshold * 100

  // Check if existing director still qualifies
  if (currentDirectorId) {
    const existingDirector = ownership.find((o) => o.playerId === currentDirectorId)
    if (
      existingDirector &&
      existingDirector.percentage >= directorThresholdPercent &&
      existingDirector.playerId !== chairmanId
    ) {
      return currentDirectorId
    }
  }

  // Find new director
  const topQualifier = ownership.find(
    (o) => o.percentage >= directorThresholdPercent && o.playerId !== chairmanId
  )
  return topQualifier ? topQualifier.playerId : null
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
