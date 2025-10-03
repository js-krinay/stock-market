export interface Stock {
  symbol: string
  name: string
  price: number
  previousPrice: number
  sector: string
  availableQuantity: number
  totalQuantity: number
  color: string
  priceHistory: Array<{ round: number; price: number }> // Track price history over rounds
}

export interface StockLeadership {
  symbol: string
  directorId: string | null // Player ID of the director (owns ≥25%)
  chairmanId: string | null // Player ID of the chairman (owns ≥50%)
  directorSince: number // Timestamp when director status was achieved
  chairmanSince: number // Timestamp when chairman status was achieved
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
  cards: GameCard[] // Cards assigned to this player for the current round
  currentTurnIndex: number // Which turn (0-9) the player is on in the current round
}

export interface TurnAction {
  round: number
  turn: number
  action: TradeAction
  price?: number
  totalValue?: number
  result: string
  timestamp: number
}

export interface MarketEvent {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'crash' | 'bull_run'
  severity: 'low' | 'medium' | 'high' | 'extreme'
  title: string
  description: string
  affectedSectors: string[]
  impact: number // fixed dollar price change (e.g., +5.00, -10.00)
  round: number
  turn?: number // Which turn within the round this event occurred
  priceDiff?: { [symbol: string]: number } // Absolute price change (in dollars) for each stock
  actualImpact?: { [symbol: string]: number } // Percentage price changes applied
  playerId?: string // Which player received this event card
}

export interface CorporateAction {
  id: string
  type: 'dividend' | 'right_issue' | 'bonus_issue'
  symbol?: string // Made optional - will be selected by player when playing the card
  title: string
  description: string
  details: DividendDetails | RightIssueDetails | BonusIssueDetails
  round: number // Round when the action was created
  createdAtTurn: number // Turn number when action was created
  playersProcessed: string[] // Track which players have been processed for this action
  playerId?: string // Which player received this corporate action card
  played?: boolean // Whether the card has been played
}

// Card that can be either an event or corporate action
export interface GameCard {
  id: string
  type: 'event' | 'corporate_action'
  data: MarketEvent | CorporateAction
  playerId: string
  round: number
  turnIndex: number // Which turn (0-9) this card is for
  shown: boolean // Whether this card has been displayed
}

export interface DividendDetails {
  amountPerShare: number
}

export interface RightIssueDetails {
  ratio: number // e.g., 1 for 1:5 right issue
  baseShares: number // e.g., 5 for 1:5 right issue
  price: number // discounted price to buy new shares
}

export interface BonusIssueDetails {
  ratio: number // e.g., 1 for 1:10 bonus issue
  baseShares: number // e.g., 10 for 1:10 bonus issue
}

export interface GameState {
  currentRound: number
  maxRounds: number
  currentTurnInRound: number
  turnsPerRound: number
  players: Player[]
  currentPlayerIndex: number
  stocks: Stock[]
  currentCard: GameCard | null // Currently displayed card
  accumulatedEvents: MarketEvent[] // Events to be applied at round end
  accumulatedCorporateActions: CorporateAction[] // Corporate actions to be applied at round end
  eventHistory: MarketEvent[] // All events throughout the game
  stockLeadership: StockLeadership[] // Track directors and chairmen for each stock
}

export interface TradeAction {
  type: 'buy' | 'sell' | 'skip' | 'play_corporate_action' | 'dividend_received' | 'bonus_received'
  symbol?: string
  quantity?: number
  corporateActionId?: string // For playing corporate action cards
}
