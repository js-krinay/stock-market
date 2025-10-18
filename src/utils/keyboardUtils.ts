/**
 * Keyboard navigation utility functions
 */

/**
 * Check if the currently focused element is an input field where typing should work normally
 */
export function isInputElement(element: Element | null): boolean {
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  const inputTypes = ['text', 'number', 'email', 'password', 'search', 'tel', 'url']

  // Check if it's a text input
  if (tagName === 'input') {
    const type = (element as HTMLInputElement).type.toLowerCase()
    return inputTypes.includes(type)
  }

  // Check if it's textarea or contenteditable
  if (tagName === 'textarea') return true
  if ((element as HTMLElement).isContentEditable) return true

  // Check if it's a select element
  if (tagName === 'select') return true

  return false
}

/**
 * Check if keyboard shortcuts should be disabled based on current focus
 */
export function shouldDisableShortcuts(): boolean {
  const activeElement = document.activeElement
  return isInputElement(activeElement)
}

/**
 * Get all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll(focusableSelectors))
}

/**
 * Move focus to the next focusable element
 */
export function focusNextElement(container?: HTMLElement): void {
  const root = container || document.body
  const focusable = getFocusableElements(root)
  const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)

  if (currentIndex < focusable.length - 1) {
    focusable[currentIndex + 1]?.focus()
  } else {
    // Wrap to first element
    focusable[0]?.focus()
  }
}

/**
 * Move focus to the previous focusable element
 */
export function focusPreviousElement(container?: HTMLElement): void {
  const root = container || document.body
  const focusable = getFocusableElements(root)
  const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)

  if (currentIndex > 0) {
    focusable[currentIndex - 1]?.focus()
  } else {
    // Wrap to last element
    focusable[focusable.length - 1]?.focus()
  }
}

/**
 * Focus an element by selector
 */
export function focusElement(selector: string): boolean {
  const element = document.querySelector(selector) as HTMLElement
  if (element) {
    element.focus()
    return true
  }
  return false
}

/**
 * Prevent default behavior for keyboard event
 */
export function preventDefaultKey(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

/**
 * Check if a key combination matches
 */
export function matchesKeyCombo(
  event: KeyboardEvent,
  key: string,
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
): boolean {
  const keyMatch = event.key.toLowerCase() === key.toLowerCase()
  const ctrlMatch = modifiers?.ctrl === undefined || event.ctrlKey === modifiers.ctrl
  const shiftMatch = modifiers?.shift === undefined || event.shiftKey === modifiers.shift
  const altMatch = modifiers?.alt === undefined || event.altKey === modifiers.alt
  const metaMatch = modifiers?.meta === undefined || event.metaKey === modifiers.meta

  return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch
}
