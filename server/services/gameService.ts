import { PrismaClient } from '@prisma/client'
import type { GameState, TradeAction, CorporateAction } from '../types/'
import { GameInitializer } from './gameInitializer'
import { GameStateManager } from './gameStateManager'
import { TurnManager } from './turnManager'
import { TradeExecutor } from './tradeExecutor'
import { LeadershipManager } from './leadershipManager'
import { LeadershipExclusionService } from './leadershipExclusionService'
import { RoundProcessor } from './roundProcessor'
import { CardManager } from './cardManager'
import { DEFAULT_MAX_ROUNDS } from '../constants'
import type {
  IGameInitializer,
  IGameStateService,
  ITradeService,
  ITurnService,
  ILeadershipService,
  TradeResult,
  TurnResult,
} from '../interfaces'

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
 * Now depends on interfaces instead of concrete implementations.
 */
export class GameService {
  private gameInitializer: IGameInitializer
  private gameStateManager: IGameStateService
  private turnManager: ITurnService
  private tradeExecutor: ITradeService
  private leadershipManager: ILeadershipService
  private roundProcessor: RoundProcessor
  private cardManager: CardManager

  constructor(prisma: PrismaClient) {
    const leadershipExclusionService = new LeadershipExclusionService(prisma)

    this.gameInitializer = new GameInitializer(prisma)
    this.gameStateManager = new GameStateManager(prisma)
    this.turnManager = new TurnManager(prisma, leadershipExclusionService)
    this.tradeExecutor = new TradeExecutor(prisma)
    this.leadershipManager = new LeadershipManager(prisma)
    this.roundProcessor = new RoundProcessor(prisma)
    this.cardManager = new CardManager(prisma)
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
  async executeTrade(gameId: string, action: TradeAction): Promise<TradeResult> {
    return await this.tradeExecutor.executeTrade(gameId, action, () =>
      this.leadershipManager.updateLeadership(gameId)
    )
  }

  /**
   * End turn
   * Delegates to TurnManager
   */
  async endTurn(gameId: string): Promise<TurnResult> {
    return await this.turnManager.endTurn(gameId)
  }

  /**
   * Complete leadership phase and trigger round processing
   *
   * Called after all leaders have made their exclusion decisions.
   * This triggers the round end processing which:
   * 1. Filters out excluded events
   * 2. Applies remaining events to stock prices
   * 3. Generates cards for next round
   * 4. Increments round counter
   */
  async completeLeadershipPhase(gameId: string): Promise<void> {
    await this.roundProcessor.processEndOfRound(gameId, (gId) =>
      this.cardManager.generateCardsForRound(gId)
    )
  }
}
