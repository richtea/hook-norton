import { useEffect } from 'react'

export function useKeyboardShortcuts(shortcuts: {
  [key: string]: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (macOS) or Ctrl+K (Windows/Linux) for search focus
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        if (shortcuts['search']) {
          shortcuts['search']()
        }
      }

      // Check for Delete key
      if (event.key === 'Delete') {
        if (shortcuts['delete']) {
          shortcuts['delete']()
        }
      }

      // Check for Escape key
      if (event.key === 'Escape') {
        if (shortcuts['escape']) {
          shortcuts['escape']()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
