import { create } from 'zustand'
import { GameState } from '../types'

interface GameStore {
  gameId: string | null
  gameState: GameState | null
  currentView: 'setup' | 'game' | 'leaderboard' | 'player-detail'
  selectedPlayerId: string | null
  isProcessingRound: boolean

  // Actions
  setGameId: (gameId: string) => void
  setGameState: (gameState: GameState) => void
  setView: (view: 'setup' | 'game' | 'leaderboard' | 'player-detail') => void
  setSelectedPlayer: (playerId: string | null) => void
  setProcessingRound: (isProcessing: boolean) => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameId: null,
  gameState: null,
  currentView: 'setup',
  selectedPlayerId: null,
  isProcessingRound: false,

  setGameId: (gameId) => set({ gameId }),
  setGameState: (gameState) => set({ gameState }),
  setView: (view) => set({ currentView: view }),
  setSelectedPlayer: (playerId) => set({ selectedPlayerId: playerId }),
  setProcessingRound: (isProcessing) => set({ isProcessingRound: isProcessing }),
}))
