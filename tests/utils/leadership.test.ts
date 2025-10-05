import { describe, it, expect } from 'vitest'
import {
  calculateOwnership,
  determineChairman,
  determineDirector,
  calculateLeadership,
} from '../../server/utils/leadership'

/**
 * Leadership Calculation Tests
 *
 * These tests verify the core leadership logic:
 * - Chairman: Player with ≥50% ownership
 * - Director: Player with ≥25% ownership (but not chairman)
 *
 * Test Scenarios Covered:
 * 1. Ownership calculation (percentage from quantity)
 * 2. Chairman assignment (≥50% threshold)
 * 3. Director assignment (≥25% threshold, cannot be chairman)
 * 4. Leadership transitions (keeping/replacing when thresholds change)
 * 5. Edge cases (no leadership, multiple qualified players)
 */

describe('Leadership Calculations', () => {
  describe('calculateOwnership', () => {
    /**
     * Scenario: Basic ownership calculation
     * - P1 owns 50k/200k TECH = 25%
     * - P2 owns 30k/200k TECH = 15%
     * - P3 owns 0/200k TECH = 0% (owns different stock)
     */
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

    /**
     * Scenario: Ownership sorting
     * - Players entered in mixed order
     * - Should return sorted by quantity (highest to lowest)
     * - P2 (50k) → P3 (30k) → P1 (10k)
     */
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
    /**
     * Scenario: New chairman appointment
     * - P1 owns exactly 50% (100k/200k)
     * - P1 qualifies as chairman (≥50% threshold)
     * - No previous chairman exists
     */
    it('should assign chairman when player owns ≥50%', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const chairman = determineChairman(ownership, null, 0.5)
      expect(chairman).toBe('p1')
    })

    /**
     * Scenario: No chairman (distributed ownership)
     * - P1 owns 40% (below 50% threshold)
     * - P2 owns 30% (below 50% threshold)
     * - No one qualifies as chairman
     */
    it('should not assign chairman when no one owns ≥50%', () => {
      const ownership = [
        { playerId: 'p1', quantity: 80000, percentage: 40 },
        { playerId: 'p2', quantity: 60000, percentage: 30 },
      ]

      const chairman = determineChairman(ownership, null, 0.5)
      expect(chairman).toBeNull()
    })

    /**
     * Scenario: Two-way tie for chairman position
     * - P1 is current chairman with 50%
     * - P2 owns 50% (tied)
     * - Result: Should retain existing chairman in case of tie
     */
    it('should retain existing chairman when there is a tie', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 }, // Existing chairman
        { playerId: 'p2', quantity: 100000, percentage: 50 }, // Tied
      ]

      const chairman = determineChairman(ownership, 'p1', 0.5)
      expect(chairman).toBe('p1') // P1 retained as chairman due to tie
    })

    /**
     * Scenario: Chairman replacement when another player owns more
     * - P1 is existing chairman with 50%
     * - P2 owns 60% (more than P1)
     * - P2 should become new chairman (highest qualifying shareholder)
     */
    it('should replace chairman when another player owns more shares', () => {
      const ownership = [
        { playerId: 'p2', quantity: 120000, percentage: 60 }, // Higher ownership
        { playerId: 'p1', quantity: 100000, percentage: 50 }, // Existing chairman
      ]

      const chairman = determineChairman(ownership, 'p1', 0.5)
      expect(chairman).toBe('p2') // P2 becomes chairman (highest qualifying)
    })

    /**
     * Scenario: Chairman retention
     * - P1 is existing chairman
     * - P1 still owns 50% (still qualifies)
     * - P1 should remain chairman (stability)
     */
    it('should keep existing chairman if they still qualify', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const chairman = determineChairman(ownership, 'p1', 0.5)
      expect(chairman).toBe('p1')
    })

    /**
     * Scenario: Chairman replacement (hostile takeover)
     * - P2 was chairman but now only owns 20%
     * - P1 bought more stock and now owns 60%
     * - P1 becomes new chairman (P2 lost majority)
     */
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
    /**
     * Scenario: Director appointment (second-largest shareholder)
     * - P1 is chairman with 50%
     * - P2 owns 25% (qualifies as director)
     * - P2 becomes director (cannot be both chairman and director)
     */
    it('should assign director when player owns ≥25% and is not chairman', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBe('p2')
    })

    /**
     * Scenario: Chairman cannot also be director
     * - P1 owns 60% (is chairman)
     * - P2 owns 20% (below 25% threshold)
     * - P1 excluded from director role (already chairman)
     * - No one else qualifies → no director
     */
    it('should not assign director to chairman', () => {
      const ownership = [
        { playerId: 'p1', quantity: 120000, percentage: 60 },
        { playerId: 'p2', quantity: 40000, percentage: 20 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBeNull() // p1 is chairman, p2 < 25%
    })

    /**
     * Scenario: Director assignment to highest qualifier
     * - P1 is chairman with 50%
     * - P2 owns exactly 25% (qualifies for director)
     * - P2 should be director (highest non-chairman shareholder)
     * - Director position always goes to top qualified holder
     */
    it('should assign director to highest qualifying non-chairman shareholder', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 50000, percentage: 25 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBe('p2')
    })

    /**
     * Scenario: No director (low ownership distribution)
     * - P1 is chairman with 50%
     * - P2 owns 20%, P3 owns 15% (both below 25%)
     * - No one qualifies as director
     */
    it('should not assign director when no one qualifies', () => {
      const ownership = [
        { playerId: 'p1', quantity: 100000, percentage: 50 },
        { playerId: 'p2', quantity: 40000, percentage: 20 },
        { playerId: 'p3', quantity: 30000, percentage: 15 },
      ]

      const director = determineDirector(ownership, null, 'p1', 0.25)
      expect(director).toBeNull()
    })

    /**
     * Scenario: Director replacement by higher shareholder
     * - P1 is existing director with 30%
     * - P2 owns 35% (more than P1)
     * - P2 should become new director (highest qualifying shareholder)
     * - Director position goes to top qualified holder, not based on stability
     */
    it('should replace director when another player owns more shares', () => {
      const ownership = [
        { playerId: 'p2', quantity: 70000, percentage: 35 }, // Higher ownership
        { playerId: 'p1', quantity: 60000, percentage: 30 }, // Existing director
      ]

      const director = determineDirector(ownership, 'p1', null, 0.25)
      expect(director).toBe('p2') // P2 becomes director (highest qualifying)
    })

    /**
     * Scenario: Three-way tie for director position
     * - P1 is current director with 30%
     * - P2 owns 30% (tied)
     * - P3 owns 30% (tied)
     * - Result: Should retain existing director in case of tie
     */
    it('should retain existing director when there is a tie', () => {
      const ownership = [
        { playerId: 'p1', quantity: 60000, percentage: 30 }, // Existing director
        { playerId: 'p2', quantity: 60000, percentage: 30 }, // Tied
        { playerId: 'p3', quantity: 60000, percentage: 30 }, // Tied
      ]

      const director = determineDirector(ownership, 'p1', null, 0.25)
      expect(director).toBe('p1') // P1 retained as director due to tie
    })
  })

  describe('calculateLeadership', () => {
    /**
     * Scenario: Full leadership (chairman + director)
     * - P1 owns 100k/200k = 50% → Chairman
     * - P2 owns 50k/200k = 25% → Director
     * - P3 owns 30k/200k = 15% → Neither
     * - Result: Both positions filled
     */
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

    /**
     * Scenario: Chairman only (majority holder, no qualifying director)
     * - P1 owns 150k/200k = 75% → Chairman
     * - P2 owns 30k/200k = 15% → Below director threshold
     * - Result: Chairman exists, no director
     */
    it('should handle case with chairman but no director', () => {
      const players = [
        { id: 'p1', holdings: [{ symbol: 'TECH', quantity: 150000 }] },
        { id: 'p2', holdings: [{ symbol: 'TECH', quantity: 30000 }] },
      ]

      const result = calculateLeadership(players, 'TECH', 200000, null, null, 0.5, 0.25)

      expect(result.chairmanId).toBe('p1') // 75%
      expect(result.directorId).toBeNull() // p2 only has 15%
    })

    /**
     * Scenario: No leadership (fragmented ownership)
     * - P1 owns 40k/200k = 20% → Below both thresholds
     * - P2 owns 30k/200k = 15% → Below both thresholds
     * - Remaining 130k distributed/available
     * - Result: No chairman, no director
     */
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
