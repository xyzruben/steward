import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

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

// Test component to access theme context
function TestComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Dark
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        System
      </button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    document.documentElement.classList.remove('light', 'dark')
  })

  it('should initialize with system theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
  })

  it('should load saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
  })

  it('should save theme preference to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByTestId('set-dark'))

    expect(localStorageMock.setItem).toHaveBeenCalledWith('steward-theme', 'dark')
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('should apply theme classes to document element', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByTestId('set-dark'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    fireEvent.click(screen.getByTestId('set-light'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('should handle system theme preference changes', async () => {
    const mockMatchMedia = window.matchMedia as jest.Mock
    const mockMediaQuery = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockMatchMedia.mockReturnValue(mockMediaQuery)

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Set to system theme
    fireEvent.click(screen.getByTestId('set-system'))

    // Simulate system theme change
    mockMediaQuery.matches = true
    const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]
    act(() => {
      changeHandler()
    })

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })
  })

  it('should handle invalid saved theme gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
  })

  it('should throw error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
}) 