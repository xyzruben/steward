// ============================================================================
// SKELETON COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for skeleton loading states and components
// Uses global mocks from jest.setup.js for consistent isolation

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonList, SkeletonGrid, SkeletonTable, SkeletonDashboard } from '../Skeleton'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

// ============================================================================
// TEST SUITE (see master guide: Component Testing)
// ============================================================================

describe('Skeleton Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Rendering', () => {
    it('renders with default props', () => {
      // Arrange & Act
      render(<Skeleton />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('bg-slate-200', 'dark:bg-slate-700', 'animate-pulse')
    })

    it('renders with custom width and height', () => {
      // Arrange & Act
      render(<Skeleton width={100} height={50} />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' })
    })

    it('renders with different variants', () => {
      // Arrange & Act
      const { rerender } = render(<Skeleton variant="circular" />)
      
      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full')

      // Act
      rerender(<Skeleton variant="rectangular" />)
      
      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md')

      // Act
      rerender(<Skeleton variant="card" />)
      
      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-lg')
    })

    it('renders with different sizes', () => {
      // Arrange & Act
      const { rerender } = render(<Skeleton size="sm" />)
      
      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('h-3')

      // Act
      rerender(<Skeleton size="lg" />)
      
      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('h-6')

      // Act
      rerender(<Skeleton size="xl" />)
      
      // Assert
      expect(screen.getByTestId('skeleton')).toHaveClass('h-8')
    })

    it('can disable animation', () => {
      // Arrange & Act
      render(<Skeleton animate={false} />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).not.toHaveClass('animate-pulse')
    })
  })
})

// ============================================================================
// SKELETON CARD TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonCard Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      // Arrange & Act
      render(<SkeletonCard />)
      
      // Assert
      const card = screen.getByTestId('skeleton-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-white', 'dark:bg-slate-800', 'rounded-lg')
    })

    it('renders receipt variant correctly', () => {
      // Arrange & Act
      render(<SkeletonCard variant="receipt" />)
      
      // Assert
      const card = screen.getByTestId('skeleton-card')
      expect(card).toHaveClass('p-4', 'space-y-4')
    })

    it('renders stats variant correctly', () => {
      // Arrange & Act
      render(<SkeletonCard variant="stats" />)
      
      // Assert
      const card = screen.getByTestId('skeleton-card')
      expect(card).toHaveClass('p-6', 'space-y-4')
    })

    it('renders with custom lines', () => {
      // Arrange & Act
      render(<SkeletonCard lines={5} />)
      
      // Assert
      const skeletons = screen.getAllByTestId('skeleton')
      // Should have multiple skeleton elements for the lines
      expect(skeletons.length).toBeGreaterThan(1)
    })

    it('renders with avatar when showAvatar is true', () => {
      // Arrange & Act
      render(<SkeletonCard showAvatar={true} />)
      
      // Assert
      const skeletons = screen.getAllByTestId('skeleton')
      // Should have more skeleton elements when avatar is shown
      expect(skeletons.length).toBeGreaterThan(3)
    })
  })
})

// ============================================================================
// SKELETON LIST TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonList Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      // Arrange & Act
      render(<SkeletonList />)
      
      // Assert
      const list = screen.getByTestId('skeleton-list')
      expect(list).toBeInTheDocument()
      expect(list).toHaveClass('space-y-4')
    })

    it('renders correct number of items', () => {
      // Arrange & Act
      render(<SkeletonList count={5} />)
      
      // Assert
      const cards = screen.getAllByTestId('skeleton-card')
      // Should have 5 skeleton cards
      expect(cards.length).toBe(5)
    })

    it('renders with different variants', () => {
      // Arrange & Act
      render(<SkeletonList variant="receipt" count={2} />)
      
      // Assert
      const cards = screen.getAllByTestId('skeleton-card')
      expect(cards.length).toBe(2) // 2 cards
    })

    it('applies custom className', () => {
      // Arrange & Act
      render(<SkeletonList className="custom-class" />)
      
      // Assert
      const list = screen.getByTestId('skeleton-list')
      expect(list).toHaveClass('custom-class')
    })
  })
})

// ============================================================================
// SKELETON GRID TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonGrid Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      // Arrange & Act
      render(<SkeletonGrid />)
      
      // Assert
      const grid = screen.getByTestId('skeleton-grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('grid', 'gap-4')
    })

    it('renders correct number of items', () => {
      // Arrange & Act
      render(<SkeletonGrid count={6} />)
      
      // Assert
      const cards = screen.getAllByTestId('skeleton-card')
      // Should have 6 skeleton cards
      expect(cards.length).toBe(6)
    })

    it('renders with different column counts', () => {
      // Arrange & Act
      const { rerender } = render(<SkeletonGrid columns={1} />)
      
      // Assert
      expect(screen.getByTestId('skeleton-grid')).toHaveClass('grid-cols-1')

      // Act
      rerender(<SkeletonGrid columns={3} />)
      
      // Assert
      expect(screen.getByTestId('skeleton-grid')).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('renders with different variants', () => {
      // Arrange & Act
      render(<SkeletonGrid variant="stats" count={2} />)
      
      // Assert
      const cards = screen.getAllByTestId('skeleton-card')
      expect(cards.length).toBe(2) // 2 cards
    })
  })
})

