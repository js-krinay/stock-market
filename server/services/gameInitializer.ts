import { PrismaClient } from '@prisma/client'
import { CardManager } from './cardManager'
import {
  DEFAULT_MAX_ROUNDS,
  DEFAULT_TURNS_PER_ROUND,
  STARTING_CASH,
  MAX_STOCK_QUANTITY,
  INITIAL_STOCKS,
} from '../constants'
import { IGameInitializer } from '../interfaces/IGameInitializer'

/**
 * GameInitializer - Handles game creation and initialization
 *
 * Responsibilities:
 * - Create new game sessions
 * - Initialize players with starting cash
 * - Set up initial stock market
 * - Generate initial cards
 */
export class GameInitializer implements IGameInitializer {
  private cardManager: CardManager

  constructor(private prisma: PrismaClient) {
    this.cardManager = new CardManager(prisma)
  }

  /**
   * Create a new game with players and initial setup
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
    await this.createPlayers(game.id, playerNames)

    // Initialize stocks
    await this.initializeStocks(game.id)

    // Generate cards for all players for round 1
    await this.cardManager.generateCardsForRound(game.id)

    return game.id
  }

  /**
   * Create players for a game
   */
  private async createPlayers(gameId: string, playerNames: string[]): Promise<void> {
    for (const name of playerNames) {
      await this.prisma.player.create({
        data: {
          name,
          gameId,
          cash: STARTING_CASH,
        },
      })
    }
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
}
