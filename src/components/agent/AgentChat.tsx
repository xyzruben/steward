'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Zap, Clock, Database } from 'lucide-react';

interface AgentResponse {
  message: string;
  data: any;
  insights?: string[];
  error?: string;
  cached?: boolean;
  executionTime?: number;
}

interface StreamingAgentResponse {
  type: 'start' | 'function_call' | 'data_processing' | 'summary' | 'complete' | 'error';
  message?: string;
  data?: any;
  insights?: string[];
  error?: string;
  cached?: boolean;
  executionTime?: number;
}

interface AgentChatProps {
  className?: string;
}

export default function AgentChat({ className = '' }: AgentChatProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [performanceStats, setPerformanceStats] = useState<{
    cached: boolean;
    executionTime?: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setPerformanceStats(null);

    if (streamingEnabled) {
      await handleStreamingQuery();
    } else {
      await handleRegularQuery();
    }
  };

  const handleRegularQuery = async () => {
    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, streaming: false }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: AgentResponse = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResponse(data);
        setPerformanceStats({
          cached: data.cached || false,
          executionTime: data.executionTime
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingQuery = async () => {
    try {
      setIsStreaming(true);
      setStreamingMessage('Starting analysis...');

      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, streaming: true }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let finalResponse: AgentResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: StreamingAgentResponse = JSON.parse(line);
            
            switch (data.type) {
              case 'start':
                setStreamingMessage('Starting analysis...');
                break;
              case 'function_call':
                setStreamingMessage('Determining best analysis approach...');
                break;
              case 'data_processing':
                setStreamingMessage('Processing your financial data...');
                break;
              case 'summary':
                setStreamingMessage('Generating insights...');
                break;
              case 'complete':
                finalResponse = {
                  message: data.message || 'Analysis complete',
                  data: data.data,
                  insights: data.insights,
                  error: data.error,
                  cached: data.cached,
                  executionTime: data.executionTime
                };
                setResponse(finalResponse);
                setPerformanceStats({
                  cached: data.cached || false,
                  executionTime: data.executionTime
                });
                break;
              case 'error':
                setError(data.error || 'An error occurred during processing');
                break;
            }
          } catch (parseError) {
            console.error('Error parsing streaming chunk:', parseError);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const clearCache = async () => {
    try {
      const res = await fetch('/api/agent/query?action=clear-cache', {
        method: 'GET',
      });
      
      if (res.ok) {
        // Optionally show a success message
        console.log('Cache cleared successfully');
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI Financial Assistant
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                className="text-xs"
              >
                {streamingEnabled ? 'Streaming ON' : 'Streaming OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                className="text-xs"
              >
                Clear Cache
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your spending patterns, e.g., 'How much did I spend on food last month?'"
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Performance Stats */}
          {performanceStats && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              {performanceStats.cached && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Cached
                </Badge>
              )}
              {performanceStats.executionTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {performanceStats.executionTime}ms
                </div>
              )}
            </div>
          )}

          {/* Streaming Status */}
          {isStreaming && streamingMessage && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-blue-700 dark:text-blue-300">{streamingMessage}</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Response Display */}
          {response && !isStreaming && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-2">Analysis Results</h3>
                <p className="text-gray-700 dark:text-gray-300">{response.message}</p>
              </div>

              {/* Insights */}
              {response.insights && response.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Key Insights</h4>
                  <div className="flex flex-wrap gap-2">
                    {response.insights.map((insight, index) => (
                      <Badge key={index} variant="outline">
                        {insight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Display */}
              {response.data && (
                <div className="space-y-2">
                  <h4 className="font-medium">Data</h4>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 