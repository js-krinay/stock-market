import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { ServiceContainer } from '../container'
import { Errors } from '../errors'

export const gameRouter = router({
  // Create a new game
  createGame: publicProcedure
    .input(
      z.object({
        playerNames: z.array(z.string()).min(1).max(4),
        maxRounds: z.number().min(1).max(50).default(10),
      })
    )
    .mutation(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
      const gameId = await gameService.createGame(input.playerNames, input.maxRounds)
      return { gameId }
    }),

  // Get game state
  getGameState: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
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
    .mutation(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
      const result = await gameService.executeTrade(input.gameId, input.action)
      return result
    }),

  // End turn
  endTurn: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
      const result = await gameService.endTurn(input.gameId)
      return result
    }),

  // Get player rankings
  getPlayerRankings: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const uiDataService = ServiceContainer.getInstance().getUIDataService()
      return await uiDataService.getPlayerRankings(input.gameId)
    }),

  // Get active rights issues for current player
  getActiveRightsIssues: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
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

      if (!game) throw Errors.gameNotFound(input.gameId)

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
    .query(async ({ input }) => {
      const uiDataService = ServiceContainer.getInstance().getUIDataService()
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
    .query(async ({ input }) => {
      const uiDataService = ServiceContainer.getInstance().getUIDataService()
      return await uiDataService.validateTrade(
        input.gameId,
        input.type,
        input.symbol,
        input.quantity
      )
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
    .query(async ({ input }) => {
      const uiDataService = ServiceContainer.getInstance().getUIDataService()
      return await uiDataService.getCorporateActionPreview(
        input.gameId,
        input.corporateActionId,
        input.stockSymbol,
        input.quantity
      )
    }),
})
