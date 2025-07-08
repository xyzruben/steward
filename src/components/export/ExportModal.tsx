'use client'

// ============================================================================
// EXPORT MODAL COMPONENT
// ============================================================================
// User-friendly export interface for receipts and analytics data
// See: Master System Guide - Frontend Architecture, User Experience

import React, { useState } from 'react'
import { Download, FileText, FileJson, Filter, X } from 'lucide-react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeAnalytics: boolean
  dateRange: {
    start: string
    end: string
  } | null
  categories: string[]
  merchants: string[]
  minAmount: string
  maxAmount: string
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  availableCategories?: string[]
  availableMerchants?: string[]
  onExport: (options: ExportOptions) => Promise<void>
}

// ============================================================================
// EXPORT MODAL COMPONENT
// ============================================================================

export default function ExportModal({
  isOpen,
  onClose,
  availableCategories = [],
  availableMerchants = [],
  onExport
}: ExportModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeAnalytics: false,
    dateRange: null,
    categories: [],
    merchants: [],
    minAmount: '',
    maxAmount: ''
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleExport = async () => {
    setIsLoading(true)
    try {
      await onExport(options)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error notification
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormatChange = (format: 'csv' | 'json' | 'pdf') => {
    setOptions(prev => ({ ...prev, format }))
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setOptions(prev => ({
      ...prev,
      dateRange: prev.dateRange ? {
        ...prev.dateRange,
        [field]: value
      } : {
        start: field === 'start' ? value : '',
        end: field === 'end' ? value : ''
      }
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setOptions(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleMerchantToggle = (merchant: string) => {
    setOptions(prev => ({
      ...prev,
      merchants: prev.merchants.includes(merchant)
        ? prev.merchants.filter(m => m !== merchant)
        : [...prev.merchants, merchant]
    }))
  }

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderFormatOptions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Export Format</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleFormatChange('csv')}
          className={`p-4 border rounded-lg text-left transition-colors ${
            options.format === 'csv'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6" />
            <div>
              <div className="font-medium">CSV</div>
              <div className="text-sm text-gray-500">Excel compatible</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleFormatChange('json')}
          className={`p-4 border rounded-lg text-left transition-colors ${
            options.format === 'json'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <FileJson className="w-6 h-6" />
            <div>
              <div className="font-medium">JSON</div>
              <div className="text-sm text-gray-500">Structured data</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleFormatChange('pdf')}
          className={`p-4 border rounded-lg text-left transition-colors ${
            options.format === 'pdf'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6" />
            <div>
              <div className="font-medium">PDF</div>
              <div className="text-sm text-gray-500">Printable format</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )

  const renderDateRange = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={options.dateRange?.start || ''}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={options.dateRange?.end || ''}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderAmountRange = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Amount Range</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={options.minAmount}
            onChange={(e) => setOptions(prev => ({ ...prev, minAmount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={options.maxAmount}
            onChange={(e) => setOptions(prev => ({ ...prev, maxAmount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderFilters = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      
      {/* Categories */}
      {availableCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  options.categories.includes(category)
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Merchants */}
      {availableMerchants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Merchants
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableMerchants.map(merchant => (
              <button
                key={merchant}
                onClick={() => handleMerchantToggle(merchant)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  options.merchants.includes(merchant)
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {merchant}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Format Selection */}
              {renderFormatOptions()}

              {/* Analytics Option */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Include Analytics</h3>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={options.includeAnalytics}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Include analytics summary (categories, merchants, trends)
                  </span>
                </label>
              </div>

              {/* Advanced Options Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </span>
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-6 border-t border-gray-200 pt-4">
                  {renderDateRange()}
                  {renderAmountRange()}
                  {renderFilters()}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Export will include all receipts matching your criteria
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 