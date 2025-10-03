import { Stock, MarketEvent } from './types'

export class StockMarket {
  private stocks: Stock[]

  constructor() {
    this.stocks = this.initializeStocks()
  }

  private initializeStocks(): Stock[] {
    const maxQuantity = 200000
    return [
      {
        symbol: 'TECH',
        name: 'TechCorp',
        price: 110,
        previousPrice: 110,
        sector: 'Technology',
        availableQuantity: maxQuantity,
        totalQuantity: maxQuantity,
        color: '#B4D7FF',
        priceHistory: [{ round: 0, price: 110 }],
      },
      {
        symbol: 'BANK',
        name: 'BankGroup',
        price: 120,
        previousPrice: 120,
        sector: 'Finance',
        availableQuantity: maxQuantity,
        totalQuantity: maxQuantity,
        color: '#FFD4B4',
        priceHistory: [{ round: 0, price: 120 }],
      },
      {
        symbol: 'ENRG',
        name: 'EnergyPlus',
        price: 70,
        previousPrice: 70,
        sector: 'Energy',
        availableQuantity: maxQuantity,
        totalQuantity: maxQuantity,
        color: '#FFFAB4',
        priceHistory: [{ round: 0, price: 70 }],
      },
      {
        symbol: 'HLTH',
        name: 'HealthMed',
        price: 90,
        previousPrice: 90,
        sector: 'Healthcare',
        availableQuantity: maxQuantity,
        totalQuantity: maxQuantity,
        color: '#C4FFB4',
        priceHistory: [{ round: 0, price: 90 }],
      },
      {
        symbol: 'FOOD',
        name: 'FoodChain',
        price: 80,
        previousPrice: 80,
        sector: 'Consumer',
        availableQuantity: maxQuantity,
        totalQuantity: maxQuantity,
        color: '#FFB4E8',
        priceHistory: [{ round: 0, price: 80 }],
      },
      {
        symbol: 'AUTO',
        name: 'AutoDrive',
        price: 60,
        previousPrice: 60,
        sector: 'Automotive',
        availableQuantity: maxQuantity,
        totalQuantity: maxQuantity,
        color: '#D4B4FF',
        priceHistory: [{ round: 0, price: 60 }],
      },
    ]
  }

  getStocks(): Stock[] {
    return [...this.stocks]
  }

  getStock(symbol: string): Stock | undefined {
    return this.stocks.find((s) => s.symbol === symbol)
  }

  applyAccumulatedEvents(events: MarketEvent[]): void {
    this.stocks.forEach((stock) => {
      stock.previousPrice = stock.price

      // Calculate total impact from all events affecting this stock's sector
      let totalImpact = 0
      events.forEach((event) => {
        if (event.affectedSectors.includes(stock.sector)) {
          totalImpact += event.impact
        }
      })

      // Apply the accumulated impact
      stock.price = stock.price + totalImpact

      // Ensure price never goes below 0
      stock.price = Math.max(0, stock.price)

      // Round to 2 decimal places
      stock.price = Math.round(stock.price * 100) / 100
    })
  }

  applyRandomFluctuations(): void {
    this.stocks.forEach((stock) => {
      stock.previousPrice = stock.price
      // Random fluctuation: ±$1
      const change = (Math.random() - 0.5) * 2 // -1 to +1
      stock.price = stock.price + change

      // Ensure price never goes below 0
      stock.price = Math.max(0, stock.price)
      stock.price = Math.round(stock.price * 100) / 100
    })
  }

  buyStock(symbol: string, quantity: number): { success: boolean; message: string } {
    const stock = this.stocks.find((s) => s.symbol === symbol)

    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }

    if (stock.price <= 0) {
      return { success: false, message: 'Stock cannot be traded at $0' }
    }

    if (quantity > stock.availableQuantity) {
      return { success: false, message: `Only ${stock.availableQuantity} shares available` }
    }

    stock.availableQuantity -= quantity
    return { success: true, message: 'Stock purchased' }
  }

  sellStock(symbol: string, quantity: number): { success: boolean; message: string } {
    const stock = this.stocks.find((s) => s.symbol === symbol)

    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }

    if (stock.price <= 0) {
      return { success: false, message: 'Stock cannot be traded at $0' }
    }

    stock.availableQuantity += quantity
    return { success: true, message: 'Stock sold' }
  }
}
