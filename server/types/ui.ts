/**
 * UI support types
 */

export interface PortfolioHolding {
  symbol: string
  quantity: number
  averageCost: number
  currentPrice: number
  totalValue: number
  profitLoss: number
  profitLossPercent: number
}

export interface PortfolioData {
  cash: number
  holdings: PortfolioHolding[]
  totalValue: number
}

export interface TradeValidation {
  isValid: boolean
  error: string | null
  maxQuantity: number
}

export interface CorporateActionPreview {
  isValid: boolean
  error: string | null
  preview: {
    type: 'dividend' | 'right_issue' | 'bonus_issue'
    stockPrice?: number
    dividendPerShare?: number
    totalDividend?: number
    dividendPercent?: number
    pricePerShare?: number
    discountPercent?: number
    maxByHoldings?: number
    maxByMarket?: number
    maxByCash?: number
    maxAllowed?: number
    bonusShares?: number
    newTotalShares?: number
    currentHoldings?: number
    ratio?: number
    baseShares?: number
  } | null
}
