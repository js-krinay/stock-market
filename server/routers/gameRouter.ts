import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { ServiceContainer } from '../container'

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
  getGameState: publicProcedure.input(z.object({ gameId: z.string() })).query(async ({ input }) => {
    const gameService = ServiceContainer.getInstance().getGameService()
    return await gameService.getGameState(input.gameId)
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
      return await gameService.executeTrade(input.gameId, input.action)
    }),

  // End turn
  endTurn: publicProcedure.input(z.object({ gameId: z.string() })).mutation(async ({ input }) => {
    const gameService = ServiceContainer.getInstance().getGameService()
    return await gameService.endTurn(input.gameId)
  }),

  // Get player rankings
  getPlayerRankings: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const uiDataService = ServiceContainer.getInstance().getUIDataService()
      return await uiDataService.getPlayerRankings(input.gameId)
    }),

  // Get leadership opportunities grouped by leader (for pagination)
  getLeadershipOpportunitiesGrouped: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const leadershipService = ServiceContainer.getInstance().getLeadershipService()
      return await leadershipService.getLeadershipOpportunitiesGrouped(input.gameId)
    }),

  // Exclude event by leader (chairman or director)
  excludeEvent: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        eventId: z.string(),
        leaderId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const leadershipService = ServiceContainer.getInstance().getLeadershipService()
      await leadershipService.excludeEvent(input.gameId, input.eventId, input.leaderId)
      return { success: true }
    }),

  // Advance to next leader in sequence
  advanceToNextLeader: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input }) => {
      const leadershipService = ServiceContainer.getInstance().getLeadershipService()
      return await leadershipService.advanceToNextLeader(input.gameId)
    }),

  // Complete leadership phase and process round
  completeLeadershipPhase: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
      await gameService.completeLeadershipPhase(input.gameId)
      return { success: true }
    }),

  // Get active rights issues for current player
  getActiveRightsIssues: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const gameService = ServiceContainer.getInstance().getGameService()
      return await gameService.getActiveRightsIssues(input.gameId)
    }),

  // Get unplayed corporate actions
  getUnplayedCorporateActions: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const uiDataService = ServiceContainer.getInstance().getUIDataService()
      return await uiDataService.getUnplayedCorporateActions(input.gameId)
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
