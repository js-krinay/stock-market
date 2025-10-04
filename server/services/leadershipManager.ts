import { PrismaClient } from '@prisma/client'
import { DIRECTOR_THRESHOLD, CHAIRMAN_THRESHOLD } from '../constants'

export class LeadershipManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update leadership for all stocks
   */
  async updateLeadership(gameId: string): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        stocks: true,
        players: { include: { portfolio: true } },
      },
    })

    if (!game) return

    for (const stock of game.stocks) {
      // Calculate ownership percentages
      const ownership = game.players.map((player) => {
        const holding = player.portfolio.find((h) => h.symbol === stock.symbol)
        const quantity = holding?.quantity || 0
        const percentage = (quantity / stock.totalQuantity) * 100
        return { playerId: player.id, quantity, percentage }
      })

      ownership.sort((a, b) => b.quantity - a.quantity)

      // Determine chairman (≥CHAIRMAN_THRESHOLD)
      let chairmanId: string | null = null

      const chairmanThresholdPercent = CHAIRMAN_THRESHOLD * 100

      if (stock.chairmanId) {
        const existingChairman = ownership.find((o) => o.playerId === stock.chairmanId)
        if (existingChairman && existingChairman.percentage >= chairmanThresholdPercent) {
          chairmanId = stock.chairmanId
        }
      }

      if (!chairmanId) {
        const topHolder = ownership.find((o) => o.percentage >= chairmanThresholdPercent)
        if (topHolder) {
          chairmanId = topHolder.playerId
        }
      }

      // Determine director (≥DIRECTOR_THRESHOLD, but not chairman)
      let directorId: string | null = null

      const directorThresholdPercent = DIRECTOR_THRESHOLD * 100

      if (stock.directorId) {
        const existingDirector = ownership.find((o) => o.playerId === stock.directorId)
        if (
          existingDirector &&
          existingDirector.percentage >= directorThresholdPercent &&
          existingDirector.playerId !== chairmanId
        ) {
          directorId = stock.directorId
        }
      }

      if (!directorId) {
        const topQualifier = ownership.find(
          (o) => o.percentage >= directorThresholdPercent && o.playerId !== chairmanId
        )
        if (topQualifier) {
          directorId = topQualifier.playerId
        }
      }

      // Update stock with leadership
      await this.prisma.stock.update({
        where: { id: stock.id },
        data: {
          directorId,
          chairmanId,
        },
      })
    }
  }
}
