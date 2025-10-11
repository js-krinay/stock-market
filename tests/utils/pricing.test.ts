import { describe, it, expect } from 'vitest'
import {
  applyPriceImpact,
  calculatePriceChangePercentage,
  applyMultiplePriceImpacts,
  applyCashImpact,
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
})
