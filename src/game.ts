import { GameState, Player, TradeAction, MarketEvent, CorporateAction } from './types'
import { StockMarket } from './market'
import { EventSystem } from './events'
import { PlayerManager } from './player'
import { CorporateActionManager } from './corporateActions'
import { LeadershipManager } from './leadership'
import { nanoid } from 'nanoid'

export class GameEngine {
  private gameState: GameState
  private market: StockMarket
  private eventSystem: EventSystem
  private playerManager: PlayerManager
  private corporateActionManager: CorporateActionManager
  private leadershipManager: LeadershipManager

  constructor(playerNames: string[], maxRounds: number = 10) {
    this.market = new StockMarket()
    this.eventSystem = new EventSystem()
    this.playerManager = new PlayerManager()
    this.corporateActionManager = new CorporateActionManager()
    this.leadershipManager = new LeadershipManager()

    const players = playerNames.map((name) => this.playerManager.createPlayer(nanoid(), name))

    const stocks = this.market.getStocks()

    this.gameState = {
      currentRound: 1,
      maxRounds,
      currentTurnInRound: 1,
      turnsPerRound: 3,
      players,
      currentPlayerIndex: 0,
      stocks,
      recentEvents: [],
      pendingCorporateActions: [],
      eventHistory: [],
      roundEvents: {},
      stockLeadership: this.leadershipManager.initializeLeadership(stocks),
    }

    // Generate initial events for the first player's turn
    this.generateEventsForTurn()
  }

  getGameState(): GameState {
    return { ...this.gameState, stocks: this.market.getStocks() }
  }

  getCurrentPlayer(): Player {
    return this.gameState.players[this.gameState.currentPlayerIndex]
  }

  executeTrade(action: TradeAction): { success: boolean; message: string } {
    const currentPlayer = this.getCurrentPlayer()

    if (action.type === 'skip') {
      // Record skip action
      currentPlayer.actionHistory.push({
        round: this.gameState.currentRound,
        turn: this.gameState.currentTurnInRound,
        action: { type: 'skip' },
        result: 'Turn skipped',
        timestamp: Date.now(),
      })

      return { success: true, message: 'Turn skipped' }
    }

    if (!action.symbol || !action.quantity) {
      return { success: false, message: 'Invalid trade action' }
    }

    const stock = this.market.getStock(action.symbol)

    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }

    let result
    if (action.type === 'buy') {
      // Check market availability first
      const marketResult = this.market.buyStock(action.symbol, action.quantity)
      if (!marketResult.success) {
        return marketResult
      }

      // Then process player purchase
      result = this.playerManager.buyStock(currentPlayer, stock, action.quantity)

      // Rollback market transaction if player transaction fails
      if (!result.success) {
        this.market.sellStock(action.symbol, action.quantity)
      } else {
        // Record successful buy action
        currentPlayer.actionHistory.push({
          round: this.gameState.currentRound,
          turn: this.gameState.currentTurnInRound,
          action: { type: 'buy', symbol: action.symbol, quantity: action.quantity },
          price: stock.price,
          totalValue: stock.price * action.quantity,
          result: result.message,
          timestamp: Date.now(),
        })
      }
    } else {
      result = this.playerManager.sellStock(currentPlayer, stock, action.quantity)

      // Add stock back to market
      if (result.success) {
        this.market.sellStock(action.symbol, action.quantity)

        // Record successful sell action
        currentPlayer.actionHistory.push({
          round: this.gameState.currentRound,
          turn: this.gameState.currentTurnInRound,
          action: { type: 'sell', symbol: action.symbol, quantity: action.quantity },
          price: stock.price,
          totalValue: stock.price * action.quantity,
          result: result.message,
          timestamp: Date.now(),
        })
      }
    }

    if (result.success) {
      // Update leadership after successful trade
      this.gameState.stockLeadership = this.leadershipManager.updateLeadership(
        this.market.getStocks(),
        this.gameState.players,
        this.gameState.stockLeadership
      )
    }

