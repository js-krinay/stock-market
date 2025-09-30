import { Stock, Player, StockLeadership } from './types'

export class LeadershipManager {
  /**
   * Calculate and update leadership for all stocks based on current ownership
   * Rules:
   * - Director: owns ≥25% of total stock units
   * - Chairman: owns ≥50% of total stock units
   * - Only one player can hold each title per stock
   * - In case of tie, the player who achieved the threshold first keeps the title
   */
  updateLeadership(
    stocks: Stock[],
    players: Player[],
    currentLeadership: StockLeadership[]
  ): StockLeadership[] {
    const newLeadership: StockLeadership[] = []

    stocks.forEach((stock) => {
      const existingLeadership = currentLeadership.find((l) => l.symbol === stock.symbol)

      // Calculate ownership percentages for each player
      const ownership = players.map((player) => {
        const holding = player.portfolio.find((h) => h.symbol === stock.symbol)
        const quantity = holding?.quantity || 0
        const percentage = (quantity / stock.totalQuantity) * 100
        return { playerId: player.id, quantity, percentage }
      })

      // Sort by quantity (descending) to find top holders
      ownership.sort((a, b) => b.quantity - a.quantity)

      // Determine chairman (≥50%)
      let chairmanId: string | null = null
      let chairmanSince = Date.now()

      // Check if existing chairman still qualifies
      if (existingLeadership?.chairmanId) {
        const existingChairman = ownership.find((o) => o.playerId === existingLeadership.chairmanId)
        if (existingChairman && existingChairman.percentage >= 50) {
          chairmanId = existingLeadership.chairmanId
          chairmanSince = existingLeadership.chairmanSince
        }
      }

      // If no existing chairman or they lost the title, find new one
      if (!chairmanId) {
        const topHolder = ownership.find((o) => o.percentage >= 50)
        if (topHolder) {
          chairmanId = topHolder.playerId
          chairmanSince = Date.now()
        }
      }

      // Determine director (≥25%, but only if not chairman)
      let directorId: string | null = null
      let directorSince = Date.now()

      // Check if existing director still qualifies
      if (existingLeadership?.directorId) {
        const existingDirector = ownership.find((o) => o.playerId === existingLeadership.directorId)
        if (
          existingDirector &&
          existingDirector.percentage >= 25 &&
          existingDirector.playerId !== chairmanId
        ) {
          directorId = existingLeadership.directorId
          directorSince = existingLeadership.directorSince
        }
      }

      // If no existing director or they lost the title, find new one
      if (!directorId) {
        const topQualifier = ownership.find((o) => o.percentage >= 25 && o.playerId !== chairmanId)
        if (topQualifier) {
          directorId = topQualifier.playerId
          directorSince = Date.now()
        }
      }

      newLeadership.push({
        symbol: stock.symbol,
        directorId,
        chairmanId,
        directorSince,
        chairmanSince,
      })
    })

    return newLeadership
  }

  /**
   * Get leadership info for a specific stock
   */
  getLeadershipForStock(
    symbol: string,
    leadership: StockLeadership[]
  ): StockLeadership | undefined {
    return leadership.find((l) => l.symbol === symbol)
  }

  /**
   * Get all leadership titles for a specific player
   */
  getPlayerLeaderships(
    playerId: string,
    leadership: StockLeadership[]
  ): { director: string[]; chairman: string[] } {
    const director: string[] = []
    const chairman: string[] = []

    leadership.forEach((l) => {
      if (l.directorId === playerId) {
        director.push(l.symbol)
      }
      if (l.chairmanId === playerId) {
        chairman.push(l.symbol)
      }
    })

    return { director, chairman }
  }

  /**
   * Calculate ownership percentage for a player in a specific stock
   */
  getOwnershipPercentage(
    playerId: string,
    symbol: string,
    players: Player[],
    stocks: Stock[]
  ): number {
    const player = players.find((p) => p.id === playerId)
    const stock = stocks.find((s) => s.symbol === symbol)

    if (!player || !stock) return 0

    const holding = player.portfolio.find((h) => h.symbol === symbol)
    if (!holding) return 0

    return (holding.quantity / stock.totalQuantity) * 100
  }

  /**
   * Initialize leadership for all stocks (used when game starts)
   */
  initializeLeadership(stocks: Stock[]): StockLeadership[] {
    return stocks.map((stock) => ({
      symbol: stock.symbol,
      directorId: null,
      chairmanId: null,
      directorSince: Date.now(),
      chairmanSince: Date.now(),
    }))
  }
}
