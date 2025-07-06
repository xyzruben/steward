import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '@/context/ThemeContext'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  it('should render all theme options', () => {
    renderThemeToggle()

    expect(screen.getByLabelText('Switch to Light theme')).toBeInTheDocument()
    expect(screen.getByLabelText('Switch to Dark theme')).toBeInTheDocument()
    expect(screen.getByLabelText('Switch to System theme')).toBeInTheDocument()
  })

  it('should show theme labels on larger screens', () => {
    renderThemeToggle()

    // Labels should be present (they're hidden on small screens with sm:hidden)
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    renderThemeToggle()

    const lightButton = screen.getByLabelText('Switch to Light theme')
    const darkButton = screen.getByLabelText('Switch to Dark theme')
    const systemButton = screen.getByLabelText('Switch to System theme')

    expect(lightButton).toHaveAttribute('aria-label', 'Switch to Light theme')
    expect(darkButton).toHaveAttribute('aria-label', 'Switch to Dark theme')
    expect(systemButton).toHaveAttribute('aria-label', 'Switch to System theme')
  })

  it('should switch themes when buttons are clicked', () => {
    renderThemeToggle()

    const darkButton = screen.getByLabelText('Switch to Dark theme')
    fireEvent.click(darkButton)

    expect(localStorageMock.setItem).toHaveBeenCalledWith('steward-theme', 'dark')
  })

  it('should highlight the active theme', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    renderThemeToggle()

    const darkButton = screen.getByLabelText('Switch to Dark theme')
    const lightButton = screen.getByLabelText('Switch to Light theme')
    const systemButton = screen.getByLabelText('Switch to System theme')

    // Dark button should be highlighted
    expect(darkButton).toHaveClass('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm')
    
    // Other buttons should not be highlighted
    expect(lightButton).not.toHaveClass('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm')
    expect(systemButton).not.toHaveClass('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm')
  })

  it('should have proper hover states', () => {
    renderThemeToggle()

    const lightButton = screen.getByLabelText('Switch to Light theme')
    
    expect(lightButton).toHaveClass('hover:text-slate-900', 'dark:hover:text-white')
  })

  it('should have smooth transitions', () => {
    renderThemeToggle()

    const container = document.querySelector('.flex.items-center.space-x-1')
    
    // Check that the container has transition classes
    expect(container).toHaveClass('transition-colors')
  })
}) 