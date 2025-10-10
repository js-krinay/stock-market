import { PrismaClient } from '@prisma/client'
import { DIRECTOR_THRESHOLD, CHAIRMAN_THRESHOLD } from '../constants'
import { calculateLeadership } from '../utils/leadership'
import { ILeadershipService } from '../interfaces/ILeadershipService'

export class LeadershipManager implements ILeadershipService {
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
      // Map players to format expected by pure function
      const players = game.players.map((player) => ({
        id: player.id,
        holdings: player.portfolio.map((h) => ({
          symbol: h.symbol,
          quantity: h.quantity,
        })),
      }))

      // Use pure function to calculate leadership
      const { chairmanId, directorId } = calculateLeadership(
        players,
        stock.symbol,
        stock.totalQuantity,
        stock.chairmanId,
        stock.directorId,
        CHAIRMAN_THRESHOLD,
        DIRECTOR_THRESHOLD
      )

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
