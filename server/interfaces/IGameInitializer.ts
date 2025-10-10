/**
 * Interface for game initialization operations
 */
export interface IGameInitializer {
  /**
   * Create a new game with players
   * @param playerNames - Array of player names
   * @param maxRounds - Maximum number of rounds (default: 10)
   * @returns Game ID
   */
  createGame(playerNames: string[], maxRounds: number): Promise<string>
}
