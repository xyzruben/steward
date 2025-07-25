import React, { useState } from 'react';

/**
 * AgentChat UI component for Steward's AI-native financial assistant.
 * Follows Master System Guide: modular, testable, minimal styling, clear UX.
 *
 * Features:
 * - Input box for user queries
 * - Display area for agent responses (natural + structured)
 * - Loading and error states
 * - Insights display
 * - TODO: Streaming, rich formatting, chat history
 */
const AgentChat: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [structured, setStructured] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setStructured(null);
    setInsights([]);
    
    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Unknown error');
      }
      
      setResponse(data.message || 'No response');
      setStructured(data.data || null);
      setInsights(data.insights || []);
    } catch (err: any) {
      setError(err.message || 'Error contacting agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        💬 Financial Assistant
      </h3>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Ask anything about your spending..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
          aria-label="Agent query input"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={loading || !query.trim()}
        >
          {loading ? 'Analyzing...' : 'Ask'}
        </button>
      </form>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-200 font-medium">Error</div>
          <div className="text-red-600 dark:text-red-300 text-sm">{error}</div>
        </div>
      )}
      
      {response && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-blue-900 dark:text-blue-100 font-medium mb-2">💡 Analysis</div>
          <div className="text-blue-800 dark:text-blue-200">{response}</div>
        </div>
      )}
      
      {insights.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🔍 Key Insights</div>
          <div className="space-y-1">
            {insights.map((insight, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {structured && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📊 Data</div>
          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
            {JSON.stringify(structured, null, 2)}
          </pre>
        </div>
      )}
      
      {/* TODO: Add chat history, streaming, and rich formatting */}
    </div>
  );
};

export default AgentChat; 