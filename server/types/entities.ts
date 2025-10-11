/**
 * Core game entities
 */

import type { TurnAction } from './actions'

export interface Stock {
  symbol: string
  name: string
  price: number
  availableQuantity: number
  totalQuantity: number
  color: string
  directorId: string | null // Player ID of the director (owns ≥25%)
  chairmanId: string | null // Player ID of the chairman (owns ≥50%)
  priceHistory: Array<{ round: number; price: number }> // Track price history over rounds
}

export interface StockHolding {
  symbol: string
  quantity: number
  averageCost: number
}

export interface Player {
  id: string
  name: string
  cash: number
  portfolio: StockHolding[]
  actionHistory: TurnAction[]
  events: MarketEvent[] // Event cards assigned to this player for the current round
  corporateActions: CorporateAction[] // Corporate action cards assigned to this player for the current round
}

export interface MarketEvent {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'crash' | 'bull_run' | 'inflation' | 'deflation'
  severity: 'low' | 'medium' | 'high' | 'extreme'
  title: string
  description: string
  affectedStocks: string[] // Stock symbols affected by this event; Empty for inflation/deflation events
  impact: number // For stock events: fixed dollar price change; For inflation/deflation: percentage change (e.g., 10 = 10%)
  round: number
  turn?: number // Which turn within the round this event occurred
  playerId?: string // Which player received this event card (optional for templates, required in DB)
  excludedBy?: string | null // Player ID who excluded this card (director/chairman)
  priceDiff?: { [symbol: string]: number } // Absolute price change (in dollars) for each stock
  actualImpact?: { [symbol: string]: number } // Percentage price changes applied
}

export interface CorporateAction {
  id: string
  type: 'dividend' | 'right_issue' | 'bonus_issue'
  symbol?: string // Made optional - will be selected by player when playing the card
  title: string
  description: string
  details: DividendDetails | RightIssueDetails | BonusIssueDetails
  round: number // Round when the action was created
  playersProcessed: string[] // Track which players have been processed for this action
  playerId?: string // Which player received this corporate action card (optional for templates, required in DB)
  excludedBy?: string | null // Player ID who excluded this card (director/chairman)
  played?: boolean // Whether the card has been played
  // Rights issue expiry tracking
  status?: 'pending' | 'active' | 'expired'
  expiresAtPlayerId?: string // Player who played it (expires when their turn comes again)
  eligiblePlayerIds?: string[] // Player IDs who were eligible when card was played
}

// Card that can be either an event or corporate action
export type GameCard =
  | (MarketEvent & { cardType: 'event' })
  | (CorporateAction & { cardType: 'corporate_action' })

export interface DividendDetails {
  dividendPercentage: number // Dividend percentage (e.g., 0.05 = 5% of stock price)
}

export interface RightIssueDetails {
  ratio: number // e.g., 1 for 1:5 right issue
  baseShares: number // e.g., 5 for 1:5 right issue
  discountPercentage: number // Discount percentage (e.g., 0.5 = pay 50% of market price)
}

export interface BonusIssueDetails {
  ratio: number // e.g., 1 for 1:10 bonus issue
  baseShares: number // e.g., 10 for 1:10 bonus issue
}

export interface LeadershipExclusionStatus {
  phase: 'active' | 'completed'
  currentLeaderIndex: number // 0-based index into leaderIds array
  totalLeaders: number // Total number of leaders this round
  leaderIds: string[] // Ordered array of player IDs who are leaders
  completedLeaderIds: string[] // Track which leaders have completed their selections
}

export interface GameState {
  currentRound: number
  maxRounds: number
  currentTurnInRound: number
  turnsPerRound: number
  players: Player[]
  currentPlayerIndex: number
  stocks: Stock[]
  eventHistory: MarketEvent[] // All events throughout the game
  isComplete: boolean // Whether the game has ended
  leadershipExclusionStatus?: LeadershipExclusionStatus // Only populated during leadership phase
}
