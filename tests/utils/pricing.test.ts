import { describe, it, expect } from 'vitest'
import {
  applyPriceImpact,
  calculatePriceChangePercentage,
  applyMultiplePriceImpacts,
  applyPercentageChange,
  applyCashImpact,
  calculateStockImpacts,
} from '../../server/utils/pricing'

describe('Pricing Calculations', () => {
  describe('applyPriceImpact', () => {
    it('should apply positive impact correctly', () => {
      const result = applyPriceImpact(100, 10)
      expect(result.newPrice).toBe(110)
      expect(result.absoluteChange).toBe(10)
      expect(result.percentageChange).toBe(10)
    })

    it('should apply negative impact correctly', () => {
      const result = applyPriceImpact(100, -10)
      expect(result.newPrice).toBe(90)
      expect(result.absoluteChange).toBe(-10)
      expect(result.percentageChange).toBe(-10)
    })

    it('should enforce minimum price', () => {
      const result = applyPriceImpact(50, -100, 0)
      expect(result.newPrice).toBe(0)
      expect(result.absoluteChange).toBe(-50)
    })

    it('should round to 2 decimal places', () => {
      const result = applyPriceImpact(100.123, 10.456)
      expect(result.newPrice).toBe(110.58)
    })
  })

  describe('calculatePriceChangePercentage', () => {
    it('should calculate percentage increase', () => {
      const percentage = calculatePriceChangePercentage(100, 120)
      expect(percentage).toBe(20)
    })

    it('should calculate percentage decrease', () => {
      const percentage = calculatePriceChangePercentage(100, 80)
      expect(percentage).toBe(-20)
    })

    it('should handle zero old price', () => {
      const percentage = calculatePriceChangePercentage(0, 100)
      expect(percentage).toBe(0)
    })

    it('should handle no change', () => {
      const percentage = calculatePriceChangePercentage(100, 100)
      expect(percentage).toBe(0)
    })
  })

  describe('applyMultiplePriceImpacts', () => {
    it('should sum multiple impacts', () => {
      const result = applyMultiplePriceImpacts(100, [10, 5, -3])
      expect(result.newPrice).toBe(112)
      expect(result.absoluteChange).toBe(12)
      expect(result.percentageChange).toBe(12)
    })

    it('should handle all negative impacts', () => {
      const result = applyMultiplePriceImpacts(100, [-10, -5, -3])
      expect(result.newPrice).toBe(82)
      expect(result.absoluteChange).toBe(-18)
    })

    it('should handle empty impacts array', () => {
      const result = applyMultiplePriceImpacts(100, [])
      expect(result.newPrice).toBe(100)
      expect(result.absoluteChange).toBe(0)
    })

    it('should enforce minimum price', () => {
      const result = applyMultiplePriceImpacts(50, [-30, -30, -30], 0)
      expect(result.newPrice).toBe(0)
    })
  })

  describe('applyPercentageChange', () => {
    it('should apply positive percentage change', () => {
      const result = applyPercentageChange(100, 10)
      expect(result.newPrice).toBe(110)
      expect(result.percentageChange).toBe(10)
    })

    it('should apply negative percentage change', () => {
      const result = applyPercentageChange(100, -10)
      expect(result.newPrice).toBe(90)
      expect(result.percentageChange).toBe(-10)
    })

    it('should handle inflation scenario', () => {
      const result = applyPercentageChange(100, -5) // 5% inflation (negative)
      expect(result.newPrice).toBe(95)
    })

    it('should handle deflation scenario', () => {
      const result = applyPercentageChange(100, 5) // 5% deflation (positive)
      expect(result.newPrice).toBe(105)
    })
  })

  describe('applyCashImpact', () => {
    it('should apply positive cash impact', () => {
      const newCash = applyCashImpact(10000, 5)
      expect(newCash).toBe(10500) // 10000 + 5% = 10500
    })

    it('should apply negative cash impact', () => {
      const newCash = applyCashImpact(10000, -5)
      expect(newCash).toBe(9500) // 10000 - 5% = 9500
    })

    it('should enforce minimum cash', () => {
      const newCash = applyCashImpact(100, -200, 0)
      expect(newCash).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      const newCash = applyCashImpact(10000, 3.333)
      expect(newCash).toBe(10333.3)
    })
  })

  describe('calculateStockImpacts', () => {
    it('should calculate impacts for multiple stocks', () => {
      const stocks = [
        { symbol: 'TECH', price: 100 },
        { symbol: 'BANK', price: 50 },
        { symbol: 'ENRG', price: 75 },
      ]

      const events = [
        { affectedStocks: ['TECH'], impact: 10 },
        { affectedStocks: ['TECH', 'BANK'], impact: 5 },
        { affectedStocks: ['BANK'], impact: -3 },
      ]

      const impacts = calculateStockImpacts(stocks, events)

      expect(impacts.get('TECH')?.newPrice).toBe(115) // 100 + 10 + 5
      expect(impacts.get('BANK')?.newPrice).toBe(52) // 50 + 5 - 3
      expect(impacts.get('ENRG')?.newPrice).toBe(75) // No events
    })

    it('should handle stock with no impacts', () => {
      const stocks = [{ symbol: 'TECH', price: 100 }]
      const events = [{ affectedStocks: ['BANK'], impact: 10 }]

      const impacts = calculateStockImpacts(stocks, events)

      expect(impacts.get('TECH')?.newPrice).toBe(100) // No change
      expect(impacts.get('TECH')?.absoluteChange).toBe(0)
    })

    it('should handle empty events', () => {
      const stocks = [{ symbol: 'TECH', price: 100 }]
      const events: Array<{ affectedStocks: string[]; impact: number }> = []

      const impacts = calculateStockImpacts(stocks, events)

      expect(impacts.get('TECH')?.newPrice).toBe(100)
    })

    it('should accumulate multiple impacts correctly', () => {
      const stocks = [{ symbol: 'TECH', price: 100 }]
      const events = [
        { affectedStocks: ['TECH'], impact: 10 },
        { affectedStocks: ['TECH'], impact: 5 },
        { affectedStocks: ['TECH'], impact: -3 },
      ]

      const impacts = calculateStockImpacts(stocks, events)

      expect(impacts.get('TECH')?.newPrice).toBe(112) // 100 + 10 + 5 - 3
      expect(impacts.get('TECH')?.absoluteChange).toBe(12)
    })
  })
})
