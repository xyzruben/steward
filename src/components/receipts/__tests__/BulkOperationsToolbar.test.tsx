import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkOperationsToolbar } from '../BulkOperationsToolbar'

const mockReceipts = [
  { id: '1', merchant: 'Store 1', total: 10.99, purchaseDate: '2024-01-01', category: 'Food' },
  { id: '2', merchant: 'Store 2', total: 25.50, purchaseDate: '2024-01-02', category: 'Shopping' },
  { id: '3', merchant: 'Store 3', total: 15.75, purchaseDate: '2024-01-03', category: 'Transportation' }
]

const defaultProps = {
  receipts: mockReceipts,
  selectedReceipts: [],
  onSelectionChange: jest.fn(),
  onBulkDelete: jest.fn().mockResolvedValue(undefined),
  onBulkCategorize: jest.fn().mockResolvedValue(undefined),
  onBulkExport: jest.fn().mockResolvedValue(undefined),
  onRefresh: jest.fn()
}

describe('BulkOperationsToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render select all checkbox', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('should show selected count when receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    expect(screen.getByText('2 receipt(s) selected')).toBeInTheDocument()
  })

  it('should show clear selection button when receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
    
    expect(screen.getByText('Clear Selection')).toBeInTheDocument()
  })

  it('should call onSelectionChange when select all is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Select All'))
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1', '2', '3'])
  })

  it('should call onSelectionChange when clear selection is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Clear Selection'))
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith([])
  })

  it('should show bulk action buttons when receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    expect(screen.getByText('Delete (2)')).toBeInTheDocument()
    expect(screen.getByText('Categorize (2)')).toBeInTheDocument()
    expect(screen.getByText('Export (2)')).toBeInTheDocument()
  })

  it('should not show bulk action buttons when no receipts are selected', () => {
    render(<BulkOperationsToolbar {...defaultProps} />)
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText('Categorize')).not.toBeInTheDocument()
    expect(screen.queryByText('Export')).not.toBeInTheDocument()
  })

  it('should call onBulkDelete when delete button is clicked', async () => {
    window.confirm = jest.fn().mockReturnValue(true)
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Delete (2)'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkDelete).toHaveBeenCalledWith(['1', '2'])
    })
  })

  it('should not call onBulkDelete when user cancels confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(false)
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Delete (2)'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkDelete).not.toHaveBeenCalled()
    })
  })

  it('should show category modal when categorize button is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Categorize (2)'))
    
    expect(screen.getByText('Categorize Receipts')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('should call onBulkCategorize when category is selected and form is submitted', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Categorize (2)'))
    
    const categorySelect = screen.getByDisplayValue('Select a category')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    fireEvent.click(screen.getByText('Categorize'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkCategorize).toHaveBeenCalledWith(['1', '2'], 'Food & Dining', '')
    })
  })

  it('should show alert when trying to categorize without selecting category', async () => {
    window.alert = jest.fn()
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Categorize (2)'))
    fireEvent.click(screen.getByText('Categorize'))
    
    expect(window.alert).toHaveBeenCalledWith('Please select a category')
  })

  it('should call onBulkExport when export button is clicked', async () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
    
    fireEvent.click(screen.getByText('Export (2)'))
    
    await waitFor(() => {
      expect(defaultProps.onBulkExport).toHaveBeenCalledWith(['1', '2'])
    })
  })

  it('should disable buttons when loading', async () => {
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
    fireEvent.click(screen.getByText('Delete (2)'))
    
    // Wait for the loading state to be set
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete (2)').closest('button')
      const categorizeButton = screen.getByText('Categorize (2)').closest('button')
      const exportButton = screen.getByText('Export (2)').closest('button')
      
      expect(deleteButton).toBeDisabled()
      expect(categorizeButton).toBeDisabled()
      expect(exportButton).toBeDisabled()
    })
    
    // Resolve the promise to complete the operation
    resolvePromise!()
  })

  it('should render all category options in the modal', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
    
    fireEvent.click(screen.getByText('Categorize (1)'))
    
    expect(screen.getByDisplayValue('Select a category')).toBeInTheDocument()
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('Shopping')).toBeInTheDocument()
    expect(screen.getByText('Entertainment')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('Utilities')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('should close modal when cancel button is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
    
    fireEvent.click(screen.getByText('Categorize (1)'))
    expect(screen.getByText('Categorize Receipts')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Categorize Receipts')).not.toBeInTheDocument()
  })

  it('should close modal when X button is clicked', () => {
    render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
    
    fireEvent.click(screen.getByText('Categorize (1)'))
    expect(screen.getByText('Categorize Receipts')).toBeInTheDocument()
    
    const closeButton = screen.getByRole('button', { name: /close modal/i })
    fireEvent.click(closeButton)
    expect(screen.queryByText('Categorize Receipts')).not.toBeInTheDocument()
  })
}) 