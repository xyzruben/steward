'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Filter, ChevronDown, ChevronUp, Save, Clock, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { SearchFilters, SearchOptions } from '@/lib/services/search'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface EnhancedSearchProps {
  onSearch: (query: string, filters?: SearchFilters, options?: SearchOptions) => void
  onSaveSearch?: (name: string, query: string, filters: SearchFilters) => void
  placeholder?: string
  className?: string
  showAdvancedFilters?: boolean
  showSuggestions?: boolean
  showSavedSearches?: boolean
}

interface SearchSuggestion {
  text: string
  type: 'recent' | 'merchant' | 'category' | 'suggestion'
  icon?: React.ReactNode
}

// ============================================================================
// ENHANCED SEARCH COMPONENT
// ============================================================================

export function EnhancedSearch({
  onSearch,
  onSaveSearch,
  placeholder = "Search receipts by merchant, category, or description...",
  className = "",
  showAdvancedFilters = true,
  showSuggestions = true,
  showSavedSearches = true
}: EnhancedSearchProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [showSavedSearchesDropdown, setShowSavedSearchesDropdown] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // ============================================================================
  // DEBOUNCED SEARCH
  // ============================================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (debouncedQuery !== searchQuery) {
      onSearch(debouncedQuery, filters, searchOptions)
    }
  }, [debouncedQuery, filters, searchOptions, onSearch])

  // ============================================================================
  // SUGGESTIONS HANDLING
  // ============================================================================

  useEffect(() => {
    if (debouncedQuery && showSuggestions) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery, showSuggestions])

  const fetchSuggestions = async (query: string) => {
    if (!user || !query.trim()) return

    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        q: query,
        suggestions: 'true',
        limit: '10'
      })

      const response = await fetch(`/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        const searchSuggestions: SearchSuggestion[] = []
        
        // Add recent searches
        if (data.suggestions) {
          data.suggestions.forEach((suggestion: string) => {
            searchSuggestions.push({
              text: suggestion,
              type: 'suggestion',
              icon: <Sparkles className="h-4 w-4" />
            })
          })
        }

        setSuggestions(searchSuggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // SAVED SEARCHES HANDLING
  // ============================================================================

  useEffect(() => {
    if (showSavedSearches && user) {
      fetchSavedSearches()
    }
  }, [showSavedSearches, user])

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/saved')
      if (response.ok) {
        const data = await response.json()
        setSavedSearches(data)
      }
    } catch (error) {
      console.error('Failed to fetch saved searches:', error)
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSuggestionsDropdown(true)
    setSelectedSuggestionIndex(-1)
  }

  const handleInputFocus = () => {
    setShowSuggestionsDropdown(true)
  }

  const handleInputBlur = () => {
    // Delay hiding to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestionsDropdown(false)
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        const suggestion = suggestions[selectedSuggestionIndex]
        setSearchQuery(suggestion.text)
        setShowSuggestionsDropdown(false)
        onSearch(suggestion.text, filters, searchOptions)
      } else {
        onSearch(searchQuery, filters, searchOptions)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsDropdown(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestionsDropdown(false)
    onSearch(suggestion.text, filters, searchOptions)
  }

  const handleClear = () => {
    setSearchQuery('')
    setDebouncedQuery('')
    setSuggestions([])
    setShowSuggestionsDropdown(false)
    onSearch('', filters, searchOptions)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters }
    
    if (value === '' || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    setFilters(newFilters)
    onSearch(searchQuery, newFilters, searchOptions)
  }

  const handleOptionChange = (key: keyof SearchOptions, value: any) => {
    const newOptions = { ...searchOptions, [key]: value }
    setSearchOptions(newOptions)
    onSearch(searchQuery, filters, newOptions)
  }

  const handleSaveSearch = () => {
    if (!searchQuery.trim() || !onSaveSearch) return
    
    const name = prompt('Enter a name for this search:')
    if (name) {
      onSaveSearch(name, searchQuery, filters)
    }
  }

  const handleSavedSearchClick = (savedSearch: any) => {
    setSearchQuery(savedSearch.query)
    setFilters(savedSearch.filters || {})
    setShowSavedSearchesDropdown(false)
    onSearch(savedSearch.query, savedSearch.filters, searchOptions)
  }

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderSuggestions = () => {
    if (!showSuggestionsDropdown || suggestions.length === 0) return null

    return (
      <div 
        ref={suggestionsRef}
        className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.type}-${index}`}
            onClick={() => handleSuggestionClick(suggestion)}
            className={`w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2 ${
              index === selectedSuggestionIndex ? 'bg-slate-100 dark:bg-slate-700' : ''
            }`}
          >
            {suggestion.icon && (
              <span className="text-slate-400">{suggestion.icon}</span>
            )}
            <span className="text-slate-700 dark:text-slate-300">{suggestion.text}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderSavedSearches = () => {
    if (!showSavedSearchesDropdown || savedSearches.length === 0) return null

    return (
      <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
        <div className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
          Saved Searches
        </div>
        {savedSearches.map((savedSearch) => (
          <button
            key={savedSearch.id}
            onClick={() => handleSavedSearchClick(savedSearch)}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2"
          >
            <Save className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">{savedSearch.name}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderAdvancedFilters = () => {
    if (!showAdvanced) return null

    return (
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <input
              type="text"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              placeholder="e.g., Food & Dining"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Merchant Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Merchant
            </label>
            <input
              type="text"
              value={filters.merchant || ''}
              onChange={(e) => handleFilterChange('merchant', e.target.value || undefined)}
              placeholder="e.g., Walmart"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>


        </div>

        {/* Search Options */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-6">
            <select
              value={searchOptions.sortBy}
              onChange={(e) => handleOptionChange('sortBy', e.target.value)}
              className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="merchant">Sort by Merchant</option>
            </select>

            <select
              value={searchOptions.sortOrder}
              onChange={(e) => handleOptionChange('sortOrder', e.target.value)}
              className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label="Enhanced search receipts"
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
          
          {searchQuery && (
            <button
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showSavedSearches && (
            <button
              onClick={() => setShowSavedSearchesDropdown(!showSavedSearchesDropdown)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Saved searches"
            >
              <Save className="h-4 w-4" />
            </button>
          )}

          {showAdvancedFilters && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Advanced filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          )}

          {onSaveSearch && searchQuery && (
            <button
              onClick={handleSaveSearch}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Save search"
            >
              <Clock className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdowns */}
      {renderSuggestions()}
      {renderSavedSearches()}
      {renderAdvancedFilters()}
    </div>
  )
} 