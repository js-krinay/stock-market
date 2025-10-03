import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GameCard, MarketEvent, CorporateAction } from '@/types'

interface PlayerCardsDialogProps {
  playerName: string
  cards: GameCard[]
  isOpen: boolean
  onClose: () => void
}

export function PlayerCardsDialog({ playerName, cards, isOpen, onClose }: PlayerCardsDialogProps) {

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

  const getCorporateActionBgColor = (type: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {playerName}'s Cards ({cards.length} total)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-4">
          {cards.map((card, index) => (
            <div key={card.id} className="border rounded-lg overflow-hidden">
              <div className="text-xs bg-gray-100 px-2 py-1 flex justify-between items-center border-b">
                <span className="font-medium">Card {index + 1}</span>
                <span>{card.type === 'event' ? '📰' : '💼'}</span>
              </div>

              {card.type === 'event' ? (
                <div
                  className={`p-3 ${getEventBgColor(card.data as MarketEvent)} h-48 flex flex-col`}
                >
                  <div className="font-bold text-sm mb-2 line-clamp-2">
                    {card.data.title}
                  </div>
                  <div className="text-xs mb-2 line-clamp-4 flex-1">
                    {card.data.description}
                  </div>
                  <div className="text-xs font-semibold mt-auto">
                    Impact: {(card.data as MarketEvent).impact > 0 ? '+' : ''}$
                    {(card.data as MarketEvent).impact}
                  </div>
                  <div className="text-xs opacity-80 mt-1 line-clamp-2">
                    {(card.data as MarketEvent).affectedSectors.join(', ')}
                  </div>
                </div>
              ) : (
                <div
                  className={`p-3 ${getCorporateActionBgColor((card.data as CorporateAction).type)} h-48 flex flex-col`}
                >
                  <div className="font-bold text-sm mb-2 line-clamp-2">
                    {card.data.title}
                  </div>
                  <div className="text-xs mb-2 line-clamp-4 flex-1">
                    {card.data.description}
                  </div>
                  <div className="text-xs font-semibold mt-auto">
                    {(card.data as CorporateAction).played
                      ? '✅ Played'
                      : '⏳ Available'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
