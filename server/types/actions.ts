/**
 * Game actions and turn history
 */

export interface TurnAction {
  round: number
  turn: number
  action: TradeAction
  price?: number
  totalValue?: number
  result: string
  timestamp: number
}

export interface TradeAction {
  type:
    | 'buy'
    | 'sell'
    | 'skip'
    | 'play_corporate_action' // User action to play a corporate action card
    | 'dividend_declared' // Logged when dividend is declared
    | 'dividend_received' // Logged when player receives dividend
    | 'bonus_issue_declared' // Logged when bonus issue is declared
    | 'bonus_received' // Logged when player receives bonus shares
    | 'right_issue_purchased' // Logged when player purchases right issue
    | 'deflation_gain' // Logged when player gains from deflation
    | 'inflation_loss' // Logged when player loses from inflation
  symbol?: string
  quantity?: number
  corporateActionId?: string // For playing corporate action cards
}
