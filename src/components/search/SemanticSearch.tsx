'use client'

import React, { useState, useCallback } from 'react'
import { Search, Sparkles, TrendingUp, DollarSign, Calendar, Building2, Brain } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SemanticSearchResult {
  receiptId: string
  similarity: number
  content: string
  metadata: {
    merchant: string
    category?: string
    subcategory?: string
    amount: number
    date: string
    summary?: string
  }
}

interface SpendingInsights {
  insights: SemanticSearchResult[]
  totalAmount: number
  averageAmount: number
  topCategories: Array<{
    category: string
    count: number
    totalAmount: number
  }>
  topMerchants: Array<{
    merchant: string
    count: number
    totalAmount: number
  }>
  count: number
}

interface SemanticSearchProps {
  onResults?: (results: SemanticSearchResult[]) => void
  onInsights?: (insights: SpendingInsights) => void
  className?: string
  placeholder?: string
  showSuggestions?: boolean
}

// ============================================================================
// SEMANTIC SEARCH COMPONENT
// ============================================================================

export function SemanticSearch({
  onResults,
  onInsights,
  className = "",
  placeholder = "Ask about your spending in natural language...",
  showSuggestions = true
}: SemanticSearchProps) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<'search' | 'insights'>('search')
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [insights, setInsights] = useState<SpendingInsights | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // SEARCH SUGGESTIONS
  // ============================================================================

  const searchSuggestions = [
    "What did I spend on food last month?",
    "Show me all my coffee purchases",
    "How much did I spend on transportation?",
    "Find receipts from grocery stores",
    "What are my biggest expenses?",
    "Show me dining out expenses",
    "How much did I spend on gas?",
    "Find all Amazon purchases",
    "What did I buy at Target?",
    "Show me entertainment expenses"
  ]

  // ============================================================================
  // SEARCH FUNCTIONS
  // ============================================================================

  const performSemanticSearch = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) return

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: '20',
        threshold: '0.6'
      })

      const response = await fetch(`/api/search/semantic?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        onResults?.(data.results || [])
      } else {
        throw new Error('Search failed')
      }
    } catch (error) {
      console.error('Semantic search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [user, onResults])

  const generateSpendingInsights = useCallback(async (insightQuery: string) => {
    if (!user || !insightQuery.trim()) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: insightQuery.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
        onInsights?.(data.insights)
      } else {
        throw new Error('Failed to generate insights')
      }
    } catch (error) {
      console.error('Insights generation error:', error)
      setError('Failed to generate insights. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [user, onInsights])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSearch = useCallback(() => {
    if (!query.trim()) return

    if (searchMode === 'search') {
      performSemanticSearch(query)
    } else {
      generateSpendingInsights(query)
    }
  }, [query, searchMode, performSemanticSearch, generateSpendingInsights])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion)
  }, [])

  const handleModeToggle = useCallback(() => {
    setSearchMode(prev => prev === 'search' ? 'insights' : 'search')
    setResults([])
    setInsights(null)
    setError(null)
  }, [])

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderSearchResults = () => {
    if (results.length === 0) return null

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Search Results ({results.length})
        </h3>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={`${result.receiptId}-${index}`}
              className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {result.metadata.merchant}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${result.metadata.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(result.metadata.date).toLocaleDateString()}
                </span>
                {result.metadata.category && (
                  <span className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {result.metadata.category}
                  </span>
                )}
              </div>
              
              {result.metadata.summary && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {result.metadata.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderInsights = () => {
    if (!insights) return null

    return (
      <div className="mt-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Spending Insights
        </h3>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Amount</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  ${insights.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Average</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  ${insights.averageAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Transactions</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {insights.count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        {insights.topCategories.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Top Categories</h4>
            <div className="space-y-2">
              {insights.topCategories.map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {category.count} transactions
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      ${category.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Merchants */}
        {insights.topMerchants.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Top Merchants</h4>
            <div className="space-y-2">
              {insights.topMerchants.map((merchant, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">{merchant.merchant}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {merchant.count} transactions
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      ${merchant.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={handleModeToggle}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              searchMode === 'search'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
            }`}
          >
            {searchMode === 'search' ? (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                <span>Insights</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />

          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && query.length === 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Try asking about your spending:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-2 text-left text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <Sparkles className="h-3 w-3 inline mr-2" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searchMode === 'search' ? renderSearchResults() : renderInsights()}
    </div>
  )
} 