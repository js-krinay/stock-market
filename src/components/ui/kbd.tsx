import * as React from 'react'
import { cn } from '@/lib/utils'

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

/**
 * Keyboard key component for displaying keyboard shortcuts
 * Uses the keyboard-key CSS class from styles/keyboard-focus.css
 */
export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd className={cn('keyboard-key', className)} {...props}>
      {children}
    </kbd>
  )
}
