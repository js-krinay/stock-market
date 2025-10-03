import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Player } from '@/types'

interface PlayerLogsDialogProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
}

export function PlayerLogsDialog({ player, isOpen, onClose }: PlayerLogsDialogProps) {
  if (!player) return null

  // Sort actions by most recent first
  const sortedActions = [...player.actionHistory].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {player.name}'s Trade Logs ({sortedActions.length} actions)
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead>Turn</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No actions yet
                  </TableCell>
                </TableRow>
              ) : (
                sortedActions.map((action, index) => {
                  const actionType = action.action.type
                  let actionLabel = ''
                  let actionDetails = ''
                  let actionColor = ''

                  switch (actionType) {
                    case 'buy':
                      actionLabel = '🛒 Buy'
                      actionDetails = `${action.action.quantity} shares of ${action.action.symbol} @ $${action.price?.toFixed(2)}`
                      actionColor = 'text-green-600'
                      break
                    case 'sell':
                      actionLabel = '💰 Sell'
                      actionDetails = `${action.action.quantity} shares of ${action.action.symbol} @ $${action.price?.toFixed(2)}`
                      actionColor = 'text-blue-600'
                      break
                    case 'skip':
                      actionLabel = '⏭️ Skip'
                      actionDetails = 'Turn skipped'
                      actionColor = 'text-gray-500'
                      break
                    case 'play_corporate_action':
                      actionLabel = '💼 Corporate Action'
                      actionDetails = `${action.action.symbol || 'N/A'}`
                      actionColor = 'text-purple-600'
                      break
                    case 'dividend_received':
                      actionLabel = '💵 Dividend'
                      actionDetails = `${action.action.symbol} - ${action.action.quantity} shares`
                      actionColor = 'text-emerald-600'
                      break
                    case 'bonus_received':
                      actionLabel = '🎁 Bonus Shares'
                      actionDetails = `${action.action.symbol} - ${action.action.quantity} shares`
                      actionColor = 'text-amber-600'
                      break
                    default:
                      actionLabel = actionType
                      actionDetails = 'Unknown action'
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{action.round}</TableCell>
                      <TableCell>{action.turn}</TableCell>
                      <TableCell className={actionColor}>{actionLabel}</TableCell>
                      <TableCell className="text-sm">{actionDetails}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{action.result}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
