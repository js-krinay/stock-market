import { describe, it, expect } from 'vitest'
import * as pricing from '../../server/utils/pricing'
import * as trading from '../../server/utils/trading'
import * as leadership from '../../server/utils/leadership'
import * as events from '../../server/utils/events'
import * as corporateActions from '../../server/utils/corporateActions'

/**
 * Purity tests to ensure utils remain pure functions
 * Pure functions must:
 * 1. Be deterministic (same input = same output)
 * 2. Have no side effects (no mutations outside function scope)
 * 3. Not depend on external state
 */

describe('Utils Purity Verification', () => {
  describe('pricing.ts', () => {
    it('should be deterministic (same input = same output)', () => {
      const result1 = pricing.applyPriceImpact(100, 10, 0)
      const result2 = pricing.applyPriceImpact(100, 10, 0)
      expect(result1).toEqual(result2)

      const result3 = pricing.calculatePriceChangePercentage(100, 110)
      const result4 = pricing.calculatePriceChangePercentage(100, 110)
      expect(result3).toBe(result4)
    })

    it('should have no side effects (inputs unchanged)', () => {
      const impacts = [5, 10, -3]
      const originalImpacts = [...impacts]

      pricing.applyMultiplePriceImpacts(100, impacts, 0)

      // Original array should be unchanged
      expect(impacts).toEqual(originalImpacts)
    })

    it('should produce consistent results across multiple calls', () => {
      const results: number[] = []
      for (let i = 0; i < 10; i++) {
        results.push(pricing.applyCashImpact(1000, 5, 0))
      }
      // All results should be identical
      expect(new Set(results).size).toBe(1)
    })
  })

  describe('trading.ts', () => {
    it('should be deterministic', () => {
      const result1 = trading.validateBuyTrade(100, 50, 200, 10000)
      const result2 = trading.validateBuyTrade(100, 50, 200, 10000)
      expect(result1).toEqual(result2)
    })

    it('should produce consistent calculations', () => {
      const avgCost = trading.calculateNewAverageCost(100, 50, 50, 60)
      expect(avgCost).toBe((100 * 50 + 50 * 60) / 150)

      // Same calculation should produce same result
      const avgCost2 = trading.calculateNewAverageCost(100, 50, 50, 60)
      expect(avgCost2).toBe(avgCost)
    })

    it('should validate trades consistently', () => {
      const results: boolean[] = []
      for (let i = 0; i < 10; i++) {
        const result = trading.validateBuyTrade(100, 50, 200, 10000)
        results.push(result.isValid)
      }
      // All validations should be identical
      expect(new Set(results).size).toBe(1)
    })
  })

  describe('leadership.ts', () => {
    it('should be deterministic', () => {
      const ownership = [
        { playerId: '1', quantity: 100, percentage: 50 },
        { playerId: '2', quantity: 80, percentage: 40 },
        { playerId: '3', quantity: 20, percentage: 10 },
      ]

      const result1 = leadership.determineChairman(ownership, null, 0.5)
      const result2 = leadership.determineChairman(ownership, null, 0.5)
      expect(result1).toBe(result2)

      const result3 = leadership.determineDirector(ownership, null, null, 0.25)
      const result4 = leadership.determineDirector(ownership, null, null, 0.25)
      expect(result3).toBe(result4)
    })

    it('should not mutate ownership data', () => {
      const ownership = [
        { playerId: '1', quantity: 100, percentage: 50 },
        { playerId: '2', quantity: 80, percentage: 40 },
      ]
      const ownershipCopy = JSON.parse(JSON.stringify(ownership))

      leadership.determineChairman(ownership, null, 0.5)
      leadership.determineDirector(ownership, null, null, 0.25)

      // Ownership should remain unchanged
      expect(ownership).toEqual(ownershipCopy)
    })

    it('should handle tie-breaking consistently', () => {
      const ownership = [
        { playerId: '1', quantity: 100, percentage: 50 },
        { playerId: '2', quantity: 100, percentage: 50 },
      ]

      // With current chairman
      const result1 = leadership.determineChairman(ownership, '1', 0.5)
      expect(result1).toBe('1') // Should retain current

      // Multiple calls should be consistent
      const result2 = leadership.determineChairman(ownership, '1', 0.5)
      expect(result2).toBe(result1)
    })

    it('should calculate ownership consistently', () => {
      const players = [
        { id: '1', holdings: [{ symbol: 'TECH', quantity: 100 }] },
        { id: '2', holdings: [{ symbol: 'TECH', quantity: 50 }] },
      ]

      const result1 = leadership.calculateOwnership(players, 'TECH', 200)
      const result2 = leadership.calculateOwnership(players, 'TECH', 200)

      expect(result1).toEqual(result2)
    })
  })

  describe('events.ts', () => {
    it('should be deterministic', () => {
      const result1 = events.computeEventSeverity(5)
      const result2 = events.computeEventSeverity(5)
      expect(result1).toBe(result2)
      expect(result1).toBe('low')

      const result3 = events.calculateEventWeight('medium')
      const result4 = events.calculateEventWeight('medium')
      expect(result3).toBe(result4)
    })

    it('should compute severity consistently', () => {
      expect(events.computeEventSeverity(5)).toBe('low')
      expect(events.computeEventSeverity(10)).toBe('medium')
      expect(events.computeEventSeverity(15)).toBe('medium')
      expect(events.computeEventSeverity(20)).toBe('high')
      expect(events.computeEventSeverity(25)).toBe('high')
      expect(events.computeEventSeverity(30)).toBe('extreme')

      // Multiple calls should be identical
      const results: string[] = []
      for (let i = 0; i < 10; i++) {
        results.push(events.computeEventSeverity(10))
      }
      expect(new Set(results).size).toBe(1)
    })

    it('should check rare events consistently', () => {
      expect(events.isRareEvent('crash')).toBe(true)
      expect(events.isRareEvent('bull_run')).toBe(true)
      expect(events.isRareEvent('normal')).toBe(false)

      // Should be deterministic
      const result1 = events.isRareEvent('crash')
      const result2 = events.isRareEvent('crash')
      expect(result1).toBe(result2)
    })

    it('should check stock affection consistently', () => {
      const affectedStocks = ['TECH', 'BANK']
      const result1 = events.doesEventAffectStock(affectedStocks, 'TECH')
      const result2 = events.doesEventAffectStock(affectedStocks, 'TECH')
      expect(result1).toBe(result2)
      expect(result1).toBe(true)

      const result3 = events.doesEventAffectStock(affectedStocks, 'REAL')
      expect(result3).toBe(false)
    })
  })

  describe('corporateActions.ts', () => {
    it('should be deterministic for dividend calculations', () => {
      const shareholders: corporateActions.ShareholderHolding[] = [
        { playerId: '1', playerName: 'Alice', quantity: 100, averageCost: 50 },
        { playerId: '2', playerName: 'Bob', quantity: 50, averageCost: 48 },
      ]

      const result1 = corporateActions.calculateDividendDistribution(100, shareholders, 'TECH')
      const result2 = corporateActions.calculateDividendDistribution(100, shareholders, 'TECH')

      expect(result1).toEqual(result2)
    })

    it('should not mutate shareholder data', () => {
      const shareholders: corporateActions.ShareholderHolding[] = [
        { playerId: '1', playerName: 'Alice', quantity: 100, averageCost: 50 },
      ]
      const shareholdersCopy = JSON.parse(JSON.stringify(shareholders))

      corporateActions.calculateDividendDistribution(100, shareholders, 'TECH')

      expect(shareholders).toEqual(shareholdersCopy)
    })

    it('should calculate dividends consistently', () => {
      const shareholders: corporateActions.ShareholderHolding[] = [
        { playerId: '1', playerName: 'Alice', quantity: 100, averageCost: 50 },
      ]

      const stockPrice = 100
      const expectedDividend = 100 * (stockPrice * 0.05) // 100 shares * $5 per share

      const result = corporateActions.calculateDividendDistribution(
        stockPrice,
        shareholders,
        'TECH'
      )
      expect(result[0].dividendAmount).toBe(expectedDividend)

      // Multiple calls should be identical
      const result2 = corporateActions.calculateDividendDistribution(
        stockPrice,
        shareholders,
        'TECH'
      )
      expect(result2).toEqual(result)
    })

    it('should be deterministic for bonus issue calculations', () => {
      const shareholders: corporateActions.ShareholderHolding[] = [
        { playerId: '1', playerName: 'Alice', quantity: 100, averageCost: 50 },
      ]

      const bonusDetails = { ratio: 1, baseShares: 10 }

      const result1 = corporateActions.calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        200000
      )
      const result2 = corporateActions.calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        200000
      )

      expect(result1).toEqual(result2)
    })

    it('should handle edge cases consistently', () => {
      const shareholders: corporateActions.ShareholderHolding[] = []

      const result = corporateActions.calculateDividendDistribution(100, shareholders, 'TECH')
      expect(result).toEqual([])

      // Empty shareholders should always return empty array
      const result2 = corporateActions.calculateDividendDistribution(100, shareholders, 'TECH')
      expect(result2).toEqual(result)
    })
  })

  describe('Cross-module purity', () => {
    it('should maintain purity when functions are composed', () => {
      // Test that combining pure functions maintains purity

      // Scenario: Validate trade
      const stockPrice = 100
      const quantity = 50
      const playerCash = 10000

      const validation = trading.validateBuyTrade(quantity, stockPrice, 200, playerCash)

      // Same inputs should produce same results
      const validation2 = trading.validateBuyTrade(quantity, stockPrice, 200, playerCash)

      expect(validation).toEqual(validation2)
    })

    it('should not have shared state between function calls', () => {
      // Call functions multiple times to ensure no state leaks

      const calls = 5
      const results: any[] = []

      for (let i = 0; i < calls; i++) {
        const priceImpact = pricing.applyPriceImpact(100, 10, 0)
        const severity = events.computeEventSeverity(10)

        results.push({ priceImpact, severity })
      }

      // All calls should produce identical results
      const firstResult = results[0]
      for (const result of results) {
        expect(result).toEqual(firstResult)
      }
    })
  })
})
