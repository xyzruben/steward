// ============================================================================
// ADVANCED FILTERS COMPONENT
// ============================================================================
// Advanced filtering interface for receipts
// See: Master System Guide - Frontend Architecture, UI Components

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  Search, 
  Tag, 
  Store,
  BarChart3,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface FilterOptions {
  categories: string[]
  merchants: string[]
  dateRange: { min: Date; max: Date }
  amountRange: { min: number; max: number }
}

export interface AppliedFilters {
  dateRange?: {
    start?: Date
    end?: Date
  }
  amountRange?: {
    min?: number
    max?: number
  }
  categories?: string[]
  merchants?: string[]
  confidenceScore?: {
    min?: number
    max?: number
  }
  hasSummary?: boolean
  searchQuery?: string
}

export interface AdvancedFiltersProps {
  filterOptions: FilterOptions
  appliedFilters: AppliedFilters
  onFiltersChange: (filters: AppliedFilters) => void
  onSaveFilter?: (name: string, filters: AppliedFilters) => Promise<void>
  onLoadFilter?: (name: string) => Promise<AppliedFilters>
  savedFilters?: Array<{ name: string; filters: AppliedFilters }>
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdvancedFilters({
  filterOptions,
  appliedFilters,
  onFiltersChange,
  onSaveFilter,
  onLoadFilter,
  savedFilters = [],
  isLoading = false
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<AppliedFilters>(appliedFilters)
  const [isSaving, setIsSaving] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    setLocalFilters(appliedFilters)
  }, [appliedFilters])

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================

