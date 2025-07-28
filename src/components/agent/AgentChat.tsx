'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Send, 
  Zap, 
  Clock, 
  Database, 
  MessageSquare, 
  BarChart3, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  Eye,
  EyeOff,
  LogIn,
  User
} from 'lucide-react';

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

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  insights?: string[];
  error?: string;
  cached?: boolean;
  executionTime?: number;
  functions?: string[];
}

interface AgentChatProps {
  className?: string;
}

export default function AgentChat({ className = '' }: AgentChatProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [performanceStats, setPerformanceStats] = useState<{
    cached: boolean;
    executionTime?: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Auto-scroll to bottom when new messages are added (but not on initial mount)
  useEffect(() => {
    // Skip auto-scroll on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only auto-scroll if there are messages
    if (messagesEndRef.current && chatHistory.length > 0 && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Add message to chat history with unique ID and timestamp
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    // Check authentication before proceeding
    if (!isAuthenticated || !user) {
      setError('Please log in to use the AI assistant');
      return;
    }

    const userMessage = query.trim();
    setQuery('');
    setIsLoading(true);
    setError(null);
    setPerformanceStats(null);

    // Add user message to chat history
    addMessage({
      type: 'user',
      content: userMessage,
    });

    if (streamingEnabled) {
      await handleStreamingQuery(userMessage);
    } else {
      await handleRegularQuery(userMessage);
    }
  };

  const handleRegularQuery = async (userMessage: string) => {
    try {
      // Ensure user is authenticated before making API call
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage, streaming: false }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: AgentResponse = await res.json();
      
      if (data.error) {
        addMessage({
          type: 'system',
          content: `Error: ${data.error}`,
          error: data.error,
        });
        setError(data.error);
      } else {
        addMessage({
          type: 'assistant',
          content: data.message,
          data: data.data,
          insights: data.insights,
          cached: data.cached,
          executionTime: data.executionTime,
        });
        setPerformanceStats({
          cached: data.cached || false,
          executionTime: data.executionTime
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      addMessage({
        type: 'system',
        content: `Error: ${errorMessage}`,
        error: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingQuery = async (userMessage: string) => {
    try {
      // Ensure user is authenticated before making API call
      if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
      }

      setIsStreaming(true);
      setStreamingMessage('Starting analysis...');

      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage, streaming: true }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let finalResponse: AgentResponse | null = null;
      const functions: string[] = [];

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
                setStreamingMessage('Analyzing your request...');
                break;
              case 'function_call':
                setStreamingMessage(`Calling function: ${data.message || 'Processing data...'}`);
                if (data.message) functions.push(data.message);
                break;
              case 'data_processing':
                setStreamingMessage('Processing financial data...');
                break;
              case 'summary':
                setStreamingMessage('Generating insights...');
                break;
              case 'complete':
                finalResponse = data as AgentResponse;
                setStreamingMessage('');
                break;
              case 'error':
                throw new Error(data.error || 'Streaming error occurred');
            }
          } catch (parseError) {
            console.error('Error parsing streaming response:', parseError);
          }
        }
      }

      if (finalResponse) {
        if (finalResponse.error) {
          addMessage({
            type: 'system',
            content: `Error: ${finalResponse.error}`,
            error: finalResponse.error,
          });
          setError(finalResponse.error);
        } else {
          addMessage({
            type: 'assistant',
            content: finalResponse.message,
            data: finalResponse.data,
            insights: finalResponse.insights,
            cached: finalResponse.cached,
            executionTime: finalResponse.executionTime,
            functions,
          });
          setPerformanceStats({
            cached: finalResponse.cached || false,
            executionTime: finalResponse.executionTime
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      addMessage({
        type: 'system',
        content: `Error: ${errorMessage}`,
        error: errorMessage,
      });
      setError(errorMessage);
    } finally {
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
        addMessage({
          type: 'system',
          content: 'Cache cleared successfully',
        });
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setError(null);
    setPerformanceStats(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const exportChatHistory = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      messages: chatHistory,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steward-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    const isAssistant = message.type === 'assistant';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-4 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isSystem
              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {/* Message Header */}
          <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
            {isUser ? (
              <>
                <span>You</span>
                <span>•</span>
                <span>{formatTimestamp(message.timestamp)}</span>
              </>
            ) : isSystem ? (
              <>
                <AlertTriangle className="h-3 w-3" />
                <span>System</span>
                <span>•</span>
                <span>{formatTimestamp(message.timestamp)}</span>
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                <span>AI Assistant</span>
                <span>•</span>
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.cached && (
                  <>
                    <span>•</span>
                    <Database className="h-3 w-3" />
                    <span>Cached</span>
                  </>
                )}
                {message.executionTime && (
                  <>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{message.executionTime}ms</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Message Content */}
          <div className="text-sm leading-relaxed">
            {message.content}
          </div>

          {/* Insights */}
          {message.insights && message.insights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
                Key Insights
              </div>
              <div className="flex flex-wrap gap-1">
                {message.insights.map((insight, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {insight}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Functions Used */}
          {message.functions && message.functions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                Functions Used
              </div>
              <div className="flex flex-wrap gap-1">
                {message.functions.map((func, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons for Assistant Messages */}
          {isAssistant && message.data && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataPanel(!showDataPanel)}
                  className="text-xs"
                >
                  {showDataPanel ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showDataPanel ? 'Hide' : 'Show'} Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(message.data, null, 2))}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3" />
                  Copy Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication required UI for unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              AI Financial Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please log in to access the AI Financial Assistant and get personalized insights about your spending patterns.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
                <p className="text-xs text-gray-500">
                  The AI assistant can help you analyze spending trends, detect patterns, and provide financial insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              AI Financial Assistant
              {user && (
                <Badge variant="outline" className="text-xs">
                  {user.email}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
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
                <RefreshCw className="h-3 w-3" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3" />
                Clear Chat
              </Button>
              {chatHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChatHistory}
                  className="text-xs"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Data Panel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && !isLoading && (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Welcome to Steward AI</h3>
                      <p className="text-sm">
                        Ask me anything about your spending patterns, trends, and financial insights.
                      </p>
                      <div className="mt-4 space-y-2 text-xs">
                        <p className="text-gray-400">Try asking:</p>
                        <ul className="space-y-1 text-gray-500">
                          <li>• &ldquo;How much did I spend on food last month?&rdquo;</li>
                          <li>• &ldquo;Show me my top spending categories&rdquo;</li>
                          <li>• &ldquo;Detect any unusual spending patterns&rdquo;</li>
                          <li>• &ldquo;Compare my spending this month vs last month&rdquo;</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {chatHistory.map(renderMessage)}
                
                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isStreaming ? streamingMessage : 'Analyzing your request...'}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about your spending patterns, e.g., 'How much did I spend on food last month?'"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    aria-label="Send"
                    data-testid="send-button"
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="data" className="flex-1 mt-0">
              <div className="p-4 h-full overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Data Analysis</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDataPanel(!showDataPanel)}
                    >
                      {showDataPanel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showDataPanel ? 'Hide' : 'Show'} Raw Data
                    </Button>
                  </div>

                  {/* Performance Stats */}
                  {performanceStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Performance Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span>Cache Status:</span>
                            <Badge variant={performanceStats.cached ? "default" : "secondary"}>
                              {performanceStats.cached ? "Cached" : "Fresh"}
                            </Badge>
                          </div>
                          {performanceStats.executionTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Execution Time:</span>
                              <Badge variant="outline">
                                {performanceStats.executionTime}ms
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Chat Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Chat Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-500">
                            {chatHistory.filter(m => m.type === 'user').length}
                          </div>
                          <div className="text-gray-500">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {chatHistory.filter(m => m.type === 'assistant').length}
                          </div>
                          <div className="text-gray-500">Responses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-500">
                            {chatHistory.filter(m => m.insights && m.insights.length > 0).length}
                          </div>
                          <div className="text-gray-500">With Insights</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Raw Data Panel */}
                  {showDataPanel && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Raw Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {chatHistory
                            .filter(m => m.data)
                            .map((message, index) => (
                              <div key={index} className="space-y-2">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Response {index + 1} - {formatTimestamp(message.timestamp)}
                                </div>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-64">
                                  {JSON.stringify(message.data, null, 2)}
                                </pre>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 