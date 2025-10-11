import type { PrismaClient } from '@prisma/client'
import type {
  ILeadershipExclusionService,
  LeadershipExclusionOpportunity,
  LeaderOpportunityGroup,
} from '../interfaces/ILeadershipExclusionService'
import type { MarketEvent, LeadershipExclusionStatus } from '../types/'
import { mapDbEventToAppEvent } from './mappers'
import { Errors } from '../errors'

export class LeadershipExclusionService implements ILeadershipExclusionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all exclusion opportunities for current round
   * Returns opportunities grouped by stock and leader (chairman or director)
   *
   * Leadership hierarchy:
   * - Chairman (≥50%): Sees ALL events affecting their stock (any player)
   * - Director (25-49%, no chairman): Sees ONLY their own events
   */
  async getLeadershipExclusionOpportunities(
    gameId: string
  ): Promise<LeadershipExclusionOpportunity[]> {
    // 1. Load game with current round info
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) throw Errors.gameNotFound(gameId)

    // 2. Load all stocks that have chairmen OR directors
    const stocks = await this.prisma.stock.findMany({
      where: {
        gameId,
        OR: [{ chairmanId: { not: null } }, { directorId: { not: null } }],
      },
      include: {
        chairman: true,
        director: true,
      },
    })

    if (stocks.length === 0) return []

    // 3. Load all events for current round that haven't been excluded
    const events = await this.prisma.marketEvent.findMany({
      where: {
        gameId,
        round: game.currentRound,
        excludedBy: null, // Only non-excluded events
      },
      include: {
        player: true,
      },
    })

    // 4. Group events by stock symbol
    const eventsByStock = new Map<string, MarketEvent[]>()

    for (const event of events) {
      const affectedStocks = JSON.parse(event.affectedStocks) as string[]

      for (const stockSymbol of affectedStocks) {
        if (!eventsByStock.has(stockSymbol)) {
          eventsByStock.set(stockSymbol, [])
        }
        eventsByStock.get(stockSymbol)!.push(mapDbEventToAppEvent(event))
      }
    }

    // 5. Build opportunities for each stock with a leader
    const opportunities: LeadershipExclusionOpportunity[] = []

    for (const stock of stocks) {
      const affectingEvents = eventsByStock.get(stock.symbol) || []

      if (affectingEvents.length === 0) continue

      // Chairman has priority - director only gets rights if no chairman
      if (stock.chairmanId && stock.chairman) {
        // CHAIRMAN: Can exclude ANY event affecting their stock
        opportunities.push({
          stockSymbol: stock.symbol,
          stockName: stock.name,
          stockColor: stock.color,
          leaderId: stock.chairman.id,
          leaderName: stock.chairman.name,
          leaderType: 'chairman',
          canExcludeFromAllPlayers: true,
          eligibleEvents: affectingEvents, // All events affecting this stock
        })
      } else if (stock.directorId && stock.director) {
        // DIRECTOR: Can ONLY exclude events from their own hand
        const directorOwnEvents = affectingEvents.filter(
          (event) => event.playerId === stock.directorId
        )

        if (directorOwnEvents.length > 0) {
          opportunities.push({
            stockSymbol: stock.symbol,
            stockName: stock.name,
            stockColor: stock.color,
            leaderId: stock.director.id,
            leaderName: stock.director.name,
            leaderType: 'director',
            canExcludeFromAllPlayers: false,
            eligibleEvents: directorOwnEvents, // Only director's own events
          })
        }
      }
    }

    return opportunities
  }

  /**
   * Initialize leadership phase with ordered leader IDs
   */
  async initializeLeadershipPhase(gameId: string, leaderIds: string[]): Promise<void> {
    const status: LeadershipExclusionStatus = {
      phase: 'active',
      currentLeaderIndex: 0,
      totalLeaders: leaderIds.length,
      leaderIds,
      completedLeaderIds: [],
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        leadershipExclusionStatus: JSON.stringify(status),
      },
    })
  }

  /**
   * Get leadership opportunities grouped by leader in sequence
   */
  async getLeadershipOpportunitiesGrouped(gameId: string): Promise<LeaderOpportunityGroup[]> {
    // 1. Get game with leadership status
    const game = await this.prisma.game.findUnique({ where: { id: gameId } })
    if (!game?.leadershipExclusionStatus) {
      throw Errors.leadershipPhaseNotActive()
    }

    const status = JSON.parse(game.leadershipExclusionStatus) as LeadershipExclusionStatus

    // 2. Get all opportunities (using existing method)
    const allOpportunities = await this.getLeadershipExclusionOpportunities(gameId)

    // 3. Group by leaderId in the order specified by status.leaderIds
    const grouped: LeaderOpportunityGroup[] = []

    for (let i = 0; i < status.leaderIds.length; i++) {
      const leaderId = status.leaderIds[i]
      const leaderOpportunities = allOpportunities.filter((opp) => opp.leaderId === leaderId)

      if (leaderOpportunities.length > 0) {
        const firstOpp = leaderOpportunities[0]
        grouped.push({
          leaderId,
          leaderName: firstOpp.leaderName,
          leaderIndex: i,
          totalLeaders: status.totalLeaders,
          opportunities: leaderOpportunities,
        })
      }
    }

    return grouped
  }

  /**
   * Advance to the next leader in sequence
   */
  async advanceToNextLeader(
    gameId: string
  ): Promise<{ completed: boolean; nextLeaderIndex?: number }> {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } })
    if (!game?.leadershipExclusionStatus) {
      throw Errors.leadershipPhaseNotActive()
    }

    const status = JSON.parse(game.leadershipExclusionStatus) as LeadershipExclusionStatus
    const currentLeaderId = status.leaderIds[status.currentLeaderIndex]

    // Mark current leader as completed
    const updatedCompleted = [...status.completedLeaderIds, currentLeaderId]

    // Check if this was the last leader
    const nextIndex = status.currentLeaderIndex + 1
    const isComplete = nextIndex >= status.totalLeaders

    if (isComplete) {
      // Mark phase as completed
      const updatedStatus: LeadershipExclusionStatus = {
        ...status,
        phase: 'completed',
        completedLeaderIds: updatedCompleted,
      }

      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          leadershipExclusionStatus: JSON.stringify(updatedStatus),
        },
      })
      return { completed: true }
    } else {
      // Advance to next leader
      const updatedStatus: LeadershipExclusionStatus = {
        ...status,
        currentLeaderIndex: nextIndex,
        completedLeaderIds: updatedCompleted,
      }

      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          leadershipExclusionStatus: JSON.stringify(updatedStatus),
        },
      })
      return { completed: false, nextLeaderIndex: nextIndex }
    }
  }

  /**
   * Complete leadership phase and clear status
   */
  async completeLeadershipPhase(gameId: string): Promise<void> {
    // Clear leadership status
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        leadershipExclusionStatus: null,
      },
    })
  }

  /**
   * Exclude a specific event by leader (chairman or director)
   * Updates MarketEvent.excludedBy field and logs action
   *
   * Validation performed:
   * 1. Game exists and get current round and turn
   * 2. Ensure all the turns are completed
   * 3. Event exists and belongs to current round
   * 4. Event is not already excluded
   * 5. Player is chairman or director of at least one affected stock
   * 6. Chairman: Can exclude ANY event affecting their stock
   * 7. Director: Can ONLY exclude events from their own hand (playerId check)
   * 8. Director: Only has rights when no chairman exists for that stock
   */
  async excludeEvent(gameId: string, eventId: string, leaderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // ✅ VALIDATION 1: Game exists and get current round and turn
      const game = await tx.game.findUnique({
        where: { id: gameId },
      })

      if (!game) throw Errors.gameNotFound(gameId)

      // ✅ VALIDATION 2: Ensure all turns are completed (leadership phase detection)
      // Leadership phase happens when currentTurnInRound > turnsPerRound (sentinel value: 4)
      if (game.currentTurnInRound <= game.turnsPerRound) {
        throw Errors.leadershipPhaseNotActive()
      }

      // ✅ VALIDATION 3: Event exists and belongs to current round
      const event = await tx.marketEvent.findUnique({
        where: { id: eventId },
      })

      if (!event) throw Errors.eventNotFound(eventId)

      if (event.round !== game.currentRound) {
        throw Errors.eventWrongRound(event.round, game.currentRound)
      }

      // ✅ VALIDATION 4: Event not already excluded
      if (event.excludedBy) throw Errors.eventAlreadyExcluded(eventId)

      const affectedStocks = JSON.parse(event.affectedStocks) as string[]

      // ✅ VALIDATION 5-8: Leadership status and exclusion rights
      // This checks:
      // - Player is leader (chairman or director) of affected stock
      // - Director only has rights when no chairman exists
      // - Director can only exclude their own events
      const leaderType = await this.validateExclusion(
        leaderId,
        affectedStocks,
        event.playerId,
        gameId,
        tx
      )

      // Update event with excludedBy
      await tx.marketEvent.update({
        where: { id: eventId },
        data: { excludedBy: leaderId },
      })

      // Log the exclusion action
      const leader = await tx.player.findUnique({ where: { id: leaderId } })

      if (leader) {
        const leaderLabel = leaderType === 'chairman' ? 'Chairman' : 'Director'
        await tx.turnAction.create({
          data: {
            round: game.currentRound,
            turn: game.currentTurnInRound,
            actionType: 'event_excluded',
            symbol: event.affectedStocks, // JSON string of affected stocks
            result: `${leader.name} (${leaderLabel}) excluded event: ${event.title}`,
            playerId: leaderId,
          },
        })
      }
    })
  }

  /**
   * Validate that player is leader of at least one affected stock
   * and has proper exclusion rights based on leadership type
   *
   * Validation logic:
   * 1. Check if player is chairman of any affected stock
   *    - If yes: Allow exclusion of ANY event affecting their stock
   * 2. If not chairman, check if player is director of any affected stock
   *    - Requires: chairmanId must be null (director only has rights when no chairman)
   *    - If yes: Only allow exclusion if event belongs to director (playerId check)
   * 3. If neither: Throw error (player is not leader of affected stock)
   *
   * @private
   * @returns 'chairman' | 'director'
   * @throws Error if player is not leader or doesn't have exclusion rights
   */
  private async validateExclusion(
    leaderId: string,
    affectedStocks: string[],
    eventPlayerId: string,
    gameId: string,
    tx: any
  ): Promise<'chairman' | 'director'> {
    // VALIDATION 1: Check if player is chairman of any affected stock
    const chairmanStocks = await tx.stock.findMany({
      where: {
        gameId,
        symbol: { in: affectedStocks },
        chairmanId: leaderId,
      },
    })

    if (chairmanStocks.length > 0) {
      // ✅ Chairman can exclude ANY event affecting their stock (no playerId check needed)
      return 'chairman'
    }

    // VALIDATION 2: Check if player is director of any affected stock
    // Important: chairmanId must be null (director only has rights when no chairman)
    const directorStocks = await tx.stock.findMany({
      where: {
        gameId,
        symbol: { in: affectedStocks },
        directorId: leaderId,
        chairmanId: null, // ✅ Director only has rights when no chairman
      },
    })

    if (directorStocks.length > 0) {
      // VALIDATION 3: Director can ONLY exclude their own events
      if (eventPlayerId !== leaderId) {
        throw Errors.directorCanOnlyExcludeOwnEvents(leaderId, eventPlayerId)
      }
      // ✅ Director validated: is director AND event is their own
      return 'director'
    }

    // VALIDATION FAILED: Player is not leader of any affected stock
    throw Errors.notLeaderOfAffectedStock(leaderId, affectedStocks)
  }
}
