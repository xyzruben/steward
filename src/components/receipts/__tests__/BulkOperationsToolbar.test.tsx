import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkOperationsToolbar } from '../BulkOperationsToolbar'

const mockReceipts = [
  { 
    id: '1', 
    merchant: 'Store 1', 
    total: 10.99, 
    purchaseDate: new Date('2024-01-01'), 
    category: 'Food',
    imageUrl: 'https://example.com/receipt1.jpg'
  },
  { 
    id: '2', 
    merchant: 'Store 2', 
    total: 25.50, 
    purchaseDate: new Date('2024-01-02'), 
    category: 'Shopping',
    imageUrl: 'https://example.com/receipt2.jpg'
  },
  { 
    id: '3', 
    merchant: 'Store 3', 
    total: 15.75, 
    purchaseDate: new Date('2024-01-03'), 
    category: 'Transportation',
    imageUrl: 'https://example.com/receipt3.jpg'
  }
]

const defaultProps = {
  receipts: mockReceipts,
  selectedReceipts: [],
  onSelectionChange: jest.fn(),
  onBulkUpdate: jest.fn().mockResolvedValue(undefined),
  onBulkDelete: jest.fn().mockResolvedValue(undefined),
  onBulkExport: jest.fn().mockResolvedValue(undefined),
  onShowFilters: jest.fn(),
  isLoading: false
}

describe('BulkOperationsToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render select all button', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    expect(screen.getByText('Select All')).toBeInTheDocument()
  })

  it('should show selected count when receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })

  it('should show clear selection button when receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
    
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('should call onSelectionChange when select all is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Select All'))
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1', '2', '3'])
  })

  it('should call onSelectionChange when clear selection is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Clear'))
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith([])
  })

  it('should show bulk action buttons when receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Update')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('should not show bulk action buttons when no receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText('Update')).not.toBeInTheDocument()
    expect(screen.queryByText('Export')).not.toBeInTheDocument()
  })

  it('should call onBulkDelete when delete button is clicked', async () => {
    window.confirm = jest.fn().mockReturnValue(true)
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkDelete).toHaveBeenCalledWith(['1', '2'])
    })
  })

  it('should not call onBulkDelete when user cancels confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(false)
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkDelete).not.toHaveBeenCalled()
    })
  })

  it('should call onBulkUpdate when update button is clicked', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Update'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkUpdate).toHaveBeenCalledWith(['1', '2'], {
        category: 'Updated Category',
        subcategory: 'Updated Subcategory'
      })
    })
  })

  it('should call onBulkExport when export button is clicked', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Export'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkExport).toHaveBeenCalledWith(['1', '2'], 'csv')
    })
  })

  it('should call onShowFilters when filters button is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Filters'))
    
    expect(defaultProps.onShowFilters).toHaveBeenCalled()
  })

  it('should disable buttons when loading', () => {
    render(<BulkOperationsToolbar {...defaultProps} isLoading={true} />)
    
    const selectAllButton = screen.getByText('Select All').closest('button')
    const filtersButton = screen.getByText('Filters').closest('button')
    
    expect(selectAllButton).toBeDisabled()
    expect(filtersButton).toBeDisabled()
  })

  it('should disable buttons when processing', async () => {
    // Create a promise that we can control
    let resolvePromise: () => void
    const mockPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    
    const propsWithSlowDelete = {
      ...defaultProps,
      onBulkDelete: jest.fn().mockReturnValue(mockPromise)
    }
    
    render(<BulkOperationsToolbar {...propsWithSlowDelete} selectedReceipts={['1', '2']} />)
    
    window.confirm = jest.fn().mockReturnValue(true)
    
    // Start the delete operation
    fireEvent.click(screen.getByText('Delete'))
    
    // Wait for the processing state to be set
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete').closest('button')
      const updateButton = screen.getByText('Update').closest('button')
      const exportButton = screen.getByText('Export').closest('button')
      
      expect(deleteButton).toBeDisabled()
      expect(updateButton).toBeDisabled()
      expect(exportButton).toBeDisabled()
    })
    
    // Resolve the promise to complete the operation
    resolvePromise!()
  })

  it('should show processing indicator when processing', async () => {
    let resolvePromise: () => void
    const mockPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    
    const propsWithSlowDelete = {
      ...defaultProps,
      onBulkDelete: jest.fn().mockReturnValue(mockPromise)
    }
    
    render(<BulkOperationsToolbar {...propsWithSlowDelete} selectedReceipts={['1', '2']} />)
    
    window.confirm = jest.fn().mockReturnValue(true)
    
    fireEvent.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(screen.getByText('Processing bulk operation...')).toBeInTheDocument()
    })
    
    resolvePromise!()
  })

  it('should show warning for large selections', () => {
    const largeReceipts = Array.from({ length: 101 }, (_, i) => ({
      id: `receipt-${i}`,
      merchant: `Store ${i}`,
      total: 10.00,
      purchaseDate: new Date('2024-01-01'),
      imageUrl: `https://example.com/receipt${i}.jpg`
    }))
    
    render(
      <BulkOperationsToolbar 
        {...defaultProps} 
        receipts={largeReceipts}
        selectedReceipts={largeReceipts.map(r => r.id)}
      />
    )
    
    expect(screen.getByText(/Large selection detected/)).toBeInTheDocument()
  })

  it('should not render when no receipts are provided', () => {
    const { container } = render(<BulkOperationsToolbar {...defaultProps} receipts={[]} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('should show success notification after successful operation', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
    
    fireEvent.click(screen.getByText('Update'))
    
    await waitFor(() => {
      expect(screen.getByText('Updated 1 receipts')).toBeInTheDocument()
    })
  })

  it('should show error notification after failed operation', async () => {
    const propsWithError = {
      ...defaultProps,
      onBulkUpdate: jest.fn().mockRejectedValue(new Error('Update failed'))
    }
    
    render(<BulkOperationsToolbar {...propsWithError} selectedReceipts={['1']} />)
    
    fireEvent.click(screen.getByText('Update'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update receipts')).toBeInTheDocument()
    })
  })

  it('should clear selection after successful delete', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    window.confirm = jest.fn().mockReturnValue(true)
    fireEvent.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(defaultProps.onSelectionChange).toHaveBeenCalledWith([])
    })
  })

  it('should clear selection after successful update', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Update'))
    
    await waitFor(() => {
      expect(defaultProps.onSelectionChange).toHaveBeenCalledWith([])
    })
  })
}) 