import type { MarketEvent } from '../types/'

/**
 * Service interface for leadership event exclusion operations
 */
export interface ILeadershipExclusionService {
  /**
   * Get all exclusion opportunities for stocks with leaders (chairmen and directors)
   */
  getLeadershipExclusionOpportunities(gameId: string): Promise<LeadershipExclusionOpportunity[]>

  /**
   * Get leadership opportunities grouped by leader in sequence
   */
  getLeadershipOpportunitiesGrouped(gameId: string): Promise<LeaderOpportunityGroup[]>

  /**
   * Initialize leadership phase with ordered leader IDs
   */
  initializeLeadershipPhase(gameId: string, leaderIds: string[]): Promise<void>

  /**
   * Advance to the next leader in sequence
   * Returns whether the phase is completed and the next leader index if not
   */
  advanceToNextLeader(gameId: string): Promise<{ completed: boolean; nextLeaderIndex?: number }>

  /**
   * Complete leadership phase and clear status
   */
  completeLeadershipPhase(gameId: string): Promise<void>

  /**
   * Exclude a specific event by a leader
   */
  excludeEvent(gameId: string, eventId: string, leaderId: string): Promise<void>
}

/**
 * Represents an opportunity for a leader to exclude an event
 * Grouped by stock symbol
 *
 * Leadership hierarchy:
 * - Chairman (≥50%): Can exclude ANY event affecting their stock (from any player)
 * - Director (25-49%, no chairman): Can ONLY exclude events from their own hand
 */
export interface LeadershipExclusionOpportunity {
  stockSymbol: string
  stockName: string
  stockColor: string // For UI display
  leaderId: string
  leaderName: string
  leaderType: 'chairman' | 'director' // Distinguish leader type
  canExcludeFromAllPlayers: boolean // true=chairman, false=director
  eligibleEvents: MarketEvent[] // Filtered by leader type
}

/**
 * Information about a leader and the stocks they lead
 * Used in TurnResult to signal leadership phase
 */
export interface LeadershipInfo {
  playerId: string
  playerName: string
  stocks: StockLeadership[] // All stocks this player leads
}

/**
 * Details about a single stock leadership position
 */
export interface StockLeadership {
  symbol: string
  name: string
  color: string
  leaderType: 'chairman' | 'director'
  sharePercentage: number // For display (e.g., "Chairman - 60%" or "Director - 35%")
}

/**
 * Group of opportunities for a single leader
 * Used in paginated leadership flow
 */
export interface LeaderOpportunityGroup {
  leaderId: string
  leaderName: string
  leaderIndex: number // Position in sequence (0-based)
  totalLeaders: number // Total leaders in this round
  opportunities: LeadershipExclusionOpportunity[]
}
