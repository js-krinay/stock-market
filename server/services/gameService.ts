import { PrismaClient } from '@prisma/client'
import type { GameState, TradeAction, CorporateAction } from '../types'
import { GameInitializer } from './gameInitializer'
import { GameStateManager } from './gameStateManager'
import { TurnManager } from './turnManager'
import { TradeExecutor } from './tradeExecutor'
import { LeadershipManager } from './leadershipManager'
import { DEFAULT_MAX_ROUNDS } from '../constants'

/**
 * GameService - Main orchestrator for game operations
 *
 * Refactored to delegate responsibilities to specialized services:
 * - GameInitializer: Game creation and setup
 * - GameStateManager: State queries and data retrieval
 * - TurnManager: Turn progression and round transitions
 * - TradeExecutor: Trade validation and execution
 * - LeadershipManager: Leadership tracking
 *
 * This service now acts as a facade, providing a unified interface
 * while maintaining clean separation of concerns.
 */
export class GameService {
  private gameInitializer: GameInitializer
  private gameStateManager: GameStateManager
  private turnManager: TurnManager
  private tradeExecutor: TradeExecutor
  private leadershipManager: LeadershipManager

  constructor(prisma: PrismaClient) {
    this.gameInitializer = new GameInitializer(prisma)
    this.gameStateManager = new GameStateManager(prisma)
    this.turnManager = new TurnManager(prisma)
    this.tradeExecutor = new TradeExecutor(prisma)
    this.leadershipManager = new LeadershipManager(prisma)
  }

  /**
   * Create a new game
   * Delegates to GameInitializer
   */
  async createGame(playerNames: string[], maxRounds: number = DEFAULT_MAX_ROUNDS): Promise<string> {
    return await this.gameInitializer.createGame(playerNames, maxRounds)
  }

  /**
   * Get full game state
   * Delegates to GameStateManager
   */
  async getGameState(gameId: string): Promise<GameState> {
    return await this.gameStateManager.getGameState(gameId)
  }

  /**
   * Get active rights issues available for current player
   * Delegates to GameStateManager
   */
  async getActiveRightsIssues(gameId: string): Promise<CorporateAction[]> {
    return await this.gameStateManager.getActiveRightsIssues(gameId)
  }

  /**
   * Execute trade
   * Delegates to TradeExecutor with leadership update callback
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
   * End turn
   * Delegates to TurnManager
   */
  async endTurn(gameId: string): Promise<{ roundEnded: boolean; gameOver: boolean }> {
    return await this.turnManager.endTurn(gameId)
  }
}
