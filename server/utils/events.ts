/**
 * Pure functions for event-related calculations
 * No state, no I/O - just computation
 *
 * For event generation with state management, use EventGenerator service
 */

/**
 * Compute severity based on impact value
 * ±5 = low
 * ±10, ±15 = medium
 * ±20, ±25 = high
 * ±30+ = extreme
 */
export function computeEventSeverity(impact: number): 'low' | 'medium' | 'high' | 'extreme' {
  const absImpact = Math.abs(impact)
  if (absImpact === 5) return 'low'
  if (absImpact === 10 || absImpact === 15) return 'medium'
  if (absImpact === 20 || absImpact === 25) return 'high'
  return 'extreme' // 30 or higher
}

/**
 * Determine if an event is a rare special event (crash or bull run)
 */
export function isRareEvent(eventType: string): boolean {
  return eventType === 'crash' || eventType === 'bull_run'
}

/**
 * Determine if an event affects a specific stock
 */
export function doesEventAffectStock(eventAffectedStocks: string[], stockSymbol: string): boolean {
  return eventAffectedStocks.includes(stockSymbol)
}

/**
 * Calculate weighted probability for event selection
 * Lower severity events are more common
 */
export function calculateEventWeight(severity: 'low' | 'medium' | 'high' | 'extreme'): number {
  switch (severity) {
    case 'low':
      return 5
    case 'medium':
      return 3
    case 'high':
      return 1
    case 'extreme':
      return 1
  }
}
