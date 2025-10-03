import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../server/routers/_app'

// Infer types from tRPC router outputs
type RouterOutput = inferRouterOutputs<AppRouter>

// Export types inferred from tRPC procedures
export type GameState = RouterOutput['game']['getGameState']
export type TradeResult = RouterOutput['game']['executeTrade']
export type EndTurnResult = RouterOutput['game']['endTurn']

// Extract nested types from GameState
export type Player = GameState['players'][number]
export type Stock = GameState['stocks'][number]
export type MarketEvent = GameState['eventHistory'][number]
export type StockHolding = Player['portfolio'][number]
export type TurnAction = Player['actionHistory'][number]
export type GameCard = Player['cards'][number]
export type CorporateAction = NonNullable<GameCard['data']> & {
  type: 'dividend' | 'right_issue' | 'bonus_issue'
}

// Re-export corporate action detail types from server
export type { DividendDetails, RightIssueDetails, BonusIssueDetails } from '../server/types'
