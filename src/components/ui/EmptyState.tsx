// ============================================================================
// EMPTY STATE COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium empty states with beautiful illustrations and helpful actions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Receipt, 
  Upload, 
  Search, 
  BarChart3, 
  Plus, 
  FolderOpen, 
  Calendar,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface EmptyStateProps {
  variant?: 'receipts' | 'analytics' | 'search' | 'upload' | 'general' | 'custom'
  title?: string
  description?: string
  icon?: React.ReactNode
  illustration?: React.ReactNode
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
    icon?: React.ReactNode
    primary?: boolean
  }>
  tips?: string[]
  className?: string
  showTips?: boolean
}

// ============================================================================
// ILLUSTRATION COMPONENTS (see master guide: Component Hierarchy)
// ============================================================================

function ReceiptIllustration() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Background circle */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full" />
      
      {/* Receipt icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center">
          <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
      <div className="absolute bottom-4 left-4 w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  )
}

function AnalyticsIllustration() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Background circle */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full" />
      
      {/* Chart icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      {/* Chart bars */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-end space-x-1">
        {[20, 40, 30, 60, 45].map((height, i) => (
          <div
            key={i}
            className="w-2 bg-green-500 rounded-t animate-pulse"
            style={{ 
              height: `${height}%`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

function SearchIllustration() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Background circle */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full" />
      
      {/* Search icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center">
          <Search className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
      
      {/* Search lines */}
      <div className="absolute top-8 right-8 w-8 h-0.5 bg-orange-300 dark:bg-orange-600 rounded-full transform rotate-45 animate-pulse" />
      <div className="absolute bottom-8 left-8 w-6 h-0.5 bg-orange-300 dark:bg-orange-600 rounded-full transform -rotate-45 animate-pulse" style={{ animationDelay: '0.3s' }} />
    </div>
  )
}

function UploadIllustration() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Background circle */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full" />
      
      {/* Upload icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center">
          <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      
      {/* Upload arrows */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="w-4 h-4 border-2 border-purple-300 dark:border-purple-600 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="w-3 h-3 border-2 border-purple-300 dark:border-purple-600 border-t-transparent dark:border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN EMPTY STATE COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function EmptyState({ 
  variant = 'general',
  title,
  description,
  icon,
  illustration,
  actions = [],
  tips = [],
  className = '',
  showTips = true
}: EmptyStateProps) {
  // ============================================================================
  // VARIANT CONFIGURATIONS (see master guide: Component Hierarchy)
  // ============================================================================

  const variantConfigs = {
    receipts: {
      title: 'No receipts yet',
      description: 'Upload your first receipt to start tracking your expenses with AI-powered insights.',
      illustration: <ReceiptIllustration />,
      defaultActions: [
        {
          label: 'Upload Receipt',
          onClick: () => window.location.href = '/',
          icon: <Upload className="w-4 h-4" />,
          primary: true
        },
        {
          label: 'Learn More',
          onClick: () => window.open('/docs', '_blank'),
          icon: <HelpCircle className="w-4 h-4" />,
          variant: 'outline' as const
        }
      ],
      tips: [
        'Take clear photos of your receipts for better OCR accuracy',
        'Upload receipts regularly to maintain accurate expense tracking',
        'Use categories to organize your spending patterns'
      ]
    },
    analytics: {
      title: 'No analytics data yet',
      description: 'Upload some receipts to see detailed spending insights and trends.',
      illustration: <AnalyticsIllustration />,
      defaultActions: [
        {
          label: 'Upload Receipts',
          onClick: () => window.location.href = '/',
          icon: <Plus className="w-4 h-4" />,
          primary: true
        },
        {
          label: 'View Dashboard',
          onClick: () => window.location.href = '/',
          icon: <BarChart3 className="w-4 h-4" />,
          variant: 'outline' as const
        }
      ],
      tips: [
        'Upload at least 5 receipts to see meaningful trends',
        'Categorize your receipts for better insights',
        'Check back regularly to see your spending patterns'
      ]
    },
    search: {
      title: 'No search results found',
      description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
      illustration: <SearchIllustration />,
      defaultActions: [
        {
          label: 'Clear Filters',
          onClick: () => window.location.reload(),
          icon: <Search className="w-4 h-4" />,
          primary: true
        },
        {
          label: 'Browse All',
          onClick: () => window.location.href = '/receipts',
          icon: <FolderOpen className="w-4 h-4" />,
          variant: 'outline' as const
        }
      ],
      tips: [
        'Try using different keywords or search terms',
        'Check your date range and filter settings',
        'Make sure your receipts are properly categorized'
      ]
    },
    upload: {
      title: 'Ready to upload?',
      description: 'Start by uploading your first receipt to begin tracking your expenses.',
      illustration: <UploadIllustration />,
      defaultActions: [
        {
          label: 'Upload Receipt',
          onClick: () => window.location.href = '/',
          icon: <Upload className="w-4 h-4" />,
          primary: true
        },
        {
          label: 'Learn How',
          onClick: () => window.open('/docs/upload', '_blank'),
          icon: <HelpCircle className="w-4 h-4" />,
          variant: 'outline' as const
        }
      ],
      tips: [
        'Supported formats: JPEG, PNG, WebP, HEIC',
        'Maximum file size: 10MB per receipt',
        'Ensure good lighting for better OCR accuracy'
      ]
    },
    general: {
      title: 'Nothing to see here',
      description: 'This area is empty. Check back later or take an action to get started.',
      illustration: <ReceiptIllustration />,
      defaultActions: [
        {
          label: 'Get Started',
          onClick: () => window.location.href = '/',
          icon: <ArrowRight className="w-4 h-4" />,
          primary: true
        }
      ],
      tips: []
    }
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  const config = variantConfigs[variant] || variantConfigs.general
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalActions = actions.length > 0 ? actions : config.defaultActions
  const finalTips = tips.length > 0 ? tips : config.tips

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-lg border-0">
        <CardContent className="p-8 text-center space-y-6">
          {/* Illustration */}
          {illustration || config.illustration}
          
          {/* Icon (if provided) */}
          {icon && (
            <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              {icon}
            </div>
          )}
          
          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {finalTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {finalDescription}
            </p>
          </div>
          
          {/* Actions */}
          {finalActions.length > 0 && (
            <div className="space-y-3">
              {finalActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || (action.primary ? 'default' : 'outline')}
                  className={cn(
                    'w-full',
                    action.primary && 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
          
          {/* Tips */}
          {showTips && finalTips.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Pro Tips
                </span>
              </div>
              <div className="space-y-2">
                {finalTips.map((tip, index) => (
                  <p key={index} className="text-xs text-slate-500 dark:text-slate-400">
                    • {tip}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SPECIALIZED EMPTY STATE COMPONENTS (see master guide: Component Hierarchy)
// ============================================================================

export function ReceiptsEmptyState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="receipts" {...props} />
}

export function AnalyticsEmptyState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="analytics" {...props} />
}

export function SearchEmptyState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="search" {...props} />
}

export function UploadEmptyState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="upload" {...props} />
} 