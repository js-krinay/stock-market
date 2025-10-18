import { useEffect, useCallback } from 'react'
import { shouldDisableShortcuts, preventDefaultKey, matchesKeyCombo } from '@/utils/keyboardUtils'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  handler: (event: KeyboardEvent) => void
  preventDefault?: boolean
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
  global?: boolean
}

/**
 * Hook to register keyboard shortcuts
 *
 * @param options Configuration for keyboard shortcuts
 * @param options.shortcuts Array of keyboard shortcut definitions
 * @param options.enabled Whether shortcuts are currently enabled (default: true)
 * @param options.global Whether shortcuts should work globally or only when focused (default: true)
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'b',
 *       description: 'Switch to Buy mode',
 *       handler: () => setTradeType('buy')
 *     },
 *     {
 *       key: 's',
 *       shift: true,
 *       description: 'Sort by symbol',
 *       handler: () => handleSort('symbol')
 *     }
 *   ]
 * })
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  global = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts if disabled
      if (!enabled) return

      // Don't handle shortcuts when user is typing in an input field (for global shortcuts)
      if (global && shouldDisableShortcuts()) return

      // Check each shortcut
      for (const shortcut of shortcuts) {
        if (
          matchesKeyCombo(event, shortcut.key, {
            ctrl: shortcut.ctrl,
            shift: shortcut.shift,
            alt: shortcut.alt,
            meta: shortcut.meta,
          })
        ) {
          if (shortcut.preventDefault !== false) {
            preventDefaultKey(event)
          }
          shortcut.handler(event)
          break // Only trigger one shortcut per key press
        }
      }
    },
    [shortcuts, enabled, global]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Common keyboard shortcuts for dialogs
 */
export function useDialogKeyboardShortcuts(onClose: () => void, enabled = true) {
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Escape',
        description: 'Close dialog',
        handler: onClose,
      },
    ],
    enabled,
  })
}
