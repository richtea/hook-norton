import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { testIds } from '@/lib/testIds'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid={testIds.themeToggle}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}
