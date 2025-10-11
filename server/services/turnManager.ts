import { PrismaClient } from '@prisma/client'
import { CardManager } from './cardManager'
import { RoundProcessor } from './roundProcessor'
import { Errors } from '../errors'
import { ITurnService, TurnResult } from '../interfaces/ITurnService'
import type {
  LeadershipInfo,
  ILeadershipExclusionService,
} from '../interfaces/ILeadershipExclusionService'

/**
 * TurnManager - Handles turn progression and round transitions
 *
 * Responsibilities:
 * - Manage player turn rotation
 * - Handle turn-to-turn transitions
 * - Coordinate round end processing
 * - Detect leadership phase (chairman/director exclusion opportunities)
 * - Expire rights issues based on player turns
 */
export class TurnManager implements ITurnService {
  private cardManager: CardManager
  private roundProcessor: RoundProcessor
  private leadershipService: ILeadershipExclusionService

  constructor(
    private prisma: PrismaClient,
    leadershipService: ILeadershipExclusionService
  ) {
    this.cardManager = new CardManager(prisma)
    this.roundProcessor = new RoundProcessor(prisma)
    this.leadershipService = leadershipService
  }

  /**
   * End current turn and move to next player
   * Detects leadership phase (chairman/director) before processing round end
   */
  async endTurn(gameId: string): Promise<TurnResult> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) throw Errors.gameNotFound(gameId)

    // Move to next player
    const nextPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length
    const nextPlayer = game.players[nextPlayerIndex]

    // Expire any rights issues that the next player had played (their turn is coming again)
    await this.expireRightsIssues(gameId, nextPlayer.id)

    if (nextPlayerIndex === 0) {
      // All players completed a turn
      const nextTurn = game.currentTurnInRound + 1

      if (nextTurn > game.turnsPerRound) {
        // Round complete - check for leadership phase (chairman or director)
        const leaders = await this.getLeadersForRound(gameId)

        if (leaders.length > 0) {
          // Initialize leadership phase with ordered leader IDs
          const leaderIds = leaders.map((l) => l.playerId)
          await this.leadershipService.initializeLeadershipPhase(gameId, leaderIds)

          // Signal leadership phase required, don't process round yet
          await this.prisma.game.update({
            where: { id: gameId },
            data: {
              currentTurnInRound: nextTurn, // Sentinel: 4 means "leadership phase"
              currentPlayerIndex: 0,
            },
          })

          return {
            roundEnded: false,
            gameOver: false,
            leadershipPhaseRequired: true,
            leaders,
          }
        }

        // No leaders, proceed with normal round processing
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
   * Get all leaders (chairmen and directors) with their stocks for current round
   * Directors only included when no chairman exists for that stock
   * @private
   */
  private async getLeadersForRound(gameId: string): Promise<LeadershipInfo[]> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        gameId,
        OR: [{ chairmanId: { not: null } }, { directorId: { not: null } }],
      },
      include: {
        chairman: true,
        director: true,
        holdings: true,
      },
    })

    if (stocks.length === 0) return []

    // Group stocks by leader (chairman takes priority over director)
    const leadersMap = new Map<string, LeadershipInfo>()

    for (const stock of stocks) {
      // Chairman has priority - director only gets rights if no chairman
      const isChairman = stock.chairmanId && stock.chairman
      const isDirector = stock.directorId && stock.director && !stock.chairmanId

      if (!isChairman && !isDirector) continue

      const leaderId = isChairman ? stock.chairmanId! : stock.directorId!
      const leader = isChairman ? stock.chairman! : stock.director!
      const leaderType = isChairman ? 'chairman' : 'director'

      if (!leadersMap.has(leaderId)) {
        leadersMap.set(leaderId, {
          playerId: leaderId,
          playerName: leader.name,
          stocks: [],
        })
      }

      // Calculate share percentage for display
      const totalHoldings = stock.holdings.reduce((sum, h) => sum + h.quantity, 0)
      const leaderHolding = stock.holdings.find((h) => h.playerId === leaderId)
      const sharePercentage = leaderHolding ? (leaderHolding.quantity / totalHoldings) * 100 : 0

      leadersMap.get(leaderId)!.stocks.push({
        symbol: stock.symbol,
        name: stock.name,
        color: stock.color,
        leaderType,
        sharePercentage,
      })
    }

    return Array.from(leadersMap.values())
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
