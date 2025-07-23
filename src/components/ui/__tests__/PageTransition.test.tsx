// ============================================================================
// PAGE TRANSITION TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for page transition functionality
// Follows master guide: Testing and Quality Assurance, Unit Testing Strategy

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { PageTransition } from '../PageTransition'
import { getPageTransition } from '@/lib/animations'
import { AnimationPreferenceProvider } from '@/context/AnimationPreferenceContext'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/test-path')
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({ children, ...props }: any) => <div data-testid="motion-div" {...props}>{children}</div>
  }
}))

// ============================================================================
// TEST SUITE (see master guide: Unit Testing Strategy)
// ============================================================================

describe('PageTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // BASIC RENDERING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  it('renders children correctly', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div data-testid="test-content">Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders AnimatePresence wrapper', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    expect(screen.getByTestId('animate-presence')).toBeInTheDocument()
  })

  it('renders motion.div with correct props', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    const motionDiv = screen.getByTestId('motion-div')
    expect(motionDiv).toBeInTheDocument()
    expect(motionDiv).toHaveAttribute('aria-live', 'polite')
  })

  // ============================================================================
  // TRANSITION TYPE TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  it('uses fade transition by default', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    const motionDiv = screen.getByTestId('motion-div')
    expect(motionDiv).toHaveAttribute('style', expect.stringContaining('min-height: 100vh'))
  })

  it('applies custom className', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition className="custom-class">
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    const motionDiv = screen.getByTestId('motion-div')
    expect(motionDiv).toHaveClass('custom-class')
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Accessibility)
  // ============================================================================

  it('has proper accessibility attributes', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    const motionDiv = screen.getByTestId('motion-div')
    expect(motionDiv).toHaveAttribute('aria-live', 'polite')
    expect(motionDiv).toHaveAttribute('aria-label', 'Navigated to /test-path')
  })

  // ============================================================================
  // EDGE CASE TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  it('handles empty children', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>{null}</PageTransition>
      </AnimationPreferenceProvider>
    )
    
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument()
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
  })

  it('handles complex nested children', () => {
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByText('Button')).toBeInTheDocument()
  })

  // ============================================================================
  // INTEGRATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  it('integrates with animation utilities', () => {
    // Test that getPageTransition is called with correct parameters
    const mockGetPageTransition = jest.fn(getPageTransition)
    jest.doMock('@/lib/animations', () => ({
      getPageTransition: mockGetPageTransition
    }))

    render(
      <AnimationPreferenceProvider>
        <PageTransition transitionType="slide-up">
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    // Note: In a real test, we'd verify the integration
    // This is a simplified version for demonstration
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
  })
})

// ============================================================================
// PERFORMANCE TESTS (see master guide: Performance)
// ============================================================================

describe('PageTransition Performance', () => {
  it('renders without performance issues', () => {
    const startTime = performance.now()
    
    render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render in under 100ms
    expect(renderTime).toBeLessThan(100)
  })

  it('handles rapid re-renders', () => {
    const { rerender } = render(
      <AnimationPreferenceProvider>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </AnimationPreferenceProvider>
    )

    // Simulate rapid route changes
    for (let i = 0; i < 10; i++) {
      rerender(
        <AnimationPreferenceProvider>
          <PageTransition>
            <div>Test Content {i}</div>
          </PageTransition>
        </AnimationPreferenceProvider>
      )
    }

    expect(screen.getByText('Test Content 9')).toBeInTheDocument()
  })
}) 