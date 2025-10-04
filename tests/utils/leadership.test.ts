import { describe, it, expect } from 'vitest'
import {
  calculateOwnership,
  determineChairman,
  determineDirector,
  calculateLeadership,
} from '../../server/utils/leadership'

describe('Leadership Calculations', () => {
  describe('calculateOwnership', () => {
    it('should calculate ownership percentages correctly', () => {
      const players = [
        { id: 'p1', holdings: [{ symbol: 'TECH', quantity: 50000 }] },
        { id: 'p2', holdings: [{ symbol: 'TECH', quantity: 30000 }] },
        { id: 'p3', holdings: [{ symbol: 'BANK', quantity: 10000 }] },
      ]

      const ownership = calculateOwnership(players, 'TECH', 200000)

      expect(ownership).toHaveLength(3)
      expect(ownership[0]).toEqual({ playerId: 'p1', quantity: 50000, percentage: 25 })
      expect(ownership[1]).toEqual({ playerId: 'p2', quantity: 30000, percentage: 15 })
      expect(ownership[2]).toEqual({ playerId: 'p3', quantity: 0, percentage: 0 })
    })

    it('should sort by quantity descending', () => {
      const players = [
        { id: 'p1', holdings: [{ symbol: 'TECH', quantity: 10000 }] },
        { id: 'p2', holdings: [{ symbol: 'TECH', quantity: 50000 }] },
        { id: 'p3', holdings: [{ symbol: 'TECH', quantity: 30000 }] },
      ]

      const ownership = calculateOwnership(players, 'TECH', 200000)

      expect(ownership[0].playerId).toBe('p2') // Highest
      expect(ownership[1].playerId).toBe('p3') // Middle
      expect(ownership[2].playerId).toBe('p1') // Lowest
    })
  })

  describe('determineChairman', () => {
    it('should assign chairman when player owns ≥50%', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const chairman = determineChairman(ownership, null, 0.5)
      expect(chairman).toBe('p1')
    })

    it('should not assign chairman when no one owns ≥50%', () => {
      const ownership = [
        { playerId: 'p1', quantity: 80000, percentage: 40 },
        { playerId: 'p2', quantity: 60000, percentage: 30 },
      ]

      const chairman = determineChairman(ownership, null, 0.5)
      expect(chairman).toBeNull()
    })

    it('should keep existing chairman if they still qualify', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const chairman = determineChairman(ownership, 'p1', 0.5)
      expect(chairman).toBe('p1')
    })

    it('should replace chairman if they no longer qualify', () => {
      const ownership = [
        { playerId: 'p1', quantity: 120000, percentage: 60 },
        { playerId: 'p2', quantity: 40000, percentage: 20 },
      ]

      const chairman = determineChairman(ownership, 'p2', 0.5)
      expect(chairman).toBe('p1') // p2 doesn't qualify anymore
    })
  })

  describe('determineDirector', () => {
    it('should assign director when player owns ≥25% and is not chairman', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBe('p2')
    })

    it('should not assign director to chairman', () => {
      const ownership = [
        { playerId: 'p1', quantity: 120000, percentage: 60 },
        { playerId: 'p2', quantity: 40000, percentage: 20 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBeNull() // p1 is chairman, p2 < 25%
    })

    it('should keep existing director if they still qualify', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const director = determineDirector(ownership, 'p2', 'p1', 0.25)
      expect(director).toBe('p2')
    })

    it('should not assign director when no one qualifies', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 40000, percentage: 20 },
        { playerId: 'p3', quantity: 30000, percentage: 15 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBeNull()
    })
  })

  describe('calculateLeadership', () => {
    it('should calculate both chairman and director correctly', () => {
      const players = [
        { id: 'p1', holdings: [{ symbol: 'TECH', quantity: 100000 }] },
        { id: 'p2', holdings: [{ symbol: 'TECH', quantity: 50000 }] },
        { id: 'p3', holdings: [{ symbol: 'TECH', quantity: 30000 }] },
      ]

      const result = calculateLeadership(players, 'TECH', 200000, null, null, 0.5, 0.25)

      expect(result.chairmanId).toBe('p1') // 50%
      expect(result.directorId).toBe('p2') // 25%
    })

    it('should handle case with chairman but no director', () => {
      const players = [
        { id: 'p1', holdings: [{ symbol: 'TECH', quantity: 150000 }] },
        { id: 'p2', holdings: [{ symbol: 'TECH', quantity: 30000 }] },
      ]

      const result = calculateLeadership(players, 'TECH', 200000, null, null, 0.5, 0.25)

      expect(result.chairmanId).toBe('p1') // 75%
      expect(result.directorId).toBeNull() // p2 only has 15%
    })

    it('should handle case with no leadership', () => {
      const players = [
        { id: 'p1', holdings: [{ symbol: 'TECH', quantity: 40000 }] },
        { id: 'p2', holdings: [{ symbol: 'TECH', quantity: 30000 }] },
      ]

      const result = calculateLeadership(players, 'TECH', 200000, null, null, 0.5, 0.25)

      expect(result.chairmanId).toBeNull()
      expect(result.directorId).toBeNull()
    })
  })
})
