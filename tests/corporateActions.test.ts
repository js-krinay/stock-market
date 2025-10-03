import { describe, it, expect } from 'vitest'
import {
  calculateDividendDistribution,
  calculateBonusIssueDistribution,
  ShareholderHolding,
} from '../server/utils/corporateActions'
import { MAX_STOCK_QUANTITY } from '../server/constants'

describe('Corporate Actions Business Logic', () => {
  describe('calculateDividendDistribution', () => {
    // Test Scenario: Single shareholder receives dividend
    // Given: Stock price is $100, shareholder owns 100 shares
    // When: Dividend is calculated at 5% of stock price per share
    // Then: Shareholder receives $500 (100 shares × $5 per share)
    it('should calculate dividend as 5% of stock price per share', () => {
      const stockPrice = 100
      const shareholders: ShareholderHolding[] = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 90,
        },
      ]

      const result = calculateDividendDistribution(stockPrice, shareholders, 'TECH')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        playerId: 'player1',
        playerName: 'Alice',
        symbol: 'TECH',
        quantity: 100,
        dividendAmount: 500, // 100 shares * (100 * 0.05)
      })
    })

    // Test Scenario: Multiple shareholders with different holdings receive proportional dividends
    // Given: Stock price is $50, three shareholders with 100, 200, and 50 shares respectively
    // When: Dividend is distributed
    // Then: Each receives dividend proportional to their holdings ($250, $500, $125)
    it('should distribute dividends to multiple shareholders', () => {
      const stockPrice = 50
      const shareholders: ShareholderHolding[] = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 45,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 200,
          averageCost: 48,
        },
        {
          playerId: 'player3',
          playerName: 'Charlie',
          quantity: 50,
          averageCost: 50,
        },
      ]

      const result = calculateDividendDistribution(stockPrice, shareholders, 'BANK')

      expect(result).toHaveLength(3)
      expect(result[0].dividendAmount).toBe(250) // 100 * (50 * 0.05)
      expect(result[1].dividendAmount).toBe(500) // 200 * (50 * 0.05)
      expect(result[2].dividendAmount).toBe(125) // 50 * (50 * 0.05)
    })

    // Test Scenario: Shareholders with zero holdings are excluded from dividend
    // Given: Two shareholders, one with 100 shares and one with 0 shares
    // When: Dividend is calculated
    // Then: Only the shareholder with holdings receives dividend
    it('should exclude shareholders with zero quantity', () => {
      const stockPrice = 100
      const shareholders: ShareholderHolding[] = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 0,
          averageCost: 0,
        },
      ]

      const result = calculateDividendDistribution(stockPrice, shareholders, 'TECH')

      expect(result).toHaveLength(1)
      expect(result[0].playerId).toBe('player1')
    })

    // Test Scenario: Dividend amounts are rounded to 2 decimal places
    // Given: Stock price $33.33 results in dividend per share of $1.6665
    // When: Shareholder with 7 shares receives dividend
    // Then: Amount is rounded to $11.67 (not $11.6655)
    it('should round dividend amount to 2 decimal places', () => {
      const stockPrice = 33.33
      const shareholders: ShareholderHolding[] = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 7,
          averageCost: 30,
        },
      ]

      const result = calculateDividendDistribution(stockPrice, shareholders, 'TECH')

      expect(result[0].dividendAmount).toBe(11.67) // 7 * (33.33 * 0.05) = 11.6655 rounded to 11.67
    })

    // Test Scenario: Empty shareholder list returns no distributions
    // Given: No shareholders exist
    // When: Dividend is calculated
    // Then: Returns empty array
    it('should handle empty shareholders array', () => {
      const result = calculateDividendDistribution(100, [], 'TECH')
      expect(result).toHaveLength(0)
    })
  })

  describe('calculateBonusIssueDistribution', () => {
    // Test Scenario: Basic 1:5 bonus issue calculation
    // Given: Shareholder owns 50 shares, bonus ratio is 1:5
    // When: Bonus issue is calculated
    // Then: Shareholder receives 10 bonus shares (50÷5×1), total becomes 60 shares
    //       Average cost reduces from $90 to $75 due to free shares
    it('should calculate bonus shares based on 1:5 ratio', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 50,
          averageCost: 90,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0]).toEqual({
        playerId: 'player1',
        playerName: 'Alice',
        symbol: 'TECH',
        originalQuantity: 50,
        bonusShares: 10, // Math.floor(50/5) * 1
        newQuantity: 60,
        newAverageCost: 75, // (90 * 50) / 60
      })
      expect(result.totalBonusShares).toBe(10)
      expect(result.wouldExceedLimit).toBe(false)
    })

    // Test Scenario: 1:10 bonus ratio with average cost calculation
    // Given: Shareholder owns 100 shares at $50 average cost, ratio is 1:10
    // When: Bonus issue is processed
    // Then: Receives 10 bonus shares, total becomes 110, average cost drops to $45.45
    it('should calculate bonus shares based on 1:10 ratio', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 50,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 10 }

      const result = calculateBonusIssueDistribution(shareholders, 'BANK', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0].bonusShares).toBe(10) // Math.floor(100/10) * 1
      expect(result.distributions[0].newQuantity).toBe(110)
      expect(result.distributions[0].newAverageCost).toBe(45.45) // (50 * 100) / 110 = 45.45
    })

    // Test Scenario: 2:5 bonus ratio (higher bonus multiplier)
    // Given: Shareholder owns 50 shares, ratio is 2:5 (2 bonus shares for every 5 held)
    // When: Bonus issue is calculated
    // Then: Receives 20 bonus shares (50÷5×2), total becomes 70
    it('should calculate bonus shares based on 2:5 ratio', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 50,
          averageCost: 80,
        },
      ]
      const bonusDetails = { ratio: 2, baseShares: 5 }

      const result = calculateBonusIssueDistribution(shareholders, 'ENRG', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0].bonusShares).toBe(20) // Math.floor(50/5) * 2
      expect(result.distributions[0].newQuantity).toBe(70)
    })

    // Test Scenario: Multiple shareholders receive proportional bonus shares
    // Given: Three shareholders with 100, 50, and 25 shares, ratio is 1:5
    // When: Bonus issue is distributed
    // Then: They receive 20, 10, and 5 bonus shares respectively (total 35)
    it('should distribute bonus shares to multiple shareholders', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 50,
          averageCost: 95,
        },
        {
          playerId: 'player3',
          playerName: 'Charlie',
          quantity: 25,
          averageCost: 88,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions).toHaveLength(3)
      expect(result.distributions[0].bonusShares).toBe(20) // 100 shares
      expect(result.distributions[1].bonusShares).toBe(10) // 50 shares
      expect(result.distributions[2].bonusShares).toBe(5) // 25 shares
      expect(result.totalBonusShares).toBe(35)
    })

    // Test Scenario: Fractional bonus shares are floored down
    // Given: Shareholder owns 47 shares, ratio is 1:10
    // When: Bonus calculation results in 4.7 shares
    // Then: Floored down to 4 bonus shares (47÷10 = 4.7 → 4)
    it('should floor bonus shares calculation', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 47,
          averageCost: 90,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 10 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0].bonusShares).toBe(4) // Math.floor(47/10) * 1 = 4
      expect(result.distributions[0].newQuantity).toBe(51)
    })

    // Test Scenario: Shareholders with insufficient shares receive no bonus
    // Given: Two shareholders with 50 and 4 shares, ratio is 1:10
    // When: Bonus is calculated
    // Then: Only shareholder with 50 shares qualifies (4 shares insufficient for 1:10 ratio)
    it('should exclude shareholders with insufficient shares for bonus', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 50,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 4,
          averageCost: 95,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 10 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0].playerId).toBe('player1')
    })

    // Test Scenario: Zero quantity shareholders are excluded
    // Given: Two shareholders, one with 100 shares and one with 0
    // When: Bonus is calculated
    // Then: Only shareholder with holdings receives bonus
    it('should exclude shareholders with zero quantity', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 0,
          averageCost: 0,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0].playerId).toBe('player1')
    })

    // Test Scenario: Average cost is rounded to 2 decimal places
    // Given: Shareholder owns 37 shares at $91.23, receives 7 bonus shares
    // When: New average cost is calculated as (91.23 × 37) ÷ 44
    // Then: Result 76.7159... is rounded to $76.72
    it('should round new average cost to 2 decimal places', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 37,
          averageCost: 91.23,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions).toHaveLength(1)
      expect(result.distributions[0].bonusShares).toBe(7) // Math.floor(37/5) * 1
      expect(result.distributions[0].newQuantity).toBe(44)
      // (91.23 * 37) / 44 = 76.72 (rounded)
      expect(result.distributions[0].newAverageCost).toBe(76.72)
    })

    // Test Scenario: Empty shareholder list returns no distributions
    // Given: No shareholders exist
    // When: Bonus issue is calculated
    // Then: Returns empty distributions with 0 total bonus shares
    it('should handle empty shareholders array', () => {
      const bonusDetails = { ratio: 1, baseShares: 5 }
      const result = calculateBonusIssueDistribution([], 'TECH', bonusDetails)
      expect(result.distributions).toHaveLength(0)
      expect(result.totalBonusShares).toBe(0)
    })

    it('should correctly calculate average cost reduction', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100,
          averageCost: 100,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 10 }

      const result = calculateBonusIssueDistribution(shareholders, 'TECH', bonusDetails)

      expect(result.distributions[0].originalQuantity).toBe(100)
      expect(result.distributions[0].bonusShares).toBe(10)
      expect(result.distributions[0].newQuantity).toBe(110)
      // Original investment: 100 * 100 = 10000
      // New average cost: 10000 / 110 = 90.91
      expect(result.distributions[0].newAverageCost).toBe(90.91)
      // Verify average cost decreased
      expect(result.distributions[0].newAverageCost).toBeLessThan(100)
    })

    // Test Scenario: Bonus issue within MAX_STOCK_QUANTITY limit
    // Given: Current issued 150,000 shares, bonus would add 30,000 shares
    // When: Validation checks against 200,000 limit
    // Then: Allowed because 150,000 + 30,000 = 180,000 < 200,000
    //       Alice: 100,000 → 120,000 shares (receives 20,000 bonus)
    //       Bob: 50,000 → 60,000 shares (receives 10,000 bonus)
    it('should detect when bonus issue would exceed MAX_STOCK_QUANTITY', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100000,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 50000,
          averageCost: 95,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        MAX_STOCK_QUANTITY
      )

      expect(result.currentIssuedQuantity).toBe(150000) // Auto-calculated from holdings
      expect(result.totalBonusShares).toBe(30000) // Math.floor(100000/5) * 1 + Math.floor(50000/5) * 1
      expect(result.wouldExceedLimit).toBe(false) // 150000 + 30000 = 180000 < 200000
      expect(result.maxStockQuantity).toBe(MAX_STOCK_QUANTITY)

      // Verify final share holdings for each player
      // Alice: 100,000 → 120,000 shares
      expect(result.distributions[0].newQuantity).toBe(120000)
      expect(result.distributions[0].newAverageCost).toBe(75) // (90 * 100000) / 120000

      // Bob: 50,000 → 60,000 shares
      expect(result.distributions[1].newQuantity).toBe(60000)
      expect(result.distributions[1].newAverageCost).toBe(79.17) // (95 * 50000) / 60000 = 79.166... rounded to 79.17
    })

    // Test Scenario: Bonus issue would exceed MAX_STOCK_QUANTITY - scaled down
    // Given: Current issued 180,000 shares, intended bonus 36,000 shares
    // When: Would exceed 200,000 limit by 16,000 (only 20,000 available)
    // Then: Bonus scaled down proportionally to fit within limit
    //       Scaling factor: 20,000 / 36,000 = 0.5556
    //       Alice: 30,000 × 0.5556 = 16,667 shares (maintains 83.33%)
    //       Bob: 6,000 × 0.5556 = 3,333 shares (maintains 16.67%)
    it('should scale down bonus when total would exceed limit', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 150000,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 30000,
          averageCost: 95,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        MAX_STOCK_QUANTITY
      )

      expect(result.currentIssuedQuantity).toBe(180000)
      expect(result.wouldExceedLimit).toBe(true) // Flagged as exceeding

      // Bonus scaled down to fit within available 20,000 shares
      // Alice: floor(30,000 × (20,000/36,000)) = floor(16,666.67) = 16,666
      // Bob: floor(6,000 × (20,000/36,000)) = floor(3,333.33) = 3,333
      expect(result.totalBonusShares).toBe(16666 + 3333) // 19,999 (slightly under due to floor)

      // Verify Alice's scaled distribution
      expect(result.distributions[0].bonusShares).toBe(16666)
      expect(result.distributions[0].newQuantity).toBe(166666)

      // Verify Bob's scaled distribution
      expect(result.distributions[1].bonusShares).toBe(3333)
      expect(result.distributions[1].newQuantity).toBe(33333)

      // Verify ownership percentages are maintained
      const totalAfter = 166666 + 33333
      expect(166666 / totalAfter).toBeCloseTo(0.8333, 4) // Alice: 83.33%
      expect(33333 / totalAfter).toBeCloseTo(0.1667, 4) // Bob: 16.67%
    })

    // Test Scenario: Different bonus ratio (2:7) exceeding limit - scaled down
    // Given: Alice 150,000 (83.33%), Bob 30,000 (16.67%), total 180,000
    // When: 2:7 ratio would give 42,856 + 8,570 = 51,426 bonus (exceeds by 31,426)
    // Then: Scaled down to fit 20,000 available, maintaining percentages
    it('should scale down 2:7 ratio bonus and maintain percentages', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 150000,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 30000,
          averageCost: 95,
        },
      ]
      const bonusDetails = { ratio: 2, baseShares: 7 }

      const result = calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        MAX_STOCK_QUANTITY
      )

      expect(result.currentIssuedQuantity).toBe(180000)
      expect(result.wouldExceedLimit).toBe(true)

      // Intended: Alice 42,856, Bob 8,570, Total 51,426
      // Available: 20,000
      // Scaling factor: 20,000 / 51,426 = 0.3889
      // Alice: floor(42,856 × 0.3889) = 16,667
      // Bob: floor(8,570 × 0.3889) = 3,332
      expect(result.distributions[0].bonusShares).toBe(16667) // Alice
      expect(result.distributions[1].bonusShares).toBe(3332) // Bob
      expect(result.totalBonusShares).toBe(16667 + 3332) // 19,999

      // Verify ownership percentages maintained
      expect(result.distributions[0].newQuantity).toBe(166667)
      expect(result.distributions[1].newQuantity).toBe(33332)
      const totalAfter = 166667 + 33332
      expect(166667 / totalAfter).toBeCloseTo(0.8333, 4) // Alice: 83.33%
      expect(33332 / totalAfter).toBeCloseTo(0.1667, 4) // Bob: 16.67%
    })

    // Test Scenario: Bonus issue significantly exceeds limit - heavily scaled
    // Given: Current issued 190,000 shares, intended bonus 38,000 shares
    // When: Only 10,000 available (scaling factor = 0.2632)
    // Then: Scaled down dramatically, maintaining percentages
    it('should heavily scale down when very close to limit', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 50000,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 140000,
          averageCost: 95,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 5 }

      const result = calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        MAX_STOCK_QUANTITY
      )

      expect(result.currentIssuedQuantity).toBe(190000)
      expect(result.wouldExceedLimit).toBe(true)

      // Intended: Alice 10,000, Bob 28,000, Total 38,000
      // Available: 10,000
      // Scaling factor: 10,000 / 38,000 = 0.2632
      // Alice: floor(10,000 × 0.2632) = 2,631
      // Bob: floor(28,000 × 0.2632) = 7,368
      expect(result.distributions[0].bonusShares).toBe(2631) // Alice
      expect(result.distributions[1].bonusShares).toBe(7368) // Bob
      expect(result.totalBonusShares).toBe(2631 + 7368) // 9,999
    })

    // Test Scenario: Three shareholders with uneven distribution and 1:7 ratio
    // Given: Alice 100,100 (55.61%), Bob 50,900 (28.28%), Charlie 29,000 (16.11%)
    // When: 1:7 ratio would give 25,713 bonus (exceeds by 5,713, only 20,000 available)
    // Then: Scaled down with factor 0.778, maintaining exact percentages
    it('should scale down 1:7 ratio for 3 shareholders maintaining percentages', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 100100,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 50900,
          averageCost: 95,
        },
        {
          playerId: 'player3',
          playerName: 'Charlie',
          quantity: 29000,
          averageCost: 85,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 7 }

      const result = calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        MAX_STOCK_QUANTITY
      )

      expect(result.currentIssuedQuantity).toBe(180000)
      expect(result.wouldExceedLimit).toBe(true)

      // Intended: Alice 14,300, Bob 7,271, Charlie 4,142, Total 25,713
      // Available: 20,000
      // Scaling factor: 20,000 / 25,713 = 0.778
      // Alice: floor(14,300 × 0.778) = 11,122
      // Bob: floor(7,271 × 0.778) = 5,655
      // Charlie: floor(4,142 × 0.778) = 3,221
      expect(result.distributions[0].bonusShares).toBe(11122) // Alice
      expect(result.distributions[1].bonusShares).toBe(5655) // Bob
      expect(result.distributions[2].bonusShares).toBe(3221) // Charlie
      expect(result.totalBonusShares).toBe(11122 + 5655 + 3221) // 19,998

      // Verify final quantities
      expect(result.distributions[0].newQuantity).toBe(111222) // Alice
      expect(result.distributions[1].newQuantity).toBe(56555) // Bob
      expect(result.distributions[2].newQuantity).toBe(32221) // Charlie

      // Verify ownership percentages maintained (within 0.01% tolerance)
      const totalAfter = 111222 + 56555 + 32221 // 199,998
      expect(111222 / totalAfter).toBeCloseTo(0.5561, 4) // Alice: 55.61%
      expect(56555 / totalAfter).toBeCloseTo(0.2828, 4) // Bob: 28.28%
      expect(32221 / totalAfter).toBeCloseTo(0.1611, 4) // Charlie: 16.11%
    })

    // Test Scenario: Total bonus shares calculated across all shareholders
    // Given: Three shareholders with 50k, 30k, and 20k shares (100k total), ratio 1:10
    // When: Bonus is calculated for all
    // Then: Total bonus = 10,000 shares (5k + 3k + 2k), well within 200k limit
    it('should calculate total bonus shares across multiple shareholders', () => {
      const shareholders = [
        {
          playerId: 'player1',
          playerName: 'Alice',
          quantity: 50000,
          averageCost: 90,
        },
        {
          playerId: 'player2',
          playerName: 'Bob',
          quantity: 30000,
          averageCost: 95,
        },
        {
          playerId: 'player3',
          playerName: 'Charlie',
          quantity: 20000,
          averageCost: 88,
        },
      ]
      const bonusDetails = { ratio: 1, baseShares: 10 }

      const result = calculateBonusIssueDistribution(
        shareholders,
        'TECH',
        bonusDetails,
        MAX_STOCK_QUANTITY
      )

      expect(result.currentIssuedQuantity).toBe(100000) // Auto-calculated from holdings
      expect(result.distributions).toHaveLength(3)
      expect(result.totalBonusShares).toBe(10000) // 5000 + 3000 + 2000
      expect(result.wouldExceedLimit).toBe(false) // 100000 + 10000 = 110000 < 200000
    })
  })
})
