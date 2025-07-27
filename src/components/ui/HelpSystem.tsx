// ============================================================================
// HELP SYSTEM COMPONENT
// ============================================================================
// Comprehensive help system with contextual help, FAQs, and quick tips
// See: Master System Guide - React Component Standards, TypeScript Standards

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  BookOpen,
  Lightbulb,
  Star,
  ArrowRight,
  X,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface HelpItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  examples?: string[];
  related?: string[];
}

interface HelpSystemProps {
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

// ============================================================================
// HELP DATA
// ============================================================================

const HELP_ITEMS: HelpItem[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with AI Assistant',
    content: 'Learn how to use the AI Financial Assistant to get insights about your spending patterns and financial health.',
    category: 'basics',
    tags: ['start', 'first-time', 'tutorial'],
    examples: [
      'How much did I spend last month?',
      'What are my top spending categories?',
      'Show me my restaurant spending'
    ],
    related: ['natural-language', 'chat-interface']
  },
  {
    id: 'natural-language',
    title: 'Natural Language Queries',
    content: 'Ask questions in plain English and get instant financial insights. The AI understands context and can handle complex queries.',
    category: 'features',
    tags: ['chat', 'queries', 'language'],
    examples: [
      'How much did I spend on food this month?',
      'What were my expenses in January?',
      'Compare my spending this month vs last month',
      'Are there any unusual expenses this month?'
    ],
    related: ['getting-started', 'examples']
  },
  {
    id: 'spending-analysis',
    title: 'Spending Analysis Features',
    content: 'Analyze your spending by category, time period, vendor, and more. Get detailed breakdowns and insights.',
    category: 'features',
    tags: ['analysis', 'spending', 'categories'],
    examples: [
      'Show me my transportation spending',
      'What are my top merchants?',
      'How has my food spending changed?',
      'Flag any transactions over $100'
    ],
    related: ['trends', 'anomalies']
  },
  {
    id: 'trends',
    title: 'Trend Analysis',
    content: 'Track your spending trends over time and see how your financial habits are evolving.',
    category: 'features',
    tags: ['trends', 'patterns', 'history'],
    examples: [
      'How has my spending changed over time?',
      'What are my spending trends for the last 6 months?',
      'Which categories are growing the fastest?',
      'Is my spending increasing or decreasing?'
    ],
    related: ['spending-analysis', 'anomalies']
  },
  {
    id: 'anomalies',
    title: 'Anomaly Detection',
    content: 'The AI automatically detects unusual spending patterns and flags potential anomalies for your attention.',
    category: 'features',
    tags: ['anomalies', 'unusual', 'detection'],
    examples: [
      'Detect any spending anomalies',
      'Are there any unusual expenses this month?',
      'Flag any transactions that seem out of the ordinary',
      'Show me my highest transactions'
    ],
    related: ['spending-analysis', 'trends']
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    content: 'Your financial data is protected with enterprise-grade security. All data is encrypted and you have full control.',
    category: 'security',
    tags: ['security', 'privacy', 'encryption'],
    examples: [],
    related: ['data-control']
  },
  {
    id: 'data-control',
    title: 'Data Control & Export',
    content: 'You have full control over your data. Export your information anytime and delete your account if needed.',
    category: 'security',
    tags: ['export', 'control', 'delete'],
    examples: [
      'How do I export my data?',
      'Can I delete my account?',
      'How do I control my privacy settings?'
    ],
    related: ['security']
  },
  {
    id: 'examples',
    title: 'Example Queries',
    content: 'Here are some example queries to help you get started with the AI Financial Assistant.',
    category: 'examples',
    tags: ['examples', 'queries', 'start'],
    examples: [
      'How much did I spend last month?',
      'What are my top spending categories?',
      'Show me my restaurant spending',
      'How much did I spend on food this month?',
      'What were my expenses in January?',
      'Compare my spending this month vs last month',
      'How much did I spend at Starbucks?',
      'What are my top merchants?',
      'Show me my Amazon purchases',
      'How has my spending changed over time?',
      'What are my spending trends for the last 6 months?',
      'Is my spending increasing or decreasing?',
      'How has my food spending changed?',
      'What categories are growing the fastest?',
      'Which categories have I reduced spending in?',
      'Are there any unusual expenses this month?',
      'Detect any spending anomalies',
      'Flag any transactions that seem out of the ordinary',
      'Show me my highest transactions',
      'What are my biggest expenses this month?',
      'Flag any transactions over $100'
    ],
    related: ['getting-started', 'natural-language']
  }
];

const CATEGORIES = [
  { id: 'basics', name: 'Getting Started', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'features', name: 'Features', icon: <Zap className="h-4 w-4" /> },
  { id: 'examples', name: 'Examples', icon: <Lightbulb className="h-4 w-4" /> },
  { id: 'security', name: 'Security', icon: <Shield className="h-4 w-4" /> },
];

// ============================================================================
// HELP SYSTEM COMPONENT
// ============================================================================

export function HelpSystem({ isVisible, onClose, className }: HelpSystemProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('basics');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  const filteredItems = HELP_ITEMS.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // ============================================================================
  // ITEM EXPANSION
  // ============================================================================

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // ============================================================================
  // COPY TO CLIPBOARD
  // ============================================================================

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}>
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle className="text-xl">Help & Support</CardTitle>
                <CardDescription>
                  Get help with the AI Financial Assistant
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 border-r bg-slate-50 dark:bg-slate-800">
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-1">
                    {CATEGORIES.map(category => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center space-x-2 justify-start"
                      >
                        {category.icon}
                        <span>{category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No help articles found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Try adjusting your search or browse by category
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map(item => (
                      <Card key={item.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg cursor-pointer" onClick={() => toggleItem(item.id)}>
                                {item.title}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-2">
                                {item.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleItem(item.id)}
                              className="ml-2"
                            >
                              {expandedItems.has(item.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        
                        {expandedItems.has(item.id) && (
                          <CardContent className="pt-0">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                              {item.content}
                            </p>
                            
                            {item.examples && item.examples.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                  Example Queries:
                                </h4>
                                <div className="space-y-2">
                                  {item.examples.map((example, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                                    >
                                      <span className="text-sm text-slate-700 dark:text-slate-300">
                                        "{example}"
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(example)}
                                        className="ml-2"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {item.related && item.related.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                  Related Topics:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {item.related.map(relatedId => {
                                    const relatedItem = HELP_ITEMS.find(h => h.id === relatedId);
                                    return relatedItem ? (
                                      <Button
                                        key={relatedId}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedCategory(relatedItem.category);
                                          setExpandedItems(new Set([relatedId]));
                                        }}
                                        className="text-xs"
                                      >
                                        {relatedItem.title}
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                      </Button>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HELP TRIGGER COMPONENT
// ============================================================================

interface HelpTriggerProps {
  onOpen: () => void;
  className?: string;
}

export function HelpTrigger({ onOpen, className }: HelpTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpen}
      className={`text-muted-foreground hover:text-foreground ${className}`}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
} 