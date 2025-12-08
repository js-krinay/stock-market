/**
 * Consolidated event styling utilities
 * Used across StockDetailsDialog and PlayerCardsDialog for consistent event styling
 */

export type EventSeverity = 'low' | 'medium' | 'high' | 'extreme'
export type EventType = 'positive' | 'negative' | 'neutral' | 'crash' | 'bull_run' | 'inflation' | 'deflation'
export type CorporateActionType = 'dividend' | 'right_issue' | 'bonus_issue'

/**
 * Get Tailwind classes for event cards based on type and severity
 * Used in StockDetailsDialog for event history cards
 */
export function getEventCardClasses(
  type: EventType,
  severity: EventSeverity
): string {
  const isPositive = type === 'positive' || type === 'bull_run'

  if (isPositive) {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-green-200 text-green-900 border-green-300'
      case 'high':
        return 'bg-green-600 text-white border-green-700'
      case 'extreme':
        return 'bg-green-800 text-white border-green-900'
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  } else {
    switch (severity) {
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-red-200 text-red-900 border-red-300'
      case 'high':
        return 'bg-red-600 text-white border-red-700'
      case 'extreme':
        return 'bg-red-800 text-white border-red-900'
      default:
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }
}

/**
 * Get Tailwind classes for event card backgrounds (more saturated for card view)
 * Used in PlayerCardsDialog for the card gallery
 */
export function getEventCardBgClasses(
  type: EventType,
  severity: EventSeverity
): string {
  const isPositive = type === 'positive' || type === 'bull_run'

  if (isPositive) {
    switch (severity) {
      case 'low':
        return 'bg-green-400 text-green-900'
      case 'medium':
        return 'bg-green-500 text-white'
      case 'high':
        return 'bg-green-600 text-white'
      case 'extreme':
        return 'bg-green-800 text-white'
      default:
        return 'bg-green-600 text-white'
    }
  } else {
    switch (severity) {
      case 'low':
        return 'bg-red-400 text-red-900'
      case 'medium':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-red-600 text-white'
      case 'extreme':
        return 'bg-red-800 text-white'
      default:
        return 'bg-red-600 text-white'
    }
  }
}

/**
 * Get Tailwind classes for corporate action cards
 * Used in PlayerCardsDialog for corporate action styling
 */
export function getCorporateActionClasses(type: CorporateActionType): string {
  switch (type) {
    case 'dividend':
      return 'bg-blue-600 text-white'
    case 'right_issue':
      return 'bg-purple-600 text-white'
    case 'bonus_issue':
      return 'bg-yellow-600 text-white'
    default:
      return 'bg-gray-600 text-white'
  }
}

/**
 * Get emoji for event type
 */
export function getEventEmoji(type: EventType, isExcluded: boolean = false): string {
  if (isExcluded) return '🚫'
  const isPositive = type === 'positive' || type === 'bull_run'
  return isPositive ? '📈' : '📉'
}
