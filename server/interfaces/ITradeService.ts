import type { TradeAction } from '../types/'

export interface TradeResult {
  success: boolean
  message: string
  toasts?: Array<{ playerName: string; message: string }>
}

/**
 * Interface for trade execution operations
 */
export interface ITradeService {
  /**
   * Execute a trade action
   * @param gameId - Game identifier
   * @param action - Trade action to execute
   * @param onLeadershipUpdate - Callback for leadership updates
   * @returns Trade execution result
   */
  executeTrade(
    gameId: string,
    action: TradeAction,
    onLeadershipUpdate: () => Promise<void>
  ): Promise<TradeResult>
}
