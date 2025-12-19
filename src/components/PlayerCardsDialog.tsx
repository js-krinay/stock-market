import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketEvent, CorporateAction, GameState } from '@/types'
import { useDialogKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getEventCardBgClasses, getCorporateActionClasses } from '@/lib/event-styles'
import type { EventType, EventSeverity, CorporateActionType } from '@/lib/event-styles'

interface PlayerCardsDialogProps {
  playerName: string
  cards: (MarketEvent | CorporateAction)[]
  isOpen: boolean
  onClose: () => void
  gameState?: GameState // Optional: for resolving leader names
}

export function PlayerCardsDialog({
  playerName,
  cards,
  isOpen,
  onClose,
  gameState,
}: PlayerCardsDialogProps) {
  // Add Escape key handler to close dialog
  useDialogKeyboardShortcuts(onClose, isOpen)

  const getLeaderName = (leaderId: string): string => {
    if (!gameState) return 'Leader'
    const player = gameState.players.find((p) => p.id === leaderId)
    return player?.name || 'Unknown Leader'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[75vw] !h-[75vh] !max-w-[75vw] !max-h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {playerName}'s Cards ({cards.length} total)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-4 overflow-y-auto flex-1">
          {cards.map((card, index) => {
            const isEvent = 'affectedStocks' in card
            return (
              <div key={card.id} className="border rounded-lg overflow-hidden flex flex-col">
                <div className="text-sm bg-gray-100 px-2 py-1 flex justify-between items-center border-b">
                  <span className="font-medium">Card {index + 1}</span>
                  <span>{isEvent ? '📰' : '💼'}</span>
                </div>

                {isEvent ? (
                  (() => {
                    const event = card as MarketEvent
                    const isExcluded = !!event.excludedBy
                    return (
                      <div
                        className={`p-3 ${getEventCardBgClasses(event.type as EventType, event.severity as EventSeverity)} flex flex-col flex-1 relative ${
                          isExcluded ? 'opacity-60 border-2 border-dashed border-gray-400' : ''
                        }`}
                      >
                        {/* Excluded badge */}
                        {isExcluded && (
                          <Badge
                            variant="outline"
                            className="absolute top-2 right-2 bg-gray-200 text-gray-800 text-xs"
                          >
                            🚫 Excluded
                          </Badge>
                        )}

                        <div className="font-bold text-base mb-2 line-clamp-2">{card.title}</div>
                        <div className="text-sm mb-2 line-clamp-4 flex-1">{card.description}</div>
                        <div className="text-sm font-semibold mt-auto">
                          Impact: {event.impact > 0 ? '+' : ''}
                          {event.type === 'inflation' || event.type === 'deflation'
                            ? `${event.impact}%`
                            : `$${event.impact}`}
                        </div>
                        <div className="text-sm font-semibold opacity-80 mt-1 line-clamp-2">
                          {event.type === 'inflation' || event.type === 'deflation'
                            ? 'Affects: Cash'
                            : `Stocks: ${event.affectedStocks.join(', ')}`}
                        </div>

                        {/* Exclusion information */}
                        {isExcluded && event.excludedBy && (
                          <div className="mt-2 pt-2 border-t border-white border-opacity-30">
                            <p className="text-xs italic">
                              Excluded by <strong>{getLeaderName(event.excludedBy)}</strong>
                            </p>
                            <p className="text-xs opacity-80">Will not affect stock prices</p>
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div
                    className={`p-3 ${getCorporateActionClasses((card as CorporateAction).type as CorporateActionType)} flex flex-col flex-1`}
                  >
                    <div className="font-bold text-base mb-2 line-clamp-2">{card.title}</div>
                    <div className="text-sm mb-2 line-clamp-4 flex-1">{card.description}</div>
                    <div className="text-sm font-semibold mt-auto">
                      {(card as CorporateAction).played ? '✅ Played' : '⏳ Available'}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t flex-shrink-0">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
