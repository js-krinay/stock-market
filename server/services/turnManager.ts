import { PrismaClient } from '@prisma/client'
import { CardManager } from './cardManager'
import { RoundProcessor } from './roundProcessor'

/**
 * TurnManager - Handles turn progression and round transitions
 *
 * Responsibilities:
 * - Manage player turn rotation
 * - Handle turn-to-turn transitions
 * - Coordinate round end processing
 * - Expire rights issues based on player turns
 */
export class TurnManager {
  private cardManager: CardManager
  private roundProcessor: RoundProcessor

  constructor(private prisma: PrismaClient) {
    this.cardManager = new CardManager(prisma)
    this.roundProcessor = new RoundProcessor(prisma)
  }

  /**
   * End current turn and move to next player
   */
  async endTurn(gameId: string): Promise<{ roundEnded: boolean; gameOver: boolean }> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) throw new Error('Game not found')

    // Move to next player
    const nextPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length
    const nextPlayer = game.players[nextPlayerIndex]

    // Expire any rights issues that the next player had played (their turn is coming again)
    await this.expireRightsIssues(gameId, nextPlayer.id)

    if (nextPlayerIndex === 0) {
      // All players completed a turn
      const nextTurn = game.currentTurnInRound + 1

      if (nextTurn > game.turnsPerRound) {
        // Round complete
        await this.roundProcessor.processEndOfRound(gameId, (gId) =>
          this.cardManager.generateCardsForRound(gId)
        )
        return { roundEnded: true, gameOver: game.currentRound + 1 > game.maxRounds }
      }

      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          currentTurnInRound: nextTurn,
          currentPlayerIndex: 0,
        },
      })
    } else {
      await this.prisma.game.update({
        where: { id: gameId },
        data: { currentPlayerIndex: nextPlayerIndex },
      })
    }

    return { roundEnded: false, gameOver: false }
  }

  /**
   * Expire rights issues when the player who played them gets their turn again
   */
  private async expireRightsIssues(gameId: string, currentPlayerId: string): Promise<void> {
    // Expire all active rights issues where the current player is the one who played them
    await this.prisma.corporateAction.updateMany({
      where: {
        gameId,
        type: 'right_issue',
        status: 'active',
        expiresAtPlayerId: currentPlayerId,
      },
      data: { status: 'expired' },
    })
  }
}
