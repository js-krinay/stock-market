import { GameState, Player, TradeAction, MarketEvent, CorporateAction } from './types'
import { StockMarket } from './market'
import { PlayerManager } from './player'
import { CorporateActionManager } from './corporateActions'
import { LeadershipManager } from './leadership'
import { CardManager } from './cardManager'
import { nanoid } from 'nanoid'

export class GameEngine {
  private gameState: GameState
  private market: StockMarket
  private playerManager: PlayerManager
  private corporateActionManager: CorporateActionManager
  private leadershipManager: LeadershipManager
  private cardManager: CardManager

  constructor(playerNames: string[], maxRounds: number = 10) {
    this.market = new StockMarket()
    this.playerManager = new PlayerManager()
    this.corporateActionManager = new CorporateActionManager()
    this.leadershipManager = new LeadershipManager()
    this.cardManager = new CardManager()

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
      currentCard: null,
      accumulatedEvents: [],
      accumulatedCorporateActions: [],
      eventHistory: [],
      stockLeadership: this.leadershipManager.initializeLeadership(stocks),
    }

    // Generate cards for all players for round 1
    this.generateCardsForRound()

    // Show first card for first player
    this.showCurrentCard()
  }

  getGameState(): GameState {
    return { ...this.gameState, stocks: this.market.getStocks() }
  }

  getCurrentPlayer(): Player {
    return this.gameState.players[this.gameState.currentPlayerIndex]
  }

  /**
   * Generate cards for all players for the current round
   */
  private generateCardsForRound(): void {
    const playerCards = this.cardManager.generateCardsForRound(
      this.gameState.players,
      this.gameState.stocks,
      this.gameState.currentRound
    )

    // Assign cards to each player
    this.gameState.players.forEach((player) => {
      player.cards = playerCards[player.id] || []
    })
  }

  /**
   * Show the current card for the current player
   */
  private showCurrentCard(): void {
    const currentPlayer = this.getCurrentPlayer()
    const card = this.cardManager.getCurrentCard(currentPlayer)

    if (card) {
      this.cardManager.markCardAsShown(card)
      this.gameState.currentCard = card

      // Add to accumulated items
      if (card.type === 'event') {
        this.gameState.accumulatedEvents.push(card.data as MarketEvent)
      } else {
        this.gameState.accumulatedCorporateActions.push(card.data as CorporateAction)
      }
    } else {
      this.gameState.currentCard = null
    }
  }

  executeTrade(action: TradeAction): { success: boolean; message: string; toasts?: Array<{ playerName: string; message: string }> } {
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

    if (action.type === 'play_corporate_action') {
      if (!action.corporateActionId) {
        return { success: false, message: 'Corporate action ID required' }
      }
      if (!action.symbol) {
        return { success: false, message: 'Stock symbol required for corporate action' }
      }

      const corporateAction = this.cardManager.playCorporateAction(
        currentPlayer,
        action.corporateActionId
      )

      if (!corporateAction) {
        return { success: false, message: 'Corporate action not found or already played' }
      }

      // Set the symbol on the corporate action (player selected it)
      corporateAction.symbol = action.symbol

      const stock = this.market.getStock(action.symbol)
      if (!stock) {
        return { success: false, message: 'Stock not found' }
      }

      // Process the corporate action based on type
      let result: { success: boolean; message: string } = { success: false, message: '' }

      if (corporateAction.type === 'right_issue') {
        // For right issues, we need quantity from the action
        if (!action.quantity) {
          return { success: false, message: 'Quantity required for right issue' }
        }
        result = this.corporateActionManager.acceptRightIssue(
          corporateAction,
          currentPlayer,
          stock,
          action.quantity
        )
      } else if (corporateAction.type === 'dividend') {
        // Pay dividend to ALL players who own the stock
        const toasts: Array<{ playerName: string; message: string }> = []
        let totalPaid = 0

        this.gameState.players.forEach((player) => {
          const divResult = this.corporateActionManager.processDividend(
            corporateAction,
            player,
            stock
          )
          if (divResult.amount > 0) {
            toasts.push({
              playerName: player.name,
              message: `Received ${stock.name} dividend: $${divResult.amount.toFixed(2)}`
            })
            totalPaid += divResult.amount

            // Log dividend received action for this player
            player.actionHistory.push({
              round: this.gameState.currentRound,
              turn: this.gameState.currentTurnInRound,
              action: {
                type: 'dividend_received',
                symbol: stock.symbol,
                quantity: player.portfolio.find(h => h.symbol === stock.symbol)?.quantity || 0
              },
              result: `Received dividend: $${divResult.amount.toFixed(2)}`,
              timestamp: Date.now(),
            })
          }
        })

        result = {
          success: true,
          message: `Dividend declared for ${stock.name}. Paid to ${toasts.length} shareholders.`,
          toasts
        }
      } else if (corporateAction.type === 'bonus_issue') {
        // Issue bonus shares to ALL players who own the stock
        const toasts: Array<{ playerName: string; message: string }> = []
        let totalBonusShares = 0

        this.gameState.players.forEach((player) => {
          const bonusResult = this.corporateActionManager.processBonusIssue(
            corporateAction,
            player,
            stock
          )
          if (bonusResult.bonusShares > 0) {
            toasts.push({
              playerName: player.name,
              message: `Received ${bonusResult.bonusShares} bonus ${stock.name} shares`
            })
            totalBonusShares += bonusResult.bonusShares

            // Log bonus shares received action for this player
            player.actionHistory.push({
              round: this.gameState.currentRound,
              turn: this.gameState.currentTurnInRound,
              action: {
                type: 'bonus_received',
                symbol: stock.symbol,
                quantity: bonusResult.bonusShares
              },
              result: `Received ${bonusResult.bonusShares} bonus shares`,
              timestamp: Date.now(),
            })
          }
        })

        result = {
          success: true,
          message: `Bonus issue declared for ${stock.name}. Issued to ${toasts.length} shareholders.`,
          toasts
        }
      }

      // Record action
      currentPlayer.actionHistory.push({
        round: this.gameState.currentRound,
        turn: this.gameState.currentTurnInRound,
        action: {
          type: 'play_corporate_action',
          symbol: corporateAction.symbol,
          corporateActionId: action.corporateActionId,
        },
        result: result.message,
        timestamp: Date.now(),
      })

      return result
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
    roundEnded: boolean
    gameOver: boolean
  } {
    const currentPlayer = this.getCurrentPlayer()

    console.log(
      `[EndTurn] Player ${currentPlayer.name} completed turn ${this.gameState.currentTurnInRound} of round ${this.gameState.currentRound}`
    )

    // Move to next player
    this.gameState.currentPlayerIndex++

    // If all players have completed this turn cycle
    if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
      this.gameState.currentPlayerIndex = 0
      this.gameState.currentTurnInRound++

      console.log(`[EndTurn] All players completed a turn. Now at turn ${this.gameState.currentTurnInRound}`)

      // Check if the round has completed (based on turnsPerRound, not cards)
      const allPlayersFinished = this.gameState.currentTurnInRound > this.gameState.turnsPerRound

      if (allPlayersFinished) {
        console.log(`[EndTurn] Round ${this.gameState.currentRound} complete! Processing round end...`)

        // Process round end
        const { gameOver } = this.processEndOfRound()

        return {
          roundEnded: true,
          gameOver,
        }
      }
    }

    // Show card for next player
    this.showCurrentCard()

    return { roundEnded: false, gameOver: false }
  }

  /**
   * Process end of round: apply accumulated events and corporate actions
   */
  private processEndOfRound(): { gameOver: boolean } {
    console.log(`[ProcessEndOfRound] Starting for round ${this.gameState.currentRound}`)

    // Store prices before applying all events
    const preRoundPrices: { [symbol: string]: number } = {}
    this.gameState.stocks.forEach((stock) => {
      preRoundPrices[stock.symbol] = stock.price
    })

    // Apply all accumulated events at once
    if (this.gameState.accumulatedEvents.length > 0) {
      this.market.applyAccumulatedEvents(this.gameState.accumulatedEvents)

      // Calculate priceDiff and actualImpact for each event
      this.gameState.accumulatedEvents.forEach((event) => {
        const priceDiff: { [symbol: string]: number } = {}
        const actualImpact: { [symbol: string]: number } = {}

        this.gameState.stocks.forEach((stock) => {
          if (event.affectedSectors.includes(stock.sector)) {
            priceDiff[stock.symbol] = event.impact
            const percentChange = (event.impact / preRoundPrices[stock.symbol]) * 100
            actualImpact[stock.symbol] = Math.round(percentChange * 100) / 100
          } else {
            priceDiff[stock.symbol] = 0
            actualImpact[stock.symbol] = 0
          }
        })

        event.priceDiff = priceDiff
        event.actualImpact = actualImpact
      })

      // Add all events to event history
      this.gameState.eventHistory.push(...this.gameState.accumulatedEvents)
    }

    // Process auto-apply corporate actions (dividends and bonus issues that weren't played)
    this.gameState.accumulatedCorporateActions.forEach((action) => {
      // Skip if already played
      if (action.played) return

      const stock = this.market.getStock(action.symbol)
      if (!stock) return

      // Auto-apply dividends and bonus issues to all eligible players
      if (action.type === 'dividend' || action.type === 'bonus_issue') {
        this.gameState.players.forEach((player) => {
          if (action.type === 'dividend') {
            this.corporateActionManager.processDividend(action, player, stock)
          } else if (action.type === 'bonus_issue') {
            this.corporateActionManager.processBonusIssue(action, player, stock)
          }
        })
      }
    })

    // Update price history for all stocks
    this.gameState.stocks.forEach((stock) => {
      stock.priceHistory.push({
        round: this.gameState.currentRound,
        price: Math.round(stock.price * 100) / 100,
      })
    })

    // Clear accumulated items and current card
    this.gameState.accumulatedEvents = []
    this.gameState.accumulatedCorporateActions = []
    this.gameState.currentCard = null

    console.log(
      `[ProcessEndOfRound] Incrementing round from ${this.gameState.currentRound} to ${this.gameState.currentRound + 1}`
    )
    this.gameState.currentRound++
    this.gameState.currentTurnInRound = 1

    this.gameState.stocks = this.market.getStocks()

    // Check if game is over
    const gameOver = this.gameState.currentRound > this.gameState.maxRounds

    // Generate cards for next round (if game not over)
    if (!gameOver) {
      this.generateCardsForRound()
      this.showCurrentCard()
    }

    return { gameOver }
  }

  /**
   * Get unplayed corporate action cards for the current player
   */
  getUnplayedCorporateActions(): CorporateAction[] {
    const currentPlayer = this.getCurrentPlayer()
    return this.cardManager.getUnplayedCorporateActions(currentPlayer)
  }

  /**
   * Get all cards for a specific player
   */
  getPlayerCards(playerId: string): GameCard[] {
    const player = this.gameState.players.find((p) => p.id === playerId)
    return player?.cards || []
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

}
