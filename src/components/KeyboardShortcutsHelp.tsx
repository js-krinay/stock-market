import { useDialogKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Kbd } from '@/components/ui/kbd'

interface KeyboardShortcut {
  keys: string[]
  description: string
}

interface ShortcutCategory {
  title: string
  shortcuts: KeyboardShortcut[]
}

interface KeyboardShortcutsHelpProps {
  open: boolean
  onClose: () => void
}

const KeyboardShortcutRow = ({ keys, description }: KeyboardShortcut) => (
  <div className="flex items-center justify-between py-2 border-b last:border-b-0">
    <span className="text-sm text-muted-foreground">{description}</span>
    <div className="flex gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-xs text-muted-foreground mx-1">+</span>}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </div>
  </div>
)

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  // Handle Escape key to close dialog
  useDialogKeyboardShortcuts(onClose, open)

  const categories: ShortcutCategory[] = [
    {
      title: '🎯 Global Navigation',
      shortcuts: [
        { keys: ['?'], description: 'Show/hide this help' },
        { keys: ['L'], description: 'Open leaderboard' },
        { keys: ['Esc'], description: 'Close dialogs/modals' },
        { keys: ['Tab'], description: 'Navigate forward' },
        { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
      ],
    },
    {
      title: '📈 Stock Selection',
      shortcuts: [
        { keys: ['1'], description: 'Select first stock' },
        { keys: ['2'], description: 'Select second stock' },
        { keys: ['3'], description: 'Select third stock' },
        { keys: ['4'], description: 'Select fourth stock' },
        { keys: ['5'], description: 'Select fifth stock' },
        { keys: ['6'], description: 'Select sixth stock' },
        { keys: ['↑'], description: 'Navigate stock list up' },
        { keys: ['↓'], description: 'Navigate stock list down' },
        { keys: ['Enter'], description: 'Select focused stock' },
      ],
    },
    {
      title: '💰 Trading Actions',
      shortcuts: [
        { keys: ['B'], description: 'Switch to Buy mode' },
        { keys: ['S'], description: 'Switch to Sell mode' },
        { keys: ['C'], description: 'Switch to Corporate action mode' },
        { keys: ['K'], description: 'Skip turn' },
        { keys: ['M'], description: 'Set quantity to Max' },
        { keys: ['Enter'], description: 'Execute trade (when valid)' },
      ],
    },
    {
      title: '🔄 Stock Table Sorting',
      shortcuts: [
        { keys: ['Shift', 'S'], description: 'Sort by Symbol' },
        { keys: ['Shift', 'P'], description: 'Sort by Price' },
        { keys: ['Shift', 'C'], description: 'Sort by Change' },
        { keys: ['Shift', 'A'], description: 'Sort by Available' },
      ],
    },
    {
      title: '⚙️ Setup Screen',
      shortcuts: [
        { keys: ['Ctrl', '1'], description: 'Switch to Create Game mode' },
        { keys: ['Ctrl', '2'], description: 'Switch to Join Game mode' },
        { keys: ['Enter'], description: 'Start or join game' },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            ⌨️ Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate and control the game using your keyboard. Press <Kbd>?</Kbd> anywhere to toggle
            this help.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {categories.map((category, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <KeyboardShortcutRow key={shortcutIndex} {...shortcut} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
          <p className="text-muted-foreground">
            <strong className="text-foreground">💡 Tip:</strong> Keyboard shortcuts work globally
            across the entire game. When typing in text fields, shortcuts are automatically disabled
            to avoid conflicts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
