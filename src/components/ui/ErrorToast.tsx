// ============================================================================
// ERROR TOAST COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Error Handling)
// ============================================================================
// Premium error toast with different error types and recovery actions
// Follows master guide: Error Handling, Component Hierarchy, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  CheckCircle,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

export type ErrorType = 'error' | 'warning' | 'info' | 'success'

interface ErrorToastProps {
  type?: ErrorType
  title: string
  message?: string
  error?: Error
  errorId?: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
    icon?: React.ReactNode
  }>
  onDismiss?: () => void
  onRetry?: () => void
  autoDismiss?: boolean
  dismissDelay?: number
  className?: string
  showErrorDetails?: boolean
}

// ============================================================================
// ERROR TOAST COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function ErrorToast({
  type = 'error',
  title,
  message,
  error,
  errorId,
  actions = [],
  onDismiss,
  onRetry,
  autoDismiss = false,
  dismissDelay = 5000,
  className = '',
  showErrorDetails = false
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  // ============================================================================
  // AUTO DISMISS LOGIC (see master guide: React State Patterns)
  // ============================================================================

  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300) // Wait for fade out animation
      }, dismissDelay)

      return () => clearTimeout(timer)
    }
  }, [autoDismiss, dismissDelay, onDismiss])

  // ============================================================================
  // ERROR TYPE CONFIGURATIONS (see master guide: Component Hierarchy)
  // ============================================================================

  const typeConfigs = {
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-100'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-100'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-100'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-900 dark:text-green-100'
    }
  }

  const config = typeConfigs[type]
  const IconComponent = config.icon

  // ============================================================================
  // UTILITY FUNCTIONS (see master guide: Code Quality and Conventions)
  // ============================================================================

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 300)
  }

  const handleRetry = () => {
    onRetry?.()
  }

  const copyErrorDetails = () => {
    if (error) {
      const errorText = `Error: ${error.message}\nStack: ${error.stack}\nError ID: ${errorId || 'N/A'}`
      navigator.clipboard.writeText(errorText)
    }
  }

  const downloadErrorReport = () => {
    if (error) {
      const errorData = {
        timestamp: new Date().toISOString(),
        errorId,
        errorMessage: error.message,
        stack: error.stack,
        type,
        title,
        message: message
      }
      
      const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `error-report-${errorId || Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  if (!isVisible) {
    return null
  }

  return (
    <div 
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'fixed top-4 right-4 z-50 w-full max-w-md transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}>
      <Card className={cn(
        'border shadow-lg',
        config.bgColor,
        config.borderColor
      )}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={cn('flex-shrink-0 w-5 h-5 mt-0.5', config.iconColor)}>
              <IconComponent className="w-5 h-5" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={cn('text-sm font-medium', config.titleColor)}>
                    {title}
                  </h4>
                  {message && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {message}
                    </p>
                  )}
                </div>
                
                {/* Dismiss Button */}
                {onDismiss && (
                  <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 ml-2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Error Details */}
              {showErrorDetails && error && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {showDetails ? 'Hide' : 'Show'} error details
                  </button>
                  
                  {showDetails && (
                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <p><strong>Message:</strong> {error.message}</p>
                        {errorId && <p><strong>Error ID:</strong> {errorId}</p>}
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 text-xs bg-slate-200 dark:bg-slate-600 p-2 rounded overflow-auto max-h-32">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                      
                      {/* Error Actions */}
                      <div className="flex space-x-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyErrorDetails}
                          className="text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadErrorReport}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {onRetry && (
                  <Button
                    size="sm"
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
                
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={action.onClick}
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// ERROR TOAST MANAGER (see master guide: Component Hierarchy)
// ============================================================================

interface ErrorToastManagerProps {
  children: React.ReactNode
}

interface ToastItem {
  id: string
  props: ErrorToastProps
}

export function ErrorToastManager({ children }: ErrorToastManagerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = (props: ErrorToastProps) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, props }])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showError = (title: string, message?: string, error?: Error) => {
    const id = addToast({
      type: 'error',
      title,
      message,
      error,
      onDismiss: () => removeToast(id),
      autoDismiss: true,
      showErrorDetails: process.env.NODE_ENV === 'development'
    })
    return id
  }

  const showWarning = (title: string, message?: string) => {
    const id = addToast({
      type: 'warning',
      title,
      message,
      onDismiss: () => removeToast(id),
      autoDismiss: true
    })
    return id
  }

  const showInfo = (title: string, message?: string) => {
    const id = addToast({
      type: 'info',
      title,
      message,
      onDismiss: () => removeToast(id),
      autoDismiss: true
    })
    return id
  }

  const showSuccess = (title: string, message?: string) => {
    const id = addToast({
      type: 'success',
      title,
      message,
      onDismiss: () => removeToast(id),
      autoDismiss: true
    })
    return id
  }

  return (
    <div>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ transform: `translateY(${index * 80}px)` }}
          >
            <ErrorToast
              {...toast.props}
              onDismiss={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 