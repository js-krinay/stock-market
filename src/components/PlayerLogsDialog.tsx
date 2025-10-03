import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    case 'dividend_declared':
                      actionLabel = '💼 Dividend Declared'
                      actionDetails = action.result
                      actionColor = 'text-purple-600'
                      break
                    case 'bonus_issue_declared':
                      actionLabel = '💼 Bonus Issue Declared'
                      actionDetails = action.result
                      actionColor = 'text-purple-600'
                      break
                    case 'right_issue_purchased':
                      actionLabel = '💼 Right Issue Purchased'
                      actionDetails = action.result
                      actionColor = 'text-purple-600'
                      break
                    case 'play_corporate_action':
                      // Fallback for any edge cases or old records
                      actionLabel = '💼 Corporate Action'
                      actionDetails = action.result
                      actionColor = 'text-purple-600'
                      break
                    case 'dividend_received': {
                      actionLabel = '💵 Dividend Received'
                      // Try to get amount from totalValue, or parse from result string
                      let dividendAmount = action.totalValue || 0
                      if (dividendAmount === 0 && action.result) {
                        const match = action.result.match(/\$([0-9,.]+)/)
                        if (match) {
                          dividendAmount = parseFloat(match[1].replace(',', ''))
                        }
                      }
                      actionDetails = `${action.action.symbol} - Received $${dividendAmount.toFixed(2)} (${action.action.quantity} shares)`
                      actionColor = 'text-emerald-600'
                      break
                    }
                    case 'bonus_received':
                      actionLabel = '🎁 Bonus Shares Received'
                      actionDetails = `${action.action.symbol} - Received ${action.action.quantity} bonus shares`
                      actionColor = 'text-amber-600'
                      break
                    case 'deflation_gain':
                      actionLabel = '📈 Deflation Gain'
                      actionDetails = 'Purchasing power increased'
                      actionColor = 'text-green-600'
                      break
                    case 'inflation_loss':
                      actionLabel = '📉 Inflation Loss'
                      actionDetails = 'Purchasing power decreased'
                      actionColor = 'text-red-600'
                      break
                    default:
                      actionLabel = actionType
                      actionDetails = 'Unknown action'
                  }

                  // Determine amount display
                  let amountDisplay = null
                  let displayAmount = action.totalValue || 0

                  // For dividend_received, try to parse from result if totalValue is 0
                  if (actionType === 'dividend_received' && displayAmount === 0 && action.result) {
                    const match = action.result.match(/\$([0-9,.]+)/)
                    if (match) {
                      displayAmount = parseFloat(match[1].replace(',', ''))
                    }
                  }

                  if (displayAmount !== 0) {
                    const isCredit =
                      actionType === 'sell' ||
                      actionType === 'dividend_received' ||
                      actionType === 'deflation_gain'
                    const amountColor = isCredit ? 'text-green-600' : 'text-red-600'
                    const prefix = isCredit ? '+' : '-'

                    amountDisplay = (
                      <span className={amountColor}>
                        {prefix}${Math.abs(displayAmount).toFixed(2)}
                      </span>
                    )
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{action.round}</TableCell>
                      <TableCell>{action.turn}</TableCell>
                      <TableCell className={actionColor}>{actionLabel}</TableCell>
                      <TableCell className="text-sm">{actionDetails}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {amountDisplay}
                      </TableCell>
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
