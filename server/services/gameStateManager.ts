import { PrismaClient } from '@prisma/client'
import type { GameState, CorporateAction } from '../types'
import {
  mapDbStockToAppStock,
  mapDbPlayerToAppPlayer,
  mapDbEventToAppEvent,
  mapDbActionToAppAction,
} from './mappers'

/**
 * GameStateManager - Handles game state queries and data retrieval
 *
 * Responsibilities:
 * - Retrieve full game state
 * - Query active rights issues
 * - Get player rankings
 * - Fetch unplayed corporate actions
 */
export class GameStateManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get full game state with all related data
   */
  async getGameState(gameId: string): Promise<GameState> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            portfolio: true,
            actionHistory: {
              orderBy: { timestamp: 'desc' },
            },
            events: true,
            corporateActions: true,
          },
        },
        stocks: {
          include: {
            priceHistory: {
              orderBy: { round: 'asc' },
            },
          },
        },
        events: {
          orderBy: { round: 'asc' },
        },
      },
    })

    if (!game) throw new Error('Game not found')

    return {
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      currentTurnInRound: game.currentTurnInRound,
      turnsPerRound: game.turnsPerRound,
      players: game.players.map((p) => mapDbPlayerToAppPlayer(p, game.currentRound)),
      currentPlayerIndex: game.currentPlayerIndex,
      stocks: game.stocks.map((s) => mapDbStockToAppStock(s)),
      eventHistory: game.events.map((e) => mapDbEventToAppEvent(e)),
      isComplete: game.isComplete,
    }
  }

  /**
   * Get active rights issues available for current player
   */
  async getActiveRightsIssues(gameId: string): Promise<CorporateAction[]> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) throw new Error('Game not found')

    const currentPlayer = game.players[game.currentPlayerIndex]

    // Find active rights issues where current player is eligible
    const activeRightsIssues = await this.prisma.corporateAction.findMany({
      where: {
        gameId,
        type: 'right_issue',
        status: 'active',
      },
    })

    const eligibleRightsIssues: CorporateAction[] = []
    for (const ri of activeRightsIssues) {
      const eligiblePlayerIds = ri.eligiblePlayerIds ? JSON.parse(ri.eligiblePlayerIds) : []
      if (eligiblePlayerIds.includes(currentPlayer.id)) {
        eligibleRightsIssues.push(mapDbActionToAppAction(ri))
      }
    }

    return eligibleRightsIssues
  }
}
