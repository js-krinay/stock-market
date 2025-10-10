export interface TurnResult {
  roundEnded: boolean
  gameOver: boolean
}

/**
 * Interface for turn progression operations
 */
export interface ITurnService {
  /**
   * End the current turn and progress game state
   * @param gameId - Game identifier
   * @returns Turn progression result
   */
  endTurn(gameId: string): Promise<TurnResult>
}
