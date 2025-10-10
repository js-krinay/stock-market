/**
 * Interface for leadership tracking operations
 */
export interface ILeadershipService {
  /**
   * Update stock leadership positions (chairman, director)
   * @param gameId - Game identifier
   */
  updateLeadership(gameId: string): Promise<void>
}
