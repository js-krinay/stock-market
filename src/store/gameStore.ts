import { create } from 'zustand'
import { GameState } from '../types'
import { GameEngine } from '../game'

interface GameStore {
  game: GameEngine | null
  gameState: GameState | null
  currentView: 'setup' | 'game' | 'leaderboard' | 'player-detail'
  selectedPlayerId: string | null
  isProcessingRound: boolean

  // Actions
  startGame: (playerNames: string[], maxRounds: number) => void
  setView: (view: 'setup' | 'game' | 'leaderboard' | 'player-detail') => void
  setSelectedPlayer: (playerId: string | null) => void
  executeTrade: (action: any) => { success: boolean; message: string } | void
  endTurn: () => Promise<{ gameOver?: boolean } | undefined>
  updateGameState: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  gameState: null,
  currentView: 'setup',
  selectedPlayerId: null,
  isProcessingRound: false,

  startGame: (playerNames: string[], maxRounds: number) => {
    const game = new GameEngine(playerNames, maxRounds)
    set({
      game,
      gameState: game.getGameState(),
      currentView: 'game',
    })
  },

  setView: (view) => set({ currentView: view }),

  setSelectedPlayer: (playerId) => set({ selectedPlayerId: playerId }),

  executeTrade: (action) => {
    const { game } = get()
    if (game) {
      const result = game.executeTrade(action)
      set({ gameState: game.getGameState() })
      return result
    }
    return { success: false, message: 'Game not initialized' }
  },

  endTurn: async () => {
    const { game } = get()
    if (game) {
      const result = game.endTurn()

      // If round ended, show processing spinner
      if (result.roundEnded) {
        set({ isProcessingRound: true })

        // Simulate processing delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 1500))

        set({
          gameState: game.getGameState(),
          isProcessingRound: false,
        })
      } else {
        set({ gameState: game.getGameState() })
      }

      return { gameOver: result.gameOver }
    }
    return undefined
  },

  updateGameState: () => {
    const { game } = get()
    if (game) {
      set({ gameState: game.getGameState() })
    }
  },
}))