// ============================================================================
// SKELETON TABLE TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonTable Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      // Arrange & Act
      render(<SkeletonTable />)
      
      // Assert
      const table = screen.getByTestId('skeleton-table')
      expect(table).toBeInTheDocument()
      expect(table).toHaveClass('space-y-2')
    })

    it('renders header when showHeader is true', () => {
      // Arrange & Act
      render(<SkeletonTable showHeader={true} />)
      
      // Assert
      const elements = screen.getAllByTestId('skeleton')
      // Should have header section plus rows
      expect(elements.length).toBeGreaterThan(5)
    })

    it('renders without header when showHeader is false', () => {
      // Arrange & Act
      render(<SkeletonTable showHeader={false} />)
      
      // Assert
      const elements = screen.getAllByTestId('skeleton')
      // Should have fewer elements without header
      expect(elements.length).toBeLessThan(25)
    })

    it('renders correct number of rows and columns', () => {
      // Arrange & Act
      render(<SkeletonTable rows={3} columns={4} />)
      
      // Assert
      const elements = screen.getAllByTestId('skeleton')
      // Should have header + rows
      expect(elements.length).toBeGreaterThan(3)
    })
  })
})

// ============================================================================
// SKELETON DASHBOARD TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonDashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      // Arrange & Act
      render(<SkeletonDashboard />)
      
      // Assert
      const dashboard = screen.getByTestId('skeleton-dashboard')
      expect(dashboard).toBeInTheDocument()
      expect(dashboard).toHaveClass('space-y-8')
    })

    it('renders stats section when showStats is true', () => {
      // Arrange & Act
      render(<SkeletonDashboard showStats={true} />)
      
      // Assert
      const statsSection = screen.getByTestId('skeleton-stats')
      expect(statsSection).toBeInTheDocument()
    })

    it('renders receipts section when showReceipts is true', () => {
      // Arrange & Act
      render(<SkeletonDashboard showReceipts={true} />)
      
      // Assert
      const receiptsSection = screen.getByTestId('skeleton-receipts')
      expect(receiptsSection).toBeInTheDocument()
    })

    it('renders upload section when showUpload is true', () => {
      // Arrange & Act
      render(<SkeletonDashboard showUpload={true} />)
      
      // Assert
      const uploadSection = screen.getByTestId('skeleton-upload')
      expect(uploadSection).toBeInTheDocument()
    })

    it('can hide sections', () => {
      // Arrange & Act
      render(<SkeletonDashboard showStats={false} showReceipts={false} showUpload={false} />)
      
      // Assert
      expect(screen.queryByTestId('skeleton-stats')).not.toBeInTheDocument()
      expect(screen.queryByTestId('skeleton-receipts')).not.toBeInTheDocument()
      expect(screen.queryByTestId('skeleton-upload')).not.toBeInTheDocument()
    })
  })
})

// ============================================================================
// ACCESSIBILITY TESTS (see master guide: Component Testing)
// ============================================================================

describe('Accessibility', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  it('should have proper ARIA attributes for loading states', () => {
    // Arrange & Act
    render(<Skeleton aria-label="Loading content" />)
    
    // Assert
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content')
  })

  it('should announce loading state to screen readers', () => {
    // Arrange & Act
    render(<SkeletonList count={3} aria-label="Loading receipts" />)
    
    // Assert
    const list = screen.getByLabelText('Loading receipts')
    expect(list).toBeInTheDocument()
  })
})

// ============================================================================
// EDGE CASES TESTS (see master guide: Component Testing)
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  it('should handle zero count gracefully', () => {
    // Arrange & Act
    render(<SkeletonList count={0} />)
    
    // Assert
    const list = screen.getByTestId('skeleton-list')
    expect(list).toBeInTheDocument()
    // Should still render the container
  })

  it('should handle very large counts', () => {
    // Arrange & Act
    render(<SkeletonList count={100} />)
    
    // Assert
    const cards = screen.getAllByTestId('skeleton-card')
    expect(cards.length).toBe(100) // 100 cards
  })

  it('should handle non-existent variant gracefully', () => {
    // Arrange & Act
    render(<Skeleton variant="text" />)
    
    // Assert
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    // Should render with text variant styling
  })
}) 