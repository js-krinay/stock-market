import { GameState, MarketEvent } from '@/types'

interface EventsTickerProps {
  gameState: GameState
}

export function EventsTicker({ gameState }: EventsTickerProps) {
  // Show only events from the current turn
  const currentTurnEvents = gameState.recentEvents.filter(
    (event) => event.turn === gameState.currentTurnInRound
  )

  if (currentTurnEvents.length === 0) return null

  const getEventBgColor = (event: MarketEvent) => {
    const isPositive = event.type === 'positive' || event.type === 'bull_run'

    if (isPositive) {
      switch (event.severity) {
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
      switch (event.severity) {
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

  return (
    <div className="bg-white text-slate-900 py-2 px-4 overflow-hidden relative border border-slate-200">
      <div className="flex items-center gap-2">
        <span className="font-bold text-red-600 shrink-0">📰 NEW EVENTS:</span>
        <div className="overflow-hidden">
          <div className="animate-scroll whitespace-nowrap inline-block">
            {currentTurnEvents.map((event, idx) => (
              <span
                key={idx}
                className={`inline-block mx-4 px-4 py-1 rounded ${getEventBgColor(event)}`}
              >
                <span className="font-semibold">{event.title}</span>
                <span className="mx-2">•</span>
                <span>{event.description}</span>
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {currentTurnEvents.map((event, idx) => (
              <span
                key={`dup-${idx}`}
                className={`inline-block mx-4 px-4 py-1 rounded ${getEventBgColor(event)}`}
              >
                <span className="font-semibold">{event.title}</span>
                <span className="mx-2">•</span>
                <span>{event.description}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
