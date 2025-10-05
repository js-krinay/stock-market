import { PrismaClient } from '@prisma/client'
import type { GameState, TradeAction, CorporateAction } from '../types'
import { CardManager } from './cardManager'
import { TradeExecutor } from './tradeExecutor'
import { RoundProcessor } from './roundProcessor'
import { LeadershipManager } from './leadershipManager'
import {
  mapDbStockToAppStock,
  mapDbPlayerToAppPlayer,
  mapDbEventToAppEvent,
  mapDbActionToAppAction,
} from './mappers'
import {
  DEFAULT_MAX_ROUNDS,
  DEFAULT_TURNS_PER_ROUND,
  STARTING_CASH,
  MAX_STOCK_QUANTITY,
  INITIAL_STOCKS,
} from '../constants'

export class GameService {
  private cardManager: CardManager
  private tradeExecutor: TradeExecutor
  private roundProcessor: RoundProcessor
  private leadershipManager: LeadershipManager

  constructor(private prisma: PrismaClient) {
    this.cardManager = new CardManager(prisma)
    this.tradeExecutor = new TradeExecutor(prisma)
    this.roundProcessor = new RoundProcessor(prisma)
    this.leadershipManager = new LeadershipManager(prisma)
  }

  /**
   * Create a new game
   */
  async createGame(playerNames: string[], maxRounds: number = DEFAULT_MAX_ROUNDS): Promise<string> {
    const game = await this.prisma.game.create({
      data: {
        maxRounds,
        currentRound: 1,
        currentTurnInRound: 1,
        turnsPerRound: DEFAULT_TURNS_PER_ROUND,
        currentPlayerIndex: 0,
      },
    })

    // Create players
    for (const name of playerNames) {
      await this.prisma.player.create({
        data: {
          name,
          gameId: game.id,
          cash: STARTING_CASH,
        },
      })
    }

    // Initialize stocks
    await this.initializeStocks(game.id)

    // Generate cards for all players for round 1
    await this.cardManager.generateCardsForRound(game.id)

    return game.id
  }

  /**
   * Initialize stocks for a game
   */
  private async initializeStocks(gameId: string): Promise<void> {
    for (const stock of INITIAL_STOCKS) {
      const createdStock = await this.prisma.stock.create({
        data: {
          ...stock,
          availableQuantity: MAX_STOCK_QUANTITY,
          totalQuantity: MAX_STOCK_QUANTITY,
          gameId,
        },
      })

      // Add initial price history
      await this.prisma.priceHistory.create({
        data: {
          round: 0,
          price: stock.price,
          stockId: createdStock.id,
        },
      })

      // Leadership fields are now part of Stock model (initialized as null)
    }
  }

  /**
   * Get full game state
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

  /**
   * Execute trade
   */
  async executeTrade(
    gameId: string,
    action: TradeAction
  ): Promise<{
    success: boolean
    message: string
    toasts?: Array<{ playerName: string; message: string }>
  }> {
    return await this.tradeExecutor.executeTrade(gameId, action, () =>
      this.leadershipManager.updateLeadership(gameId)
    )
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

  /**
   * End turn
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
}
