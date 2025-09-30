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
}

export interface CorporateAction {
  id: string
  type: 'dividend' | 'right_issue' | 'bonus_issue'
  symbol: string
  title: string
  description: string
  details: DividendDetails | RightIssueDetails | BonusIssueDetails
  round: number // Round when the action was created
  createdAtTurn: number // Turn number when action was created
  playersProcessed: string[] // Track which players have been processed for this action
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
  recentEvents: MarketEvent[]
  pendingCorporateActions: CorporateAction[]
  eventHistory: MarketEvent[] // All events throughout the game
  roundEvents: { [round: number]: MarketEvent[] } // Events grouped by round
  stockLeadership: StockLeadership[] // Track directors and chairmen for each stock
}

export interface TradeAction {
  type: 'buy' | 'sell' | 'skip'
  symbol?: string
  quantity?: number
}
