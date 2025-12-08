import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { trpc } from '@/utils/trpc'
import { chairmanIcon, directorIcon } from '@/lib/utils'
import { toast } from 'sonner'

interface LeadershipExclusionDialogProps {
  gameId: string
  open: boolean
  onComplete: () => void
}

export function LeadershipExclusionDialog({
  gameId,
  open,
  onComplete,
}: LeadershipExclusionDialogProps) {
  // State: Map of stockSymbol → eventId (or skip marker)
  const [exclusions, setExclusions] = useState<Map<string, string>>(new Map())

  // Fetch grouped opportunities for pagination
  const { data: groupedOpportunities, refetch: refetchGrouped } =
    trpc.game.getLeadershipOpportunitiesGrouped.useQuery(
      { gameId },
      { enabled: !!gameId && open, refetchOnMount: true }
    )

  // Fetch game state to get current leader index
  const { data: gameState, refetch: refetchGameState } = trpc.game.getGameState.useQuery(
    { gameId },
    { enabled: !!gameId && open, refetchOnMount: true }
  )

  // Mutations
  const excludeEventMutation = trpc.game.excludeEvent.useMutation()
  const advanceLeaderMutation = trpc.game.advanceToNextLeader.useMutation()
  const completePhaseMutation = trpc.game.completeLeadershipPhase.useMutation()

  // Derived state
  const leadershipStatus = gameState?.leadershipExclusionStatus
  const currentLeaderIndex = leadershipStatus?.currentLeaderIndex ?? 0
  const currentLeaderGroup = groupedOpportunities?.[currentLeaderIndex]
  const isLastLeader = currentLeaderIndex === (leadershipStatus?.totalLeaders ?? 1) - 1

  // Reset exclusions when leader changes
  useEffect(() => {
    setExclusions(new Map())
  }, [currentLeaderIndex])

  const handleExclude = (stockSymbol: string, eventId: string) => {
    setExclusions(new Map(exclusions).set(stockSymbol, eventId))
  }

  const handleNextLeader = async () => {
    try {
      // Submit current leader's exclusions
      for (const [_stockSymbol, eventId] of exclusions.entries()) {
        if (eventId && eventId !== '__skip__') {
          await excludeEventMutation.mutateAsync({
            gameId,
            eventId,
            leaderId: currentLeaderGroup!.leaderId,
          })
        }
      }

      // Advance to next leader
      const result = await advanceLeaderMutation.mutateAsync({ gameId })

      if (result.completed) {
        // All leaders done, complete phase
        await completePhaseMutation.mutateAsync({ gameId })

        // Refetch game state and close
        await refetchGameState()
        onComplete()
      } else {
        // Move to next leader - refetch data
        await refetchGrouped()
        await refetchGameState()
      }
    } catch (error) {
      toast.error('Leadership Error', {
        description: error instanceof Error ? error.message : 'Failed to advance leader',
        duration: 3000,
      })
    }
  }

  const isProcessing =
    excludeEventMutation.isPending ||
    advanceLeaderMutation.isPending ||
    completePhaseMutation.isPending

  // Don't render if no current leader group
  if (!currentLeaderGroup || !leadershipStatus) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">⚡ Leadership Event Exclusion</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Leader {currentLeaderIndex + 1} of {leadershipStatus.totalLeaders}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Banner */}
          <Alert variant="highlight">
            <div className="text-3xl">👤</div>
            <AlertDescription>
              <h3 className="text-xl font-bold">{currentLeaderGroup.leaderName}'s Turn</h3>
              <p className="text-sm text-muted-foreground">
                You lead: {currentLeaderGroup.opportunities.map((o) => o.stockSymbol).join(', ')}
              </p>
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            As a stock leader, you may exclude <strong>one event per stock</strong>. Excluded events
            will not affect stock prices this round.
          </p>

          {/* Stock-by-stock exclusion opportunities */}
          {currentLeaderGroup.opportunities.map((opportunity) => (
            <div key={opportunity.stockSymbol} className="border rounded-lg p-4 space-y-3 bg-card">
              {/* Stock header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: opportunity.stockColor }}
                />
                <h3 className="font-semibold text-lg">
                  {opportunity.stockName} ({opportunity.stockSymbol})
                </h3>
                <Badge
                  variant={opportunity.leaderType === 'chairman' ? 'default' : 'secondary'}
                  className="ml-auto flex items-center gap-1"
                >
                  <span>{opportunity.leaderType === 'chairman' ? chairmanIcon : directorIcon}</span>
                  <span>{opportunity.leaderType === 'chairman' ? 'Chairman' : 'Director'}</span>
                </Badge>
              </div>

              {/* Leader-specific messaging */}
              {opportunity.leaderType === 'director' && (
                <p className="text-xs text-muted-foreground italic">
                  As director, you can only exclude events from your own hand.
                </p>
              )}

              {/* Event selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select event to exclude (optional):</label>
                <Select
                  value={exclusions.get(opportunity.stockSymbol) || '__skip__'}
                  onValueChange={(eventId) => handleExclude(opportunity.stockSymbol, eventId)}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Skip exclusion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__skip__">
                      <span className="text-muted-foreground">Skip exclusion</span>
                    </SelectItem>
                    {opportunity.eligibleEvents.length === 0 ? (
                      <SelectItem value="none" disabled>
                        <span className="text-muted-foreground">No eligible events</span>
                      </SelectItem>
                    ) : (
                      opportunity.eligibleEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center gap-2 py-1">
                            <Badge
                              variant={
                                event.type === 'positive'
                                  ? 'default'
                                  : event.type === 'negative'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="text-xs"
                            >
                              {event.severity}
                            </Badge>
                            <span className="font-medium">{event.title}</span>
                            <span className="text-muted-foreground">
                              ({event.impact > 0 ? '+' : ''}
                              {event.impact}%)
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Confirmation message */}
                {exclusions.has(opportunity.stockSymbol) &&
                  exclusions.get(opportunity.stockSymbol) &&
                  exclusions.get(opportunity.stockSymbol) !== '__skip__' && (
                    <p className="text-sm text-muted-foreground">
                      ✓ Selected event will not affect {opportunity.stockSymbol} price
                    </p>
                  )}
              </div>
            </div>
          ))}

          {/* Action button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleNextLeader} disabled={isProcessing} size="lg">
              {isProcessing ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : isLastLeader ? (
                'Complete & Process Round'
              ) : (
                'Next Leader →'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