  const updateLocalFilter = useCallback((key: keyof AppliedFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters)
  }, [localFilters, onFiltersChange])

  const handleClearFilters = useCallback(() => {
    const clearedFilters: AppliedFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }, [onFiltersChange])

  const handleResetToApplied = useCallback(() => {
    setLocalFilters(appliedFilters)
  }, [appliedFilters])

  // ============================================================================
  // SAVE/LOAD HANDLERS
  // ============================================================================

  const handleSaveFilter = useCallback(async () => {
    if (!saveFilterName.trim() || !onSaveFilter) return

    setIsSaving(true)
    try {
      await onSaveFilter(saveFilterName.trim(), localFilters)
      setSaveFilterName('')
    } catch (error) {
      console.error('Failed to save filter:', error)
    } finally {
      setIsSaving(false)
    }
  }, [saveFilterName, localFilters, onSaveFilter])

  const handleLoadFilter = useCallback(async (name: string) => {
    if (!onLoadFilter) return

    try {
      const filters = await onLoadFilter(name)
      setLocalFilters(filters)
      onFiltersChange(filters)
    } catch (error) {
      console.error('Failed to load filter:', error)
    }
  }, [onLoadFilter, onFiltersChange])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getActiveFilterCount = useCallback(() => {
    let count = 0
    if (localFilters.dateRange?.start || localFilters.dateRange?.end) count++
    if (localFilters.amountRange?.min !== undefined || localFilters.amountRange?.max !== undefined) count++
    if (localFilters.categories && localFilters.categories.length > 0) count++
    if (localFilters.merchants && localFilters.merchants.length > 0) count++
    if (localFilters.confidenceScore?.min !== undefined || localFilters.confidenceScore?.max !== undefined) count++
    if (localFilters.hasSummary !== undefined) count++
    if (localFilters.searchQuery && localFilters.searchQuery.trim()) count++
    return count
  }, [localFilters])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString()
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={isLoading}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
              <span className="text-sm">Clear All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter Receipts</span>
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToApplied}
                  disabled={isLoading}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="text-sm">Reset</span>
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  disabled={isLoading}
                  className="flex items-center space-x-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Filter className="h-3 w-3" />
                  )}
                  <span className="text-sm">Apply</span>
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Filter receipts by various criteria. Changes are applied when you click "Apply".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Query */}
            <div>
              <Label htmlFor="searchQuery" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Label>
              <Input
                id="searchQuery"
                placeholder="Search receipts by merchant, category, or text..."
                value={localFilters.searchQuery || ''}
                onChange={(e) => updateLocalFilter('searchQuery', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Date Range */}
            <div>
              <Label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date Range</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startDate" className="text-xs text-slate-500">
                    From
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateLocalFilter('dateRange', {
                      ...localFilters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs text-slate-500">
                    To
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateLocalFilter('dateRange', {
                      ...localFilters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <Label className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Amount Range</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minAmount" className="text-xs text-slate-500">
                    Min Amount
                  </Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={localFilters.amountRange?.min || ''}
                    onChange={(e) => updateLocalFilter('amountRange', {
                      ...localFilters.amountRange,
                      min: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount" className="text-xs text-slate-500">
                    Max Amount
                  </Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={localFilters.amountRange?.max || ''}
                    onChange={(e) => updateLocalFilter('amountRange', {
                      ...localFilters.amountRange,
                      max: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <Label className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Categories</span>
              </Label>
              <Select
                value=""
                onValueChange={(value) => {
                  const currentCategories = localFilters.categories || []
                  if (!currentCategories.includes(value)) {
                    updateLocalFilter('categories', [...currentCategories, value])
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select categories..." />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localFilters.categories && localFilters.categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {localFilters.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{category}</span>
                      <button
                        onClick={() => updateLocalFilter('categories', 
                          localFilters.categories?.filter(c => c !== category)
                        )}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Merchants */}
            <div>
              <Label className="flex items-center space-x-2">
                <Store className="h-4 w-4" />
                <span>Merchants</span>
              </Label>
              <Select
                value=""
                onValueChange={(value) => {
                  const currentMerchants = localFilters.merchants || []
                  if (!currentMerchants.includes(value)) {
                    updateLocalFilter('merchants', [...currentMerchants, value])
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select merchants..." />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.merchants.map((merchant) => (
                    <SelectItem key={merchant} value={merchant}>
                      {merchant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localFilters.merchants && localFilters.merchants.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {localFilters.merchants.map((merchant) => (
                    <Badge
                      key={merchant}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{merchant}</span>
                      <button
                        onClick={() => updateLocalFilter('merchants', 
                          localFilters.merchants?.filter(m => m !== merchant)
                        )}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Confidence Score */}
            <div>
              <Label className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>AI Confidence Score</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minConfidence" className="text-xs text-slate-500">
                    Min Score
                  </Label>
                  <Input
                    id="minConfidence"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.00"
                    value={localFilters.confidenceScore?.min || ''}
                    onChange={(e) => updateLocalFilter('confidenceScore', {
                      ...localFilters.confidenceScore,
                      min: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxConfidence" className="text-xs text-slate-500">
                    Max Score
                  </Label>
                  <Input
                    id="maxConfidence"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="1.00"
                    value={localFilters.confidenceScore?.max || ''}
                    onChange={(e) => updateLocalFilter('confidenceScore', {
                      ...localFilters.confidenceScore,
                      max: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Has Summary */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasSummary">Has AI Summary</Label>
              <Switch
                id="hasSummary"
                checked={localFilters.hasSummary || false}
                onCheckedChange={(checked) => updateLocalFilter('hasSummary', checked)}
              />
            </div>

            {/* Save Filter */}
            {onSaveFilter && (
              <div className="border-t pt-4">
                <Label htmlFor="saveFilterName" className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Filter</span>
                </Label>
                <div className="mt-1 flex space-x-2">
                  <Input
                    id="saveFilterName"
                    placeholder="Enter filter name..."
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                  />
                  <Button
                    onClick={handleSaveFilter}
                    disabled={!saveFilterName.trim() || isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Saved Filters</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {savedFilters.map((savedFilter) => (
                    <Badge
                      key={savedFilter.name}
                      variant="outline"
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => handleLoadFilter(savedFilter.name)}
                    >
                      {savedFilter.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 