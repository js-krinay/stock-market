import { describe, it, expect } from 'vitest'
import {
  validateBuyTrade,
  validateSellTrade,
  calculateTradeCost,
  calculateNewAverageCost,
  calculateBuyPortfolioUpdate,
  calculateSellPortfolioUpdate,
  calculateSaleProfit,
  calculateHoldingValue,
  calculateUnrealizedProfit,
  calculateNetWorth,
} from '../../server/utils/trading'

describe('Trading Calculations', () => {
  describe('validateBuyTrade', () => {
    it('should validate successful buy', () => {
      const result = validateBuyTrade(10, 100, 1000, 2000)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject buy with insufficient funds', () => {
      const result = validateBuyTrade(10, 100, 1000, 500)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Insufficient funds')
    })

    it('should reject buy with insufficient stock availability', () => {
      const result = validateBuyTrade(100, 100, 50, 20000)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('available')
    })

    it('should reject buy with zero price', () => {
      const result = validateBuyTrade(10, 0, 1000, 2000)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('$0')
    })

    it('should reject buy with negative quantity', () => {
      const result = validateBuyTrade(-10, 100, 1000, 2000)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('positive')
    })
  })

  describe('validateSellTrade', () => {
    it('should validate successful sell', () => {
      const result = validateSellTrade(10, 100, 50)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject sell with no holdings', () => {
      const result = validateSellTrade(10, 100, 0)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('do not own')
    })

    it('should reject sell with insufficient holdings', () => {
      const result = validateSellTrade(100, 100, 50)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('only own')
    })

    it('should reject sell with zero price', () => {
      const result = validateSellTrade(10, 0, 50)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('$0')
    })
  })

  describe('calculateTradeCost', () => {
    it('should calculate total cost correctly', () => {
      const result = calculateTradeCost(10, 100)
      expect(result.totalCost).toBe(1000)
      expect(result.pricePerShare).toBe(100)
      expect(result.quantity).toBe(10)
    })

    it('should handle fractional prices', () => {
      const result = calculateTradeCost(10, 99.99)
      expect(result.totalCost).toBe(999.9)
    })
  })

  describe('calculateNewAverageCost', () => {
    it('should calculate average cost after buying more at same price', () => {
      const avgCost = calculateNewAverageCost(10, 100, 10, 100)
      expect(avgCost).toBe(100)
    })

    it('should calculate average cost after buying more at higher price', () => {
      const avgCost = calculateNewAverageCost(10, 100, 10, 120)
      expect(avgCost).toBe(110) // (10*100 + 10*120) / 20 = 110
    })

    it('should calculate average cost after buying more at lower price', () => {
      const avgCost = calculateNewAverageCost(10, 100, 10, 80)
      expect(avgCost).toBe(90) // (10*100 + 10*80) / 20 = 90
    })

    it('should handle first purchase (zero current quantity)', () => {
      const avgCost = calculateNewAverageCost(0, 0, 10, 100)
      expect(avgCost).toBe(100)
    })
  })

  describe('calculateBuyPortfolioUpdate', () => {
    it('should update portfolio after buy', () => {
      const update = calculateBuyPortfolioUpdate(10, 100, 10, 120)
      expect(update.newQuantity).toBe(20)
      expect(update.newAverageCost).toBe(110)
    })

    it('should handle first purchase', () => {
      const update = calculateBuyPortfolioUpdate(0, 0, 10, 100)
      expect(update.newQuantity).toBe(10)
      expect(update.newAverageCost).toBe(100)
    })
  })

  describe('calculateSellPortfolioUpdate', () => {
    it('should update portfolio after sell', () => {
      const update = calculateSellPortfolioUpdate(20, 100, 10)
      expect(update.newQuantity).toBe(10)
      expect(update.newAverageCost).toBe(100) // Average cost stays the same
    })

    it('should handle selling all shares', () => {
      const update = calculateSellPortfolioUpdate(10, 100, 10)
      expect(update.newQuantity).toBe(0)
      expect(update.newAverageCost).toBe(100)
    })
  })

  describe('calculateSaleProfit', () => {
    it('should calculate profit on profitable sale', () => {
      const profit = calculateSaleProfit(10, 120, 100)
      expect(profit).toBe(200) // (10 * 120) - (10 * 100) = 200
    })

    it('should calculate loss on unprofitable sale', () => {
      const profit = calculateSaleProfit(10, 80, 100)
      expect(profit).toBe(-200) // (10 * 80) - (10 * 100) = -200
    })

    it('should calculate zero profit on breakeven sale', () => {
      const profit = calculateSaleProfit(10, 100, 100)
      expect(profit).toBe(0)
    })
  })

  describe('calculateHoldingValue', () => {
    it('should calculate current value correctly', () => {
      const value = calculateHoldingValue(10, 100)
      expect(value).toBe(1000)
    })

    it('should handle zero shares', () => {
      const value = calculateHoldingValue(0, 100)
      expect(value).toBe(0)
    })
  })

  describe('calculateUnrealizedProfit', () => {
    it('should calculate unrealized profit', () => {
      const profit = calculateUnrealizedProfit(10, 120, 100)
      expect(profit).toBe(200) // (10 * 120) - (10 * 100) = 200
    })

    it('should calculate unrealized loss', () => {
      const profit = calculateUnrealizedProfit(10, 80, 100)
      expect(profit).toBe(-200)
    })

    it('should calculate zero for breakeven', () => {
      const profit = calculateUnrealizedProfit(10, 100, 100)
      expect(profit).toBe(0)
    })
  })

  describe('calculateNetWorth', () => {
    it('should calculate net worth correctly', () => {
      const netWorth = calculateNetWorth(5000, 10000)
      expect(netWorth).toBe(15000)
    })

    it('should handle zero portfolio', () => {
      const netWorth = calculateNetWorth(5000, 0)
      expect(netWorth).toBe(5000)
    })

    it('should handle zero cash', () => {
      const netWorth = calculateNetWorth(0, 10000)
      expect(netWorth).toBe(10000)
    })
  })
})
