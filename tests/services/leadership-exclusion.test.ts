import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { LeadershipExclusionService } from '../../server/services/leadershipExclusionService'
import { TurnManager } from '../../server/services/turnManager'
import { RoundProcessor } from '../../server/services/roundProcessor'
import { CardManager } from '../../server/services/cardManager'
import { GameService } from '../../server/services/gameService'

describe('Leadership Exclusion Integration Tests', () => {
  let prisma: PrismaClient
  let leadershipService: LeadershipExclusionService
  let turnManager: TurnManager
  let roundProcessor: RoundProcessor
  let cardManager: CardManager
  let gameService: GameService

  beforeEach(async () => {
    process.env.DATABASE_URL = 'file:./test-leadership.db'

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./test-leadership.db',
        },
      },
    })

    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: 'file:./test-leadership.db' },
      stdio: 'ignore',
    })

    leadershipService = new LeadershipExclusionService(prisma)
    cardManager = new CardManager(prisma)
    roundProcessor = new RoundProcessor(prisma)
    turnManager = new TurnManager(prisma, leadershipService)
    gameService = new GameService(prisma)
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  async function setupTestGame(config: { players: string[] }): Promise<string> {
    const gameId = await gameService.createGame(config.players, 5)
    return gameId
  }

  async function makePlayerChairmanOfStock(
    gameId: string,
    playerName: string,
    symbol: string
  ): Promise<void> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true, stocks: true },
    })
    if (!game) throw new Error('Game not found')

    const player = game.players.find((p) => p.name === playerName)
    const stock = game.stocks.find((s) => s.symbol === symbol)
    if (!player || !stock) throw new Error('Player or stock not found')

    const quantity = Math.ceil(stock.totalQuantity * 0.6) // 60% ownership

    await prisma.stockHolding.deleteMany({
      where: {
        playerId: player.id,
        symbol,
      },
    })

    await prisma.stockHolding.create({
      data: {
        playerId: player.id,
        symbol,
        stockId: stock.id,
        quantity,
        averageCost: stock.price,
      },
    })

    await prisma.stock.update({
      where: { gameId_symbol: { gameId, symbol } },
      data: { chairmanId: player.id },
    })
  }

  async function makePlayerDirectorOfStock(
    gameId: string,
    playerName: string,
    symbol: string
  ): Promise<void> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true, stocks: true },
    })
    if (!game) throw new Error('Game not found')

    const player = game.players.find((p) => p.name === playerName)
    const stock = game.stocks.find((s) => s.symbol === symbol)
    if (!player || !stock) throw new Error('Player or stock not found')

    const quantity = Math.ceil(stock.totalQuantity * 0.4) // 40% ownership

    await prisma.stockHolding.deleteMany({
      where: {
        playerId: player.id,
        symbol,
      },
    })

    await prisma.stockHolding.create({
      data: {
        playerId: player.id,
        symbol,
        stockId: stock.id,
        quantity,
        averageCost: stock.price,
      },
    })

    await prisma.stock.update({
      where: { gameId_symbol: { gameId, symbol } },
      data: { directorId: player.id, chairmanId: null },
    })
  }

  async function generateEventsForPlayer(
    gameId: string,
    playerName: string,
    stockSymbol: string,
    count: number = 1
  ): Promise<string[]> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    })
    if (!game) throw new Error('Game not found')

    const player = game.players.find((p) => p.name === playerName)
    if (!player) throw new Error('Player not found')

    const eventIds: string[] = []

    for (let i = 0; i < count; i++) {
      const event = await prisma.marketEvent.create({
        data: {
          gameId,
          playerId: player.id,
          eventId: `test-event-${stockSymbol}-${i + 1}`,
          round: game.currentRound,
          turn: game.currentTurnInRound,
          title: `Test Event ${i + 1} for ${stockSymbol}`,
          description: 'Test event description',
          affectedStocks: JSON.stringify([stockSymbol]),
          type: 'positive',
          severity: 'medium',
          impact: 7,
          actualImpact: JSON.stringify({ [stockSymbol]: 7 }),
          priceDiff: JSON.stringify({ [stockSymbol]: 3.5 }),
        },
      })
      eventIds.push(event.id)
    }

    return eventIds
  }

  async function setLeadershipPhase(gameId: string): Promise<void> {
    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game) throw new Error('Game not found')

    await prisma.game.update({
      where: { id: gameId },
      data: { currentTurnInRound: game.turnsPerRound + 1 },
    })
  }

  // ============================================================================
  // LEADERSHIPEXCLUSIONSERVICE - OPPORTUNITY DETECTION
  // ============================================================================

  describe('LeadershipExclusionService - Opportunity Detection', () => {
    it('should detect chairman opportunities', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)

      expect(opportunities.length).toBeGreaterThan(0)
      const techOpp = opportunities.find((o) => o.stockSymbol === 'TECH')
      expect(techOpp).toBeDefined()
      expect(techOpp!.leaderType).toBe('chairman')
      expect(techOpp!.leaderName).toBe('Alice')
      expect(techOpp!.canExcludeFromAllPlayers).toBe(true)
      expect(techOpp!.eligibleEvents.length).toBeGreaterThan(0) // Has events
    })

    it('should detect director opportunities (no chairman)', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')
      await generateEventsForPlayer(gameId, 'Bob', 'BANK', 2) // Create events for BANK

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)

      expect(opportunities.length).toBeGreaterThan(0)
      const bankOpp = opportunities.find((o) => o.stockSymbol === 'BANK')
      expect(bankOpp).toBeDefined()
      expect(bankOpp!.leaderType).toBe('director')
      expect(bankOpp!.leaderName).toBe('Bob')
      expect(bankOpp!.canExcludeFromAllPlayers).toBe(false)
    })

    it('should return empty array when no leaders exist', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)

      expect(opportunities).toHaveLength(0)
    })

    it('chairman should see ALL events affecting their stock', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob', 'Charlie'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)

      const techOpp = opportunities.find((o) => o.stockSymbol === 'TECH')
      expect(techOpp).toBeDefined()
      expect(techOpp!.canExcludeFromAllPlayers).toBe(true) // Chairman power
      expect(techOpp!.eligibleEvents.length).toBeGreaterThan(0)
    })

    it('director should see ONLY own events', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      const bankOpp = opportunities.find((o) => o.stockSymbol === 'BANK')
      expect(bankOpp).toBeDefined()
      expect(bankOpp!.canExcludeFromAllPlayers).toBe(false) // Director limited power

      // ALL events must be Bob's (director can't see other players' events)
      bankOpp!.eligibleEvents.forEach((event) => {
        expect(event.playerId).toBe(bob!.id)
      })
    })

    it('director should NOT see other players events', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      const bankOpp = opportunities.find((o) => o.stockSymbol === 'BANK')
      expect(bankOpp).toBeDefined()

      // Verify ALL events belong to Bob (no Alice events)
      bankOpp!.eligibleEvents.forEach((event) => {
        expect(event.playerId).toBe(bob!.id)
      })
    })

    it('chairman takes priority over director', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await makePlayerDirectorOfStock(gameId, 'Bob', 'TECH')

      // Manually set chairman (Bob should not have director rights)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })
      await prisma.stock.update({
        where: { gameId_symbol: { gameId, symbol: 'TECH' } },
        data: { chairmanId: alice!.id },
      })

      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)

      const techOpp = opportunities.find((o) => o.stockSymbol === 'TECH')
      expect(techOpp).toBeDefined()
      expect(techOpp!.leaderName).toBe('Alice') // Chairman, not Bob
      expect(techOpp!.leaderType).toBe('chairman')
    })

    it('should filter out already excluded events', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)
      await generateEventsForPlayer(gameId, 'Alice', 'TECH', 3)

      // Get initial opportunities
      const initialOpps = await leadershipService.getLeadershipExclusionOpportunities(gameId)
      const techOpp = initialOpps.find((o) => o.stockSymbol === 'TECH')
      expect(techOpp).toBeDefined()

      const initialEventCount = techOpp!.eligibleEvents.length
      expect(initialEventCount).toBeGreaterThan(0)

      // Exclude one event
      const eventToExclude = techOpp!.eligibleEvents[0]
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      // Update event directly using its database ID
      await prisma.marketEvent.update({
        where: { id: eventToExclude.id },
        data: { excludedBy: alice!.id },
      })

      // Get opportunities again - should have one less event
      const newOpps = await leadershipService.getLeadershipExclusionOpportunities(gameId)
      const newTechOpp = newOpps.find((o) => o.stockSymbol === 'TECH')

      expect(newTechOpp!.eligibleEvents.length).toBe(initialEventCount - 1)
      expect(newTechOpp!.eligibleEvents.find((e) => e.id === eventToExclude.id)).toBeUndefined()
    })
  })

  // ============================================================================
  // LEADERSHIPEXCLUSIONSERVICE - EXCLUSION VALIDATION
  // ============================================================================

  describe('LeadershipExclusionService - Exclusion Validation', () => {
    it('VALIDATION 1: should throw eventNotFound when event does not exist', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)

      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      await expect(
        leadershipService.excludeEvent(gameId, 'non-existent-event', alice!.id)
      ).rejects.toThrow('Event')
    })

    it('VALIDATION 2: should throw eventAlreadyExcluded when event already excluded', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)

      const [eventId] = await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      // Exclude once
      await leadershipService.excludeEvent(gameId, eventId, alice!.id)

      // Try to exclude again
      await expect(leadershipService.excludeEvent(gameId, eventId, alice!.id)).rejects.toThrow(
        'already excluded'
      )
    })

    it('VALIDATION 3: should throw notLeaderOfAffectedStock when player is not leader', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)

      const [eventId] = await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      // Bob is not leader of TECH
      await expect(leadershipService.excludeEvent(gameId, eventId, bob!.id)).rejects.toThrow(
        'not chairman or director'
      )
    })

    it('VALIDATION 4: chairman should successfully exclude any event', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)

      const [aliceEventId] = await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      const [bobEventId] = await generateEventsForPlayer(gameId, 'Bob', 'TECH', 1)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      // Alice can exclude her own event
      await expect(
        leadershipService.excludeEvent(gameId, aliceEventId, alice!.id)
      ).resolves.not.toThrow()

      // Alice can also exclude Bob's event (chairman power)
      await expect(
        leadershipService.excludeEvent(gameId, bobEventId, alice!.id)
      ).resolves.not.toThrow()
    })

    it('VALIDATION 5: director only gets rights when chairmanId is null', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await makePlayerDirectorOfStock(gameId, 'Bob', 'TECH')
      await setLeadershipPhase(gameId)

      // Set chairman to Alice (Bob should not have director rights)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })
      await prisma.stock.update({
        where: { gameId_symbol: { gameId, symbol: 'TECH' } },
        data: { chairmanId: alice!.id },
      })

      const [bobEventId] = await generateEventsForPlayer(gameId, 'Bob', 'TECH', 1)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      // Bob should NOT be able to exclude (chairman takes priority)
      await expect(leadershipService.excludeEvent(gameId, bobEventId, bob!.id)).rejects.toThrow()
    })

    it('VALIDATION 6a: director succeeds when excluding own event', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')
      await setLeadershipPhase(gameId)

      const [bobEventId] = await generateEventsForPlayer(gameId, 'Bob', 'BANK', 1)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      await expect(
        leadershipService.excludeEvent(gameId, bobEventId, bob!.id)
      ).resolves.not.toThrow()

      const event = await prisma.marketEvent.findUnique({ where: { id: bobEventId } })
      expect(event?.excludedBy).toBe(bob!.id)
    })

    it('VALIDATION 6b: director fails when trying to exclude other player event', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')
      await setLeadershipPhase(gameId)

      const [aliceEventId] = await generateEventsForPlayer(gameId, 'Alice', 'BANK', 1)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      await expect(leadershipService.excludeEvent(gameId, aliceEventId, bob!.id)).rejects.toThrow(
        'can only exclude events from their own hand'
      )
    })

    it('should log exclusion with correct leader label', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)

      const [eventId] = await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      await leadershipService.excludeEvent(gameId, eventId, alice!.id)

      const log = await prisma.turnAction.findFirst({
        where: { actionType: 'event_excluded' },
      })

      expect(log).toBeDefined()
      expect(log?.result).toContain('Alice')
      expect(log?.result).toContain('Chairman')
      expect(log?.result).toContain('excluded event')
    })
  })

  // ============================================================================
  // TURNMANAGER - LEADERSHIP PHASE DETECTION
  // ============================================================================

  describe('TurnManager - Leadership Phase Detection', () => {
    it('should signal leadership phase when chairman exists', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')

      // Complete all turns (the LAST endTurn call triggers leadership phase check)
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      })
      const totalTurns = game!.turnsPerRound * game!.players.length

      let result: any
      for (let i = 0; i < totalTurns; i++) {
        result = await turnManager.endTurn(gameId)
      }

      // The last endTurn should have triggered leadership phase
      expect(result.leadershipPhaseRequired).toBe(true)
      expect(result.leaders).toBeDefined()
      expect(result.leaders!.length).toBeGreaterThan(0)
    })

    it('should signal leadership phase when director exists (no chairman)', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      })
      const totalTurns = game!.turnsPerRound * game!.players.length

      let result: any
      for (let i = 0; i < totalTurns; i++) {
        result = await turnManager.endTurn(gameId)
      }

      expect(result.leadershipPhaseRequired).toBe(true)
      expect(result.leaders).toBeDefined()
    })

    it('should return leadership information with correct types', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      })
      const totalTurns = game!.turnsPerRound * game!.players.length

      let result: any
      for (let i = 0; i < totalTurns; i++) {
        result = await turnManager.endTurn(gameId)
      }

      expect(result.leaders![0].stocks[0].leaderType).toBe('chairman')
    })

    it('should proceed normally when no leaders exist', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      })
      const totalTurns = game!.turnsPerRound * game!.players.length

      let result: any
      for (let i = 0; i < totalTurns; i++) {
        result = await turnManager.endTurn(gameId)
      }

      expect(result.leadershipPhaseRequired).toBeUndefined()
      expect(result.roundEnded).toBe(true)
    })

    it('should handle multiple leaders correctly', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      })
      const totalTurns = game!.turnsPerRound * game!.players.length

      let result: any
      for (let i = 0; i < totalTurns; i++) {
        result = await turnManager.endTurn(gameId)
      }

      expect(result.leadershipPhaseRequired).toBe(true)
      expect(result.leaders!.length).toBe(2)
    })
  })

  // ============================================================================
  // END-TO-END WORKFLOWS
  // ============================================================================

  describe('End-to-End Workflows', () => {
    it('complete chairman exclusion workflow', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await setLeadershipPhase(gameId)

      const [eventId] = await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      // 1. Get opportunities
      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)
      expect(opportunities.length).toBeGreaterThan(0)

      // 2. Exclude event
      await leadershipService.excludeEvent(gameId, eventId, alice!.id)

      // 3. Verify exclusion
      const event = await prisma.marketEvent.findUnique({ where: { id: eventId } })
      expect(event?.excludedBy).toBe(alice!.id)

      // 4. Verify log
      const log = await prisma.turnAction.findFirst({
        where: { actionType: 'event_excluded' },
      })
      expect(log).toBeDefined()
    })

    it('complete director exclusion workflow', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')
      await setLeadershipPhase(gameId)

      const [eventId] = await generateEventsForPlayer(gameId, 'Bob', 'BANK', 1)
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      // 1. Get opportunities (should only see own events)
      const opportunities = await leadershipService.getLeadershipExclusionOpportunities(gameId)
      const bankOpp = opportunities.find((o) => o.stockSymbol === 'BANK')
      expect(bankOpp!.canExcludeFromAllPlayers).toBe(false)

      // 2. Exclude own event
      await leadershipService.excludeEvent(gameId, eventId, bob!.id)

      // 3. Verify exclusion
      const event = await prisma.marketEvent.findUnique({ where: { id: eventId } })
      expect(event?.excludedBy).toBe(bob!.id)
    })

    it('mixed chairman/director scenario', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await makePlayerDirectorOfStock(gameId, 'Bob', 'BANK')
      await setLeadershipPhase(gameId)

      const [techEventId] = await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      const [bankEventId] = await generateEventsForPlayer(gameId, 'Bob', 'BANK', 1)
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      // Both exclude their events
      await leadershipService.excludeEvent(gameId, techEventId, alice!.id)
      await leadershipService.excludeEvent(gameId, bankEventId, bob!.id)

      // Verify both exclusions
      const techEvent = await prisma.marketEvent.findUnique({ where: { id: techEventId } })
      const bankEvent = await prisma.marketEvent.findUnique({ where: { id: bankEventId } })
      expect(techEvent?.excludedBy).toBe(alice!.id)
      expect(bankEvent?.excludedBy).toBe(bob!.id)
    })
  })

  // ============================================================================
  // LEADERSHIP PAGINATION TESTS
  // ============================================================================

  describe('Leadership Pagination', () => {
    it('should initialize leadership phase with ordered leader IDs', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob', 'Charlie'] })
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      await leadershipService.initializeLeadershipPhase(gameId, [alice!.id, bob!.id])

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      expect(game?.leadershipExclusionStatus).toBeTruthy()

      const status = JSON.parse(game!.leadershipExclusionStatus!)
      expect(status.phase).toBe('active')
      expect(status.currentLeaderIndex).toBe(0)
      expect(status.totalLeaders).toBe(2)
      expect(status.leaderIds).toEqual([alice!.id, bob!.id])
      expect(status.completedLeaderIds).toEqual([])
    })

    it('should group opportunities by leader in sequence', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await makePlayerChairmanOfStock(gameId, 'Bob', 'BANK')
      await setLeadershipPhase(gameId)

      await generateEventsForPlayer(gameId, 'Alice', 'TECH', 2)
      await generateEventsForPlayer(gameId, 'Bob', 'BANK', 2)

      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      // Initialize phase
      await leadershipService.initializeLeadershipPhase(gameId, [alice!.id, bob!.id])

      // Get grouped opportunities
      const grouped = await leadershipService.getLeadershipOpportunitiesGrouped(gameId)

      expect(grouped).toHaveLength(2)
      expect(grouped[0].leaderId).toBe(alice!.id)
      expect(grouped[0].leaderName).toBe('Alice')
      expect(grouped[0].leaderIndex).toBe(0)
      expect(grouped[0].totalLeaders).toBe(2)
      expect(grouped[0].opportunities).toHaveLength(1) // 1 stock (TECH)

      expect(grouped[1].leaderId).toBe(bob!.id)
      expect(grouped[1].leaderName).toBe('Bob')
      expect(grouped[1].leaderIndex).toBe(1)
      expect(grouped[1].totalLeaders).toBe(2)
      expect(grouped[1].opportunities).toHaveLength(1) // 1 stock (BANK)
    })

    it('should advance to next leader in sequence', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob', 'Charlie'] })
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })
      const bob = await prisma.player.findFirst({ where: { name: 'Bob', gameId } })

      await leadershipService.initializeLeadershipPhase(gameId, [alice!.id, bob!.id])

      // Advance from Alice to Bob
      const result1 = await leadershipService.advanceToNextLeader(gameId)
      expect(result1.completed).toBe(false)
      expect(result1.nextLeaderIndex).toBe(1)

      const game1 = await prisma.game.findUnique({ where: { id: gameId } })
      const status1 = JSON.parse(game1!.leadershipExclusionStatus!)
      expect(status1.currentLeaderIndex).toBe(1)
      expect(status1.completedLeaderIds).toEqual([alice!.id])

      // Advance from Bob (last leader) - should complete
      const result2 = await leadershipService.advanceToNextLeader(gameId)
      expect(result2.completed).toBe(true)
      expect(result2.nextLeaderIndex).toBeUndefined()

      const game2 = await prisma.game.findUnique({ where: { id: gameId } })
      const status2 = JSON.parse(game2!.leadershipExclusionStatus!)
      expect(status2.phase).toBe('completed')
      expect(status2.completedLeaderIds).toEqual([alice!.id, bob!.id])
    })

    it('should complete leadership phase and clear status', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      await leadershipService.initializeLeadershipPhase(gameId, [alice!.id])

      // Verify status exists
      const game1 = await prisma.game.findUnique({ where: { id: gameId } })
      expect(game1?.leadershipExclusionStatus).toBeTruthy()

      // Complete phase
      await leadershipService.completeLeadershipPhase(gameId)

      // Verify status is cleared
      const game2 = await prisma.game.findUnique({ where: { id: gameId } })
      expect(game2?.leadershipExclusionStatus).toBeNull()
    })

    it('should throw error when getting grouped opportunities with no active phase', async () => {
      const gameId = await setupTestGame({ players: ['Alice'] })

      await expect(leadershipService.getLeadershipOpportunitiesGrouped(gameId)).rejects.toThrow(
        'Leadership phase not active'
      )
    })

    it('should throw error when advancing with no active phase', async () => {
      const gameId = await setupTestGame({ players: ['Alice'] })

      await expect(leadershipService.advanceToNextLeader(gameId)).rejects.toThrow(
        'Leadership phase not active'
      )
    })

    it('should handle leader with multiple stocks', async () => {
      const gameId = await setupTestGame({ players: ['Alice', 'Bob'] })
      await makePlayerChairmanOfStock(gameId, 'Alice', 'TECH')
      await makePlayerChairmanOfStock(gameId, 'Alice', 'BANK')
      await setLeadershipPhase(gameId)

      await generateEventsForPlayer(gameId, 'Alice', 'TECH', 1)
      await generateEventsForPlayer(gameId, 'Bob', 'BANK', 1)

      const alice = await prisma.player.findFirst({ where: { name: 'Alice', gameId } })

      await leadershipService.initializeLeadershipPhase(gameId, [alice!.id])

      const grouped = await leadershipService.getLeadershipOpportunitiesGrouped(gameId)

      expect(grouped).toHaveLength(1)
      expect(grouped[0].leaderId).toBe(alice!.id)
      expect(grouped[0].opportunities).toHaveLength(2) // 2 stocks (TECH, BANK)
    })
  })
})