    return result
  }

  endTurn(): {
    newEvents: MarketEvent[]
    newCorporateAction: CorporateAction | null
    roundEnded: boolean
    gameOver: boolean
  } {
    console.log(
      `[EndTurn] Starting - Round: ${this.gameState.currentRound}, Turn: ${this.gameState.currentTurnInRound}, Player: ${this.gameState.currentPlayerIndex}`
    )

    // Move to next player
    this.gameState.currentPlayerIndex++

    // Generate and apply corporate action for the new player's turn
    let newCorporateAction: CorporateAction | null = null
    if (Math.random() < 0.3) {
      // 30% chance
      newCorporateAction = this.corporateActionManager.generateCorporateAction(
        this.gameState.stocks,
        this.gameState.currentRound,
        this.gameState.currentTurnInRound
      )

      if (newCorporateAction) {
        // Instantly apply dividends and bonus issues to all players
        if (newCorporateAction.type === 'dividend' || newCorporateAction.type === 'bonus_issue') {
          this.gameState.players.forEach((player) => {
            const stock = this.market.getStock(newCorporateAction!.symbol)
            if (stock) {
              if (newCorporateAction!.type === 'dividend') {
                this.corporateActionManager.processDividend(newCorporateAction!, player, stock)
              } else if (newCorporateAction!.type === 'bonus_issue') {
                this.corporateActionManager.processBonusIssue(newCorporateAction!, player, stock)
              }
            }
          })
          // Mark as processed by all players
          newCorporateAction.playersProcessed = this.gameState.players.map((p) => p.id)
        }

        this.gameState.pendingCorporateActions.push(newCorporateAction)
      }
    }

    // Generate events for the next player's turn (before they start)
    let newEvents: MarketEvent[] = []

    // If all players have played this turn
    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      console.log(`[EndTurn] All players finished turn ${this.gameState.currentTurnInRound}`)
      this.gameState.currentPlayerIndex = 0
      this.gameState.currentTurnInRound++
      console.log(`[EndTurn] Incremented to turn ${this.gameState.currentTurnInRound}`)

      // If all turns in round are complete
      if (this.gameState.currentTurnInRound > this.gameState.turnsPerRound) {
        console.log(
          `[EndTurn] Round ${this.gameState.currentRound} complete! Processing round end...`
        )
        this.gameState.currentTurnInRound = 1

        // Process round end
        const { gameOver, newEventsForNextRound } = this.processEndOfRound()

        console.log(
          `[EndTurn] After processEndOfRound - Now at Round: ${this.gameState.currentRound}, Turn: ${this.gameState.currentTurnInRound}`
        )
        return {
          newEvents: newEventsForNextRound,
          newCorporateAction: null,
          roundEnded: true,
          gameOver,
        }
      }

      // Generate events for the next turn (same round, next player)
      newEvents = this.generateEventsForTurn()
    }

    // If moving to next player within same turn cycle, generate events
    if (newEvents.length === 0) {
      newEvents = this.generateEventsForTurn()
    }

    // Clean up expired actions after each turn
    this.cleanupExpiredCorporateActions()

    return { newEvents, newCorporateAction, roundEnded: false, gameOver: false }
  }

  /**
   * Process end of round: apply accumulated events, update history, increment round
   */
  private processEndOfRound(): { gameOver: boolean; newEventsForNextRound: MarketEvent[] } {
    console.log(`[ProcessEndOfRound] Starting for round ${this.gameState.currentRound}`)
    // Apply all accumulated events from this round
    const roundEvents = this.gameState.roundEvents[this.gameState.currentRound] || []

    if (roundEvents.length > 0) {
      // Store prices before applying all events
      const preRoundPrices: { [symbol: string]: number } = {}
      this.gameState.stocks.forEach((stock) => {
        preRoundPrices[stock.symbol] = stock.price
      })

      // Apply all events at once
      this.market.applyAccumulatedEvents(roundEvents)

      // Calculate priceDiff and actualImpact for each event based on its impact
      roundEvents.forEach((event) => {
        const priceDiff: { [symbol: string]: number } = {}
        const actualImpact: { [symbol: string]: number } = {}

        this.gameState.stocks.forEach((stock) => {
          if (event.affectedSectors.includes(stock.sector)) {
            // For affected stocks, priceDiff is the event's impact
            priceDiff[stock.symbol] = event.impact
            // Calculate percentage change
            const percentChange = (event.impact / preRoundPrices[stock.symbol]) * 100
            actualImpact[stock.symbol] = Math.round(percentChange * 100) / 100
          } else {
            // For unaffected stocks, no change from this event
            priceDiff[stock.symbol] = 0
            actualImpact[stock.symbol] = 0
          }
        })

        event.priceDiff = priceDiff
        event.actualImpact = actualImpact
      })

      // Add all round events to event history after they've been applied
      roundEvents.forEach((event) => {
        this.gameState.eventHistory.push(event)
      })
    }

    // Update price history for all stocks after round ends
    this.gameState.stocks.forEach((stock) => {
      stock.priceHistory.push({
        round: this.gameState.currentRound,
        price: Math.round(stock.price * 100) / 100,
      })
    })

    // Clear recent events after they've been applied
    this.gameState.recentEvents = []

    console.log(
      `[ProcessEndOfRound] Incrementing round from ${this.gameState.currentRound} to ${this.gameState.currentRound + 1}`
    )
    this.gameState.currentRound++

    // Clean up expired corporate actions at round end
    this.cleanupExpiredCorporateActions()

    this.gameState.stocks = this.market.getStocks()

    // Check if game is over
    const gameOver = this.gameState.currentRound > this.gameState.maxRounds

    // Generate events for the next round's first turn (if game not over)
    let newEventsForNextRound: MarketEvent[] = []
    if (!gameOver) {
      newEventsForNextRound = this.generateEventsForTurn()
    }

    return { gameOver, newEventsForNextRound }
  }

  /**
   * Generate events BEFORE the current player's turn starts
   * Events are stored but NOT applied to prices yet
   */
  private generateEventsForTurn(): MarketEvent[] {
    // Generate 3 events for this turn
    const newEvents = this.eventSystem.getMultipleEvents(this.gameState.currentRound, 3)

    // Store events for the round (without applying price changes)
    newEvents.forEach((event) => {
      event.turn = this.gameState.currentTurnInRound

      this.gameState.recentEvents.unshift(event)
      // NOTE: eventHistory is populated at round end, not here

      // Store in round events
      if (!this.gameState.roundEvents[this.gameState.currentRound]) {
        this.gameState.roundEvents[this.gameState.currentRound] = []
      }
      this.gameState.roundEvents[this.gameState.currentRound].push(event)
    })

    // Trim recent events
    if (this.gameState.recentEvents.length > 10) {
      this.gameState.recentEvents = this.gameState.recentEvents.slice(0, 10)
    }

    return newEvents
  }

  private cleanupExpiredCorporateActions(): void {
    // Remove corporate actions that:
    // 1. Have been processed by all players, OR
    // 2. Round has changed (expired)
    this.gameState.pendingCorporateActions = this.gameState.pendingCorporateActions.filter(
      (action) => {
        // If round changed, action expires
        if (action.round !== this.gameState.currentRound) {
          return false
        }

        // If all players have been processed, remove it
        if (action.playersProcessed.length >= this.gameState.players.length) {
          return false
        }

        return true // Keep the action
      }
    )
  }

  getPlayerRankings(): Array<{
    player: Player
    totalValue: number
    rank: number
  }> {
    const rankings = this.gameState.players.map((player) => ({
      player,
      totalValue: this.playerManager.getPortfolioValue(player, this.gameState.stocks),
    }))

    rankings.sort((a, b) => b.totalValue - a.totalValue)

    return rankings.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  }

  getPlayerPortfolio(playerId: string) {
    const player = this.gameState.players.find((p) => p.id === playerId)
    if (!player) return null

    return {
      cash: player.cash,
      holdings: this.playerManager.getPortfolioDetails(player, this.gameState.stocks),
      totalValue: this.playerManager.getPortfolioValue(player, this.gameState.stocks),
    }
  }

  acceptRightIssue(symbol: string, quantity: number): { success: boolean; message: string } {
    const action = this.gameState.pendingCorporateActions.find(
      (a) => a.type === 'right_issue' && a.symbol === symbol
    )

    if (!action) {
      return { success: false, message: 'No active right issue for this stock' }
    }

    const currentPlayer = this.getCurrentPlayer()
    const stock = this.market.getStock(symbol)

    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }

    return this.corporateActionManager.acceptRightIssue(action, currentPlayer, stock, quantity)
  }

  getRightIssueDetails(symbol: string) {
    const action = this.gameState.pendingCorporateActions.find(
      (a) => a.type === 'right_issue' && a.symbol === symbol
    )

    if (!action) return null

    const currentPlayer = this.getCurrentPlayer()
    const stock = this.market.getStock(symbol)

    if (!stock) return null

    return this.corporateActionManager.processRightIssue(action, currentPlayer, stock)
  }

  getPendingCorporateActions(): CorporateAction[] {
    return this.gameState.pendingCorporateActions
  }

  getRoundPriceDiff(round: number): { [symbol: string]: number } {
    const events = this.gameState.roundEvents[round] || []
    const totalPriceDiff: { [symbol: string]: number } = {}

    // Initialize all stocks with 0
    this.gameState.stocks.forEach((stock) => {
      totalPriceDiff[stock.symbol] = 0
    })

    // Sum up all price diffs from events in this round
    events.forEach((event) => {
      if (event.priceDiff) {
        Object.entries(event.priceDiff).forEach(([symbol, diff]) => {
          totalPriceDiff[symbol] = Math.round((totalPriceDiff[symbol] + diff) * 100) / 100
        })
      }
    })

    return totalPriceDiff
  }

  getRoundEvents(round: number): MarketEvent[] {
    return this.gameState.roundEvents[round] || []
  }
}
