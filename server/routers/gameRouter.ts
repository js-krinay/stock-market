import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { GameService } from '../services/gameService'
import { UIDataService } from '../services/uiDataService'

export const gameRouter = router({
  // Create a new game
  createGame: publicProcedure
    .input(
      z.object({
        playerNames: z.array(z.string()).min(1).max(4),
        maxRounds: z.number().min(1).max(50).default(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const gameService = new GameService(ctx.prisma)
      const gameId = await gameService.createGame(input.playerNames, input.maxRounds)
      return { gameId }
    }),

  // Get game state
  getGameState: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input, ctx }) => {
      const gameService = new GameService(ctx.prisma)
      const gameState = await gameService.getGameState(input.gameId)
      return gameState
    }),

  // Execute trade
  executeTrade: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        action: z.object({
          type: z.enum(['buy', 'sell', 'skip', 'play_corporate_action']),
          symbol: z.string().optional(),
          quantity: z.number().optional(),
          corporateActionId: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const gameService = new GameService(ctx.prisma)
      const result = await gameService.executeTrade(input.gameId, input.action)
      return result
    }),

  // End turn
  endTurn: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const gameService = new GameService(ctx.prisma)
      const result = await gameService.endTurn(input.gameId)
      return result
    }),

  // Get player rankings
  getPlayerRankings: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input, ctx }) => {
      const game = await ctx.prisma.game.findUnique({
        where: { id: input.gameId },
        include: {
          players: {
            include: {
              portfolio: true,
            },
          },
          stocks: true,
        },
      })

      if (!game) throw new Error('Game not found')

      const rankings = game.players.map((player) => {
        const portfolioValue = player.portfolio.reduce((total, holding) => {
          const stock = game.stocks.find((s) => s.symbol === holding.symbol)
          return total + (stock ? stock.price * holding.quantity : 0)
        }, 0)

        return {
          player: {
            id: player.id,
            name: player.name,
            cash: player.cash,
            portfolio: player.portfolio.map((h) => ({
              symbol: h.symbol,
              quantity: h.quantity,
              averageCost: h.averageCost,
            })),
            actionHistory: [],
            events: [],
            corporateActions: [],
          },
          totalValue: player.cash + portfolioValue,
        }
      })

      rankings.sort((a, b) => b.totalValue - a.totalValue)

      return rankings.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))
    }),

  // Get active rights issues for current player
  getActiveRightsIssues: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input, ctx }) => {
      const gameService = new GameService(ctx.prisma)
      const activeRightsIssues = await gameService.getActiveRightsIssues(input.gameId)
      return activeRightsIssues
    }),

  // Get unplayed corporate actions
  getUnplayedCorporateActions: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input, ctx }) => {
      const game = await ctx.prisma.game.findUnique({
        where: { id: input.gameId },
        include: {
          players: {
            include: {
              corporateActions: true,
            },
          },
        },
      })

      if (!game) throw new Error('Game not found')

      const currentPlayer = game.players[game.currentPlayerIndex]
      const unplayedActions = currentPlayer.corporateActions
        .filter((action) => !action.played)
        .map((action) => ({
          id: action.actionId,
          type: action.type,
          symbol: action.symbol,
          title: action.title,
          description: action.description,
          details: JSON.parse(action.details),
          round: action.round,
          playersProcessed: JSON.parse(action.playersProcessed),
          playerId: action.playerId,
          played: action.played,
        }))

      return unplayedActions
    }),

  // Get portfolio data with calculations
  getPortfolioData: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input, ctx }) => {
      const uiDataService = new UIDataService(ctx.prisma)
      return await uiDataService.getPortfolioData(input.gameId)
    }),

  // Validate trade
  validateTrade: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        type: z.enum(['buy', 'sell']),
        symbol: z.string(),
        quantity: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const uiDataService = new UIDataService(ctx.prisma)
      return await uiDataService.validateTrade(input.gameId, input.type, input.symbol, input.quantity)
    }),

  // Get corporate action preview
  getCorporateActionPreview: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        corporateActionId: z.string(),
        stockSymbol: z.string(),
        quantity: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const uiDataService = new UIDataService(ctx.prisma)
      return await uiDataService.getCorporateActionPreview(
        input.gameId,
        input.corporateActionId,
        input.stockSymbol,
        input.quantity
      )
    }),
})
