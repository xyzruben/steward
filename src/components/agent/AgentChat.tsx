import React, { useState } from 'react';

/**
 * AgentChat UI component for Steward's AI-native financial assistant.
 * Follows Master System Guide: modular, testable, minimal styling, clear UX.
 *
 * Features:
 * - Input box for user queries
 * - Display area for agent responses (natural + structured)
 * - Loading and error states
 * - TODO: Streaming, rich formatting, chat history
 */
const AgentChat: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [structured, setStructured] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setStructured(null);
    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setResponse(data.message || 'No response');
      setStructured(data.data || null);
    } catch (err: any) {
      setError(err.message || 'Error contacting agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 border rounded shadow bg-white">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Ask anything about your spending..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
          aria-label="Agent query input"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={loading || !query.trim()}
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {response && (
        <div className="mb-2">
          <strong>Agent:</strong> {response}
        </div>
      )}
      {structured && (
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
          {JSON.stringify(structured, null, 2)}
        </pre>
      )}
      {/* TODO: Add chat history, streaming, and rich formatting */}
    </div>
  );
};

export default AgentChat; 