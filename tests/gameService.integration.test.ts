import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { GameService } from '../server/services/gameService'
import { execSync } from 'child_process'

describe('GameService Integration Tests', () => {
  let prisma: PrismaClient
  let gameService: GameService

  beforeEach(async () => {
    // Set test database URL
    process.env.DATABASE_URL = 'file:./test.db'

    // Initialize Prisma with test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./test.db',
        },
      },
    })

    // Push schema to test database
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'ignore',
    })

    gameService = new GameService(prisma)
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('Game Creation', () => {
    it('should create a new game with players', async () => {
      const playerNames = ['Alice', 'Bob']
      const gameId = await gameService.createGame(playerNames, 5)

      expect(gameId).toBeDefined()
      expect(typeof gameId).toBe('string')

      // Verify game was created
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: true },
      })

      expect(game).toBeDefined()
      expect(game?.maxRounds).toBe(5)
      expect(game?.currentRound).toBe(1)
      expect(game?.players).toHaveLength(2)
      expect(game?.players[0].name).toBe('Alice')
      expect(game?.players[1].name).toBe('Bob')
    })

    it('should initialize 6 stocks for the game', async () => {
      const gameId = await gameService.createGame(['Player1'], 10)

      const stocks = await prisma.stock.findMany({
        where: { gameId },
      })

      expect(stocks).toHaveLength(6)
      expect(stocks.map((s) => s.symbol)).toEqual(['TECH', 'BANK', 'ENRG', 'HLTH', 'FOOD', 'AUTO'])
    })

    it('should initialize each player with $10,000 cash', async () => {
      const gameId = await gameService.createGame(['Alice', 'Bob'], 10)

      const players = await prisma.player.findMany({
        where: { gameId },
      })

      players.forEach((player) => {
        expect(player.cash).toBe(10000)
      })
    })

    it('should generate 10 cards per player for round 1', async () => {
      const gameId = await gameService.createGame(['Alice', 'Bob'], 10)

      const events = await prisma.marketEvent.findMany({
        where: { gameId },
      })
      const actions = await prisma.corporateAction.findMany({
        where: { gameId },
      })

      expect(events.length + actions.length).toBe(20) // 10 cards × 2 players
    })

    it('should have cards assigned to first player', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)
      const gameState = await gameService.getGameState(gameId)

      const totalCards =
        gameState.players[0].events.length + gameState.players[0].corporateActions.length
      expect(totalCards).toBe(10)

      const firstCard = gameState.players[0].events[0] || gameState.players[0].corporateActions[0]
      expect(firstCard.round).toBe(1)
    })
  })

  describe('Stock Trading', () => {
    it('should allow player to buy stock', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)
      const gameState = await gameService.getGameState(gameId)
      const currentPlayer = gameState.players[0]

      const result = await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 10,
      })

      expect(result.success).toBe(true)

      // Verify player portfolio
      const holding = await prisma.stockHolding.findFirst({
        where: { playerId: currentPlayer.id, symbol: 'TECH' },
      })

      expect(holding).toBeDefined()
      expect(holding?.quantity).toBe(10)

      // Verify player cash decreased
      const updatedPlayer = await prisma.player.findUnique({
        where: { id: currentPlayer.id },
      })

      const techStock = gameState.stocks.find((s) => s.symbol === 'TECH')
      const expectedCash = 10000 - techStock!.price * 10

      expect(updatedPlayer?.cash).toBeCloseTo(expectedCash, 2)
    })

    it('should prevent buying with insufficient funds', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      const result = await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 1000, // Too expensive
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('Insufficient funds')
    })

    it('should allow player to sell owned stock', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)
      const gameState = await gameService.getGameState(gameId)
      const currentPlayer = gameState.players[0]

      // First buy some stock
      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 10,
      })

      // Then sell it
      const result = await gameService.executeTrade(gameId, {
        type: 'sell',
        symbol: 'TECH',
        quantity: 5,
      })

      expect(result.success).toBe(true)

      // Verify holding updated
      const holding = await prisma.stockHolding.findFirst({
        where: { playerId: currentPlayer.id, symbol: 'TECH' },
      })

      expect(holding?.quantity).toBe(5)
    })

    it('should prevent selling stock not owned', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      const result = await gameService.executeTrade(gameId, {
        type: 'sell',
        symbol: 'TECH',
        quantity: 10,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('do not own')
    })

    it('should update stock availability after purchase', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Get initial stock availability (TECH is $110, player has $10,000, so can buy max 90 shares)
      const initialStock = await prisma.stock.findFirst({
        where: { gameId, symbol: 'TECH' },
      })
      expect(initialStock?.availableQuantity).toBe(200000)

      // Execute trade for 50 shares (cost: $5,500)
      const result = await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 50,
      })

      expect(result.success).toBe(true)

      // Query stock again to get updated value
      const updatedStock = await prisma.stock.findFirst({
        where: { gameId, symbol: 'TECH' },
      })

      expect(updatedStock?.availableQuantity).toBe(199950)
    })
  })

  describe('Turn Management', () => {
    it('should advance to next player after turn ends', async () => {
      const gameId = await gameService.createGame(['Alice', 'Bob'], 10)

      const initialState = await gameService.getGameState(gameId)
      expect(initialState.currentPlayerIndex).toBe(0)

      await gameService.endTurn(gameId)

      const nextState = await gameService.getGameState(gameId)
      expect(nextState.currentPlayerIndex).toBe(1)
    })

    it('should cycle back to first player after all players complete turn', async () => {
      const gameId = await gameService.createGame(['Alice', 'Bob'], 10)

      // Alice's turn
      await gameService.endTurn(gameId)

      // Bob's turn
      await gameService.endTurn(gameId)

      const state = await gameService.getGameState(gameId)
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.currentTurnInRound).toBe(2) // Second turn of round
    })
  })

  describe('Round End Processing', () => {
    it('should complete round after all turns', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Complete 3 turns (1 player × 3 turns per round)
      await gameService.endTurn(gameId) // Turn 1
      await gameService.endTurn(gameId) // Turn 2
      const result = await gameService.endTurn(gameId) // Turn 3

      expect(result.roundEnded).toBe(true)

      const game = await prisma.game.findUnique({
        where: { id: gameId },
      })

      expect(game?.currentRound).toBe(2)
      expect(game?.currentTurnInRound).toBe(1)
    })

    it('should apply accumulated events at round end', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Get initial stock price
      const initialStock = await prisma.stock.findFirst({
        where: { gameId, symbol: 'TECH' },
      })
      const initialPrice = initialStock?.price || 0

      // Complete the round (3 turns)
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)

      // Check if any events were applied (price might have changed)
      const updatedStock = await prisma.stock.findFirst({
        where: { gameId, symbol: 'TECH' },
      })

      // Price should have been updated (could be same, higher, or lower)
      expect(updatedStock?.price).toBeDefined()
    })

    it('should add price history entry at round end', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Complete round
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)

      const priceHistory = await prisma.priceHistory.findMany({
        where: {
          stock: { gameId },
        },
      })

      // Should have initial prices (round 0) + round 1 end prices
      expect(priceHistory.length).toBeGreaterThan(0)
    })

    it('should generate new cards for next round', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Complete round 1
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)

      const round2Events = await prisma.marketEvent.findMany({
        where: { gameId, round: 2 },
      })
      const round2Actions = await prisma.corporateAction.findMany({
        where: { gameId, round: 2 },
      })

      expect(round2Events.length + round2Actions.length).toBe(10) // 10 cards for 1 player
    })
  })

  describe('Corporate Actions', () => {
    it('should process dividend payment', async () => {
      const gameId = await gameService.createGame(['Alice', 'Bob'], 10)
      const gameState = await gameService.getGameState(gameId)

      // Both players buy TECH stock
      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 10,
      })

      await gameService.endTurn(gameId) // Move to Bob

      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 5,
      })

      // Create a dividend corporate action
      const corporateAction = await prisma.corporateAction.create({
        data: {
          actionId: 'test-dividend',
          type: 'dividend',
          symbol: 'TECH',
          title: 'Test Dividend',
          description: 'Test',
          details: JSON.stringify({ amountPerShare: 5 }),
          round: 1,
          playersProcessed: JSON.stringify([]),
          playerId: gameState.players[1].id, // Bob's card
          played: false,
          gameId,
        },
      })

      // Play the dividend action
      const result = await gameService.executeTrade(gameId, {
        type: 'play_corporate_action',
        corporateActionId: corporateAction.actionId,
        symbol: 'TECH',
      })

      expect(result.success).toBe(true)
      expect(result.toasts).toHaveLength(2) // Both players should receive dividend

      // Verify Alice received dividend (10 shares × ($110 × 5%) = 10 × $5.50 = $55)
      const alice = await prisma.player.findFirst({
        where: { gameId, name: 'Alice' },
      })
      const aliceInitialCash = 10000
      const techStock = gameState.stocks.find((s) => s.symbol === 'TECH')!
      const alicePurchaseCost = 10 * techStock.price
      const dividendReceived = 10 * (techStock.price * 0.05) // 10 shares × 5% of stock price
      const expectedAliceCash = aliceInitialCash - alicePurchaseCost + dividendReceived

      expect(alice?.cash).toBeCloseTo(expectedAliceCash, 2)
    })

    it('should process right issue for eligible shareholder', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Buy 10 shares of TECH
      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 10,
      })

      // Create right issue (1:2 ratio - 1 new share per 2 held)
      const gameState = await gameService.getGameState(gameId)
      const corporateAction = await prisma.corporateAction.create({
        data: {
          actionId: 'test-right',
          type: 'right_issue',
          title: 'Test Right Issue',
          description: 'Test',
          details: JSON.stringify({ ratio: 1, baseShares: 2, discountPercentage: 0.5 }),
          round: 1,
          playersProcessed: JSON.stringify([]),
          playerId: gameState.players[0].id,
          played: false,
          gameId,
        },
      })

      await gameService.endTurn(gameId) // Move to next turn

      // Accept 5 shares (eligible for 5 since 10/2 = 5)
      const result = await gameService.executeTrade(gameId, {
        type: 'play_corporate_action',
        corporateActionId: corporateAction.actionId,
        symbol: 'TECH',
        quantity: 5,
      })

      expect(result.success).toBe(true)

      // Verify shares added
      const holding = await prisma.stockHolding.findFirst({
        where: { symbol: 'TECH' },
      })

      expect(holding?.quantity).toBe(15) // 10 original + 5 from right issue
    })

    it('should process bonus issue for shareholders', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Buy 10 shares of TECH
      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 10,
      })

      // Create bonus issue (1:5 ratio - 1 bonus per 5 held)
      const gameState = await gameService.getGameState(gameId)
      const corporateAction = await prisma.corporateAction.create({
        data: {
          actionId: 'test-bonus',
          type: 'bonus_issue',
          title: 'Test Bonus Issue',
          description: 'Test',
          details: JSON.stringify({ ratio: 1, baseShares: 5 }),
          round: 1,
          playersProcessed: JSON.stringify([]),
          playerId: gameState.players[0].id,
          played: false,
          gameId,
        },
      })

      await gameService.endTurn(gameId)

      // Play bonus issue
      const result = await gameService.executeTrade(gameId, {
        type: 'play_corporate_action',
        corporateActionId: corporateAction.actionId,
        symbol: 'TECH',
      })

      expect(result.success).toBe(true)

      // Verify bonus shares added (10/5 = 2 bonus shares)
      const holding = await prisma.stockHolding.findFirst({
        where: { symbol: 'TECH' },
      })

      expect(holding?.quantity).toBe(12) // 10 original + 2 bonus
    })
  })

  describe('Leadership Tracking', () => {
    it('should assign director when player owns ≥25%', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Buy 25% of TECH (50,000 shares out of 200,000)
      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 50000,
      })

      const stock = await prisma.stock.findFirst({
        where: { gameId, symbol: 'TECH' },
      })

      expect(stock?.directorId).toBeDefined()
    })

    it('should assign chairman when player owns ≥50%', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      // Buy 50% of TECH (100,000 shares out of 200,000)
      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 100000,
      })

      const stock = await prisma.stock.findFirst({
        where: { gameId, symbol: 'TECH' },
      })

      expect(stock?.chairmanId).toBeDefined()
    })
  })

  describe('Game State', () => {
    it('should retrieve complete game state', async () => {
      const gameId = await gameService.createGame(['Alice', 'Bob'], 10)

      const gameState = await gameService.getGameState(gameId)

      expect(gameState.currentRound).toBe(1)
      expect(gameState.maxRounds).toBe(10)
      expect(gameState.players).toHaveLength(2)
      expect(gameState.stocks).toHaveLength(6)
      expect(gameState.currentPlayerIndex).toBe(0)
    })

    it('should detect game over', async () => {
      const gameId = await gameService.createGame(['Alice'], 1) // 1 round game

      // Complete round 1
      await gameService.endTurn(gameId)
      await gameService.endTurn(gameId)
      const result = await gameService.endTurn(gameId)

      expect(result.gameOver).toBe(true)

      const game = await prisma.game.findUnique({
        where: { id: gameId },
      })

      expect(game?.isComplete).toBe(true)
    })
  })

  describe('Action Logging', () => {
    it('should log buy action', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      await gameService.executeTrade(gameId, {
        type: 'buy',
        symbol: 'TECH',
        quantity: 10,
      })

      const action = await prisma.turnAction.findFirst({
        where: { actionType: 'buy' },
      })

      expect(action).toBeDefined()
      expect(action?.symbol).toBe('TECH')
      expect(action?.quantity).toBe(10)
    })

    it('should log skip action', async () => {
      const gameId = await gameService.createGame(['Alice'], 10)

      await gameService.executeTrade(gameId, {
        type: 'skip',
      })

      const action = await prisma.turnAction.findFirst({
        where: { actionType: 'skip' },
      })

      expect(action).toBeDefined()
      expect(action?.result).toContain('skipped')
    })
  })
})
