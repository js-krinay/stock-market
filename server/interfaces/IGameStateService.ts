import type { GameState, CorporateAction } from '../types/'

/**
 * Interface for game state query operations
 */
export interface IGameStateService {
  /**
   * Get complete game state
   * @param gameId - Game identifier
   * @returns Full game state with players, stocks, events
   */
  getGameState(gameId: string): Promise<GameState>

  /**
   * Get active rights issues available for current player
   * @param gameId - Game identifier
   * @returns Array of active corporate actions
   */
  getActiveRightsIssues(gameId: string): Promise<CorporateAction[]>
}
