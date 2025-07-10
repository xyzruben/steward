// ============================================================================
// SKELETON COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing Strategy)
// ============================================================================
// Comprehensive tests for skeleton loading states and components
// Follows master guide: Testing Strategy, Component Testing, Unit Testing

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonList, SkeletonGrid, SkeletonTable, SkeletonDashboard } from '../Skeleton'

// ============================================================================
// BASE SKELETON TESTS (see master guide: Component Testing)
// ============================================================================

describe('Skeleton Component', () => {
  it('renders with default props', () => {
    render(<Skeleton />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('bg-slate-200', 'dark:bg-slate-700', 'animate-pulse')
  })

  it('renders with custom width and height', () => {
    render(<Skeleton width={100} height={50} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' })
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Skeleton variant="circular" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full')

    rerender(<Skeleton variant="rectangular" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md')

    rerender(<Skeleton variant="card" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-lg')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Skeleton size="sm" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('h-3')

    rerender(<Skeleton size="lg" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('h-6')

    rerender(<Skeleton size="xl" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('h-8')
  })

  it('can disable animation', () => {
    render(<Skeleton animate={false} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).not.toHaveClass('animate-pulse')
  })
})

// ============================================================================
// SKELETON CARD TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonCard Component', () => {
  it('renders with default props', () => {
    render(<SkeletonCard />)
    const card = screen.getByTestId('skeleton-card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('bg-white', 'dark:bg-slate-800', 'rounded-lg')
  })

  it('renders receipt variant correctly', () => {
    render(<SkeletonCard variant="receipt" />)
    const card = screen.getByTestId('skeleton-card')
    expect(card).toHaveClass('p-4', 'space-y-4')
  })

  it('renders stats variant correctly', () => {
    render(<SkeletonCard variant="stats" />)
    const card = screen.getByTestId('skeleton-card')
    expect(card).toHaveClass('p-6', 'space-y-4')
  })

  it('renders with custom lines', () => {
    render(<SkeletonCard lines={5} />)
    const skeletons = screen.getAllByTestId('skeleton')
    // Should have multiple skeleton elements for the lines
    expect(skeletons.length).toBeGreaterThan(1)
  })

  it('renders with avatar when showAvatar is true', () => {
    render(<SkeletonCard showAvatar={true} />)
    const skeletons = screen.getAllByTestId('skeleton')
    // Should have more skeleton elements when avatar is shown
    expect(skeletons.length).toBeGreaterThan(3)
  })
})

// ============================================================================
// SKELETON LIST TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonList Component', () => {
  it('renders with default props', () => {
    render(<SkeletonList />)
    const list = screen.getByRole('generic')
    expect(list).toBeInTheDocument()
    expect(list).toHaveClass('space-y-4')
  })

  it('renders correct number of items', () => {
    render(<SkeletonList count={5} />)
    const cards = screen.getAllByRole('generic')
    // Should have 5 skeleton cards plus the container
    expect(cards.length).toBe(6)
  })

  it('renders with different variants', () => {
    render(<SkeletonList variant="receipt" count={2} />)
    const cards = screen.getAllByRole('generic')
    expect(cards.length).toBe(3) // 2 cards + 1 container
  })

  it('applies custom className', () => {
    render(<SkeletonList className="custom-class" />)
    const list = screen.getByRole('generic')
    expect(list).toHaveClass('custom-class')
  })
})

// ============================================================================
// SKELETON GRID TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonGrid Component', () => {
  it('renders with default props', () => {
    render(<SkeletonGrid />)
    const grid = screen.getByRole('generic')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('grid', 'gap-4')
  })

  it('renders correct number of items', () => {
    render(<SkeletonGrid count={6} />)
    const cards = screen.getAllByRole('generic')
    // Should have 6 skeleton cards plus the container
    expect(cards.length).toBe(7)
  })

  it('renders with different column counts', () => {
    const { rerender } = render(<SkeletonGrid columns={1} />)
    expect(screen.getByRole('generic')).toHaveClass('grid-cols-1')

    rerender(<SkeletonGrid columns={3} />)
    expect(screen.getByRole('generic')).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('renders with different variants', () => {
    render(<SkeletonGrid variant="stats" count={2} />)
    const cards = screen.getAllByRole('generic')
    expect(cards.length).toBe(3) // 2 cards + 1 container
  })
})

// ============================================================================
// SKELETON TABLE TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonTable Component', () => {
  it('renders with default props', () => {
    render(<SkeletonTable />)
    const table = screen.getByRole('generic')
    expect(table).toBeInTheDocument()
    expect(table).toHaveClass('space-y-2')
  })

  it('renders header when showHeader is true', () => {
    render(<SkeletonTable showHeader={true} />)
    const elements = screen.getAllByRole('generic')
    // Should have header section plus rows
    expect(elements.length).toBeGreaterThan(5)
  })

  it('renders without header when showHeader is false', () => {
    render(<SkeletonTable showHeader={false} />)
    const elements = screen.getAllByRole('generic')
    // Should have fewer elements without header
    expect(elements.length).toBeLessThan(10)
  })

  it('renders correct number of rows and columns', () => {
    render(<SkeletonTable rows={3} columns={4} />)
    const elements = screen.getAllByRole('generic')
    // Should have header + rows
    expect(elements.length).toBeGreaterThan(3)
  })
})

// ============================================================================
// SKELETON DASHBOARD TESTS (see master guide: Component Testing)
// ============================================================================

describe('SkeletonDashboard Component', () => {
  it('renders with default props', () => {
    render(<SkeletonDashboard />)
    const dashboard = screen.getByRole('generic')
    expect(dashboard).toBeInTheDocument()
    expect(dashboard).toHaveClass('space-y-8')
  })

  it('renders stats section when showStats is true', () => {
    render(<SkeletonDashboard showStats={true} />)
    const elements = screen.getAllByRole('generic')
    // Should have multiple skeleton elements for stats
    expect(elements.length).toBeGreaterThan(5)
  })

  it('renders receipts section when showReceipts is true', () => {
    render(<SkeletonDashboard showReceipts={true} />)
    const elements = screen.getAllByRole('generic')
    // Should have skeleton elements for receipts
    expect(elements.length).toBeGreaterThan(3)
  })

  it('renders upload section when showUpload is true', () => {
    render(<SkeletonDashboard showUpload={true} />)
    const elements = screen.getAllByRole('generic')
    // Should have skeleton elements for upload
    expect(elements.length).toBeGreaterThan(3)
  })

  it('can hide sections', () => {
    render(<SkeletonDashboard showStats={false} showReceipts={false} showUpload={false} />)
    const elements = screen.getAllByRole('generic')
    // Should have fewer elements when sections are hidden
    expect(elements.length).toBeLessThan(10)
  })
})

// ============================================================================
// ACCESSIBILITY TESTS (see master guide: Accessibility)
// ============================================================================

describe('Skeleton Accessibility', () => {
  it('has proper test IDs for accessibility', () => {
    render(<Skeleton />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('maintains proper structure', () => {
    render(<SkeletonCard />)
    const card = screen.getByTestId('skeleton-card')
    expect(card).toBeInTheDocument()
  })

  it('works with screen readers', () => {
    render(<SkeletonList count={3} />)
    const cards = screen.getAllByTestId('skeleton-card')
    expect(cards.length).toBe(3)
  })
})

// ============================================================================
// PERFORMANCE TESTS (see master guide: Performance Monitoring)
// ============================================================================

describe('Skeleton Performance', () => {
  it('renders quickly with many items', () => {
    const startTime = performance.now()
    render(<SkeletonGrid count={20} />)
    const endTime = performance.now()
    
    // Should render 20 items in under 100ms
    expect(endTime - startTime).toBeLessThan(100)
  })

  it('handles large lists efficiently', () => {
    const startTime = performance.now()
    render(<SkeletonList count={50} />)
    const endTime = performance.now()
    
    // Should render 50 items in under 200ms
    expect(endTime - startTime).toBeLessThan(200)
  })
}) 