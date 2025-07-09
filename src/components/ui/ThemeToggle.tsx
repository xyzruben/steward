'use client'

import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Cycle through themes: Light → Dark → System
  const handleThemeCycle = () => {
    const themeOrder = ['light', 'dark', 'system'] as const
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  // Get the appropriate icon for the current theme
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  // Get tooltip text for accessibility
  const getTooltipText = () => {
    switch (theme) {
      case 'light':
        return 'Switch to Dark mode (click to cycle: Light → Dark → System)'
      case 'dark':
        return 'Switch to System mode (click to cycle: Light → Dark → System)'
      case 'system':
        return 'Switch to Light mode (click to cycle: Light → Dark → System)'
      default:
        return 'Toggle theme (Light → Dark → System)'
    }
  }

  return (
    <button
      onClick={handleThemeCycle}
      className="
        p-2 rounded-md text-slate-600 dark:text-slate-400 
        hover:text-slate-900 dark:hover:text-white 
        hover:bg-slate-100 dark:hover:bg-slate-700
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        focus:ring-offset-white dark:focus:ring-offset-slate-800
      "
      aria-label={getTooltipText()}
      title={getTooltipText()}
    >
      {getThemeIcon()}
    </button>
  )
} 