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
  LogIn
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
  type: 'start' | 'content' | 'function_calls' | 'function_result' | 'complete' | 'error';
  message?: string;
  content?: string;
  data?: any;
  insights?: string[];
  error?: string;
  cached?: boolean;
  executionTime?: number;
  functionCalls?: any[];
  result?: any;
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
  onViewReceipts?: (filters?: any) => void;
}

export default function AgentChat({ className = '', onViewReceipts }: AgentChatProps) {
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
    if (!query.trim() || isLoading || isStreaming) return;

    // Check authentication before proceeding
    if (!isAuthenticated || !user) {
      setError('Please log in to use the AI assistant');
      return;
    }

    const userMessage = query.trim();
    setQuery('');
    setIsLoading(true);
    setIsStreaming(false); // Ensure streaming is reset
    setError(null);

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
      setIsStreaming(false); // Ensure streaming is also reset for non-streaming queries
    }
  };

  const handleStreamingQuery = async (userMessage: string) => {
    if (!isAuthenticated || !user) {
      setError('Please log in to use the AI assistant.');
      return;
    }

    const requestId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] 🚀 Client: Starting streaming query`, { userMessage: userMessage.substring(0, 50) + '...' });

    setIsStreaming(true);
    setError(null);
    // REMOVED: Duplicate addMessage call - user message already added in handleSubmit

    try {
      console.log(`[${requestId}] 📡 Client: Making API request to /api/agent/query`);
      const response = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: userMessage, 
          streaming: true 
        }),
      });

      console.log(`[${requestId}] 📡 Client: API response received`, { 
        status: response.status, 
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 408) {
          throw new Error('Request timeout. Please try a more specific query or shorter time period.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to start streaming response');
      }

      console.log(`[${requestId}] 📡 Client: Starting to read streaming response`);

      const decoder = new TextDecoder();
      let finalResponse: AgentResponse | null = null;
      const functions: string[] = [];
      let assistantMessage = '';

      // Add timeout for the entire streaming process
      const streamTimeout = setTimeout(() => {
        console.error(`[${requestId}] ⏰ Client: Streaming timeout after 30 seconds`);
        reader.cancel();
        throw new Error('Streaming timeout. Please try again.');
      }, 30000); // 30 second timeout

      try {
        let chunkCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`[${requestId}] ✅ Client: Stream reading complete after ${chunkCount} chunks`);
            break;
          }
          
          chunkCount++;
          const chunk = decoder.decode(value);
          // Only log every 5th chunk to reduce console spam
          if (chunkCount % 5 === 0) {
            console.log(`[${requestId}] 📦 Client: Received chunk ${chunkCount}`, { 
              chunkLength: chunk.length,
              chunkPreview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : '')
            });
          }
          
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              console.log(`[${requestId}] 📝 Client: Parsing line`, { line: line.substring(0, 100) + (line.length > 100 ? '...' : '') });
              const data: StreamingAgentResponse = JSON.parse(line);
              
              console.log(`[${requestId}] 📝 Client: Parsed streaming data`, { type: data.type, message: data.message?.substring(0, 50) });
              
              switch (data.type) {
                case 'start':
                  setStreamingMessage('Analyzing your request...');
                  break;
                case 'content':
                  if (data.content) {
                    assistantMessage += data.content;
                    setStreamingMessage(assistantMessage);
                  }
                  break;
                case 'function_calls':
                  setStreamingMessage('Processing financial data...');
                  if (data.functionCalls) {
                    data.functionCalls.forEach((call: any) => {
                      if (call.function?.name) {
                        functions.push(call.function.name);
                      }
                    });
                  }
                  break;
                case 'function_result':
                  setStreamingMessage('Analyzing results...');
                  break;
                case 'complete':
                  finalResponse = {
                    message: assistantMessage || data.message || 'Analysis complete.',
                    data: data.data,
                    insights: data.insights,
                    cached: data.cached,
                    executionTime: data.executionTime,
                  };
                  setStreamingMessage('');
                  console.log(`[${requestId}] ✅ Client: Received complete response`, { 
                    messageLength: finalResponse.message?.length,
                    hasData: !!finalResponse.data,
                    hasInsights: !!finalResponse.insights
                  });
                  break;
                case 'error':
                  console.error(`[${requestId}] 💥 Client: Received error from server`, data.error);
                  throw new Error(data.error || 'Streaming error occurred');
              }
            } catch (parseError) {
              console.error(`[${requestId}] 💥 Client: Error parsing streaming response`, parseError, { line });
            }
          }
        }
      } finally {
        clearTimeout(streamTimeout);
      }

      if (finalResponse) {
        if (finalResponse.error) {
          console.error(`[${requestId}] 💥 Client: Final response contains error`, finalResponse.error);
          addMessage({
            type: 'system',
            content: `Error: ${finalResponse.error}`,
            error: finalResponse.error,
          });
          setError(finalResponse.error);
        } else {
          console.log(`[${requestId}] ✅ Client: Adding successful response to chat`);
          addMessage({
            type: 'assistant',
            content: finalResponse.message,
            data: finalResponse.data,
            insights: finalResponse.insights,
            cached: finalResponse.cached,
            executionTime: finalResponse.executionTime,
            functions,
          });
        }
      } else {
        console.error(`[${requestId}] 💥 Client: No final response received`);
        throw new Error('No final response received from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error(`[${requestId}] 💥 Client: Query failed`, { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
      
      addMessage({
        type: 'system',
        content: `Error: ${errorMessage}`,
        error: errorMessage,
      });
      setError(errorMessage);
    } finally {
      console.log(`[${requestId}] 🏁 Client: Query completed, cleaning up`);
      setIsStreaming(false);
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/agent/query', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('Cache cleared successfully');
      } else {
        console.error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setError(null);
    // Also reset any stuck states
    setIsLoading(false);
    setIsStreaming(false);
    setStreamingMessage('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportChatHistory = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: chatHistory.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        data: msg.data,
        insights: msg.insights,
      })),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steward-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    const isError = message.error;

    // Check if this is an AI response with spending data
    const hasSpendingData = message.data && (
      message.data.spending || 
      message.data.receipts || 
      message.data.categories ||
      message.content.toLowerCase().includes('spent') ||
      message.content.toLowerCase().includes('spending')
    );

    // Extract potential filters from the message content
    const extractFilters = () => {
      const filters: any = {};
      
      // Extract category from content
      if (message.content.toLowerCase().includes('coffee')) {
        filters.category = 'coffee';
      } else if (message.content.toLowerCase().includes('food')) {
        filters.category = 'food';
      } else if (message.content.toLowerCase().includes('gas')) {
        filters.category = 'gas';
      }
      
      // Extract date range
      if (message.content.toLowerCase().includes('this month')) {
        filters.dateRange = 'this-month';
      } else if (message.content.toLowerCase().includes('last month')) {
        filters.dateRange = 'last-month';
      }
      
      return filters;
    };

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isSystem
              ? 'bg-gray-200 text-gray-800'
              : isError
              ? 'bg-red-100 text-red-800 border border-red-300'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">
              {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
            </span>
            <span className="text-xs opacity-70">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {/* Contextual Action Buttons for AI responses with spending data */}
          {!isUser && !isSystem && !isError && hasSpendingData && onViewReceipts && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewReceipts(extractFilters())}
                  className="text-xs"
                >
                  View All Receipts
                </Button>
                {extractFilters().category && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewReceipts({ category: extractFilters().category })}
                    className="text-xs"
                  >
                    View {extractFilters().category} Receipts
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {message.insights && message.insights.length > 0 && (
            <div className="mt-2">
              <strong className="text-sm">Insights:</strong>
              <ul className="mt-1 text-sm">
                {message.insights.map((insight, index) => (
                  <li key={index} className="ml-4">• {insight}</li>
                ))}
              </ul>
            </div>
          )}
          
          {message.functions && message.functions.length > 0 && (
            <div className="mt-2">
              <strong className="text-sm">Functions Used:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {message.functions.map((func, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {message.cached && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Cached Response
              </Badge>
            </div>
          )}
          
          {message.executionTime && (
            <div className="mt-2 text-xs opacity-70">
              Response time: {message.executionTime}ms
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LogIn className="h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold">Authentication Required</h3>
        <p className="text-gray-600 text-center">
          Please log in to use the AI financial assistant.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Steward AI Assistant
                </CardTitle>
                {user && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Welcome back, {user.email?.split('@')[0]}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={streamingEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                className="flex items-center space-x-1"
              >
                <Zap className="h-4 w-4" />
                <span>Streaming {streamingEnabled ? 'ON' : 'OFF'}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Clear Cache</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                className="flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Chat</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportChatHistory}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="data">Data Panel</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                    <p className="text-center">
                      Ask about your spending patterns, financial insights, or any questions about your receipts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map(renderMessage)}
                    {isStreaming && streamingMessage && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{streamingMessage}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isLoading || isStreaming ? "🤔 AI is thinking..." : "💬 Ask me anything about your finances! e.g., 'How much did I spend at Chick-fil-A?'"}
                    disabled={isLoading || isStreaming}
                    className="flex-1 pr-24 py-6 text-lg border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg"
                  />
                  <Button
                    type="submit"
                    disabled={!query.trim() || isLoading || isStreaming}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-200"
                  >
                    {isLoading || isStreaming ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    <span className="ml-2 hidden sm:inline">{isLoading || isStreaming ? "Processing..." : "Send"}</span>
                  </Button>
                </div>
                
                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("How much did I spend this month?")}
                    className="text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                  >
                    💰 Monthly spending
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("What are my top expenses?")}
                    className="text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                  >
                    📊 Top expenses
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("Show me my coffee spending")}
                    className="text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                  >
                    ☕ Coffee spending
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("Find receipts from last week")}
                    className="text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                  >
                    🧾 Recent receipts
                  </Button>
                </div>
              </form>
              {(isLoading || isStreaming) && (
                <div className="text-xs text-gray-500 text-center">
                  {isStreaming ? "AI is responding..." : "Processing your request..."}
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>Total Receipts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-gray-600">No receipts uploaded yet</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Total Spending</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-gray-600">No spending data available</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Last Updated</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">Never</div>
                    <p className="text-xs text-gray-600">No data to display</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 