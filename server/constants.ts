/**
 * Game constants and configuration
 */

// Game Settings
export const DEFAULT_MAX_ROUNDS = 10
export const DEFAULT_TURNS_PER_ROUND = 3
export const STARTING_CASH = 10000

// Stock Settings
export const MAX_STOCK_QUANTITY = 200000

// Card Distribution
export const CARDS_PER_PLAYER = 10
export const CORPORATE_ACTION_PERCENTAGE = 0.1 // 10% of cards are corporate actions

// Stock Initial Data
export const INITIAL_STOCKS = [
  {
    symbol: 'TECH',
    name: 'TechCorp',
    price: 110,
    color: '#B4D7FF',
  },
  {
    symbol: 'BANK',
    name: 'BankGroup',
    price: 120,
    color: '#FFD4B4',
  },
  {
    symbol: 'ENRG',
    name: 'EnergyPlus',
    price: 70,
    color: '#FFFAB4',
  },
  {
    symbol: 'HLTH',
    name: 'HealthMed',
    price: 90,
    color: '#C4FFB4',
  },
  {
    symbol: 'FOOD',
    name: 'FoodChain',
    price: 80,
    color: '#FFB4E8',
  },
  {
    symbol: 'AUTO',
    name: 'AutoDrive',
    price: 60,
    color: '#D4B4FF',
  },
] as const

// Leadership Thresholds
export const DIRECTOR_THRESHOLD = 0.25 // 25% ownership
export const CHAIRMAN_THRESHOLD = 0.5 // 50% ownership

// Corporate Action Settings
export const DIVIDEND_PERCENTAGE = 0.05 // 5% of stock price per share
export const RIGHT_ISSUE_DISCOUNT = 0.5 // 50% discount (pay 50% of market price)
