// ============================================================================
// ERROR BOUNDARY COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Error Handling)
// ============================================================================
// Premium error boundary with beautiful error states and recovery options
// Follows master guide: Error Handling, Component Hierarchy, Accessibility

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

// ============================================================================
// ERROR BOUNDARY COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
        onGoBack={this.handleGoBack}
        className={this.props.className}
      />
    }

    return this.props.children
  }
}

// ============================================================================
// ERROR FALLBACK COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface ErrorFallbackProps {
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
  onRetry: () => void
  onGoHome: () => void
  onGoBack: () => void
  className?: string
}

export function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId,
  onRetry, 
  onGoHome, 
  onGoBack,
  className = ''
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', className)}>
      <div className="w-full max-w-md">
        <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Oops! Something went wrong
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Details (Development Only) */}
            {isDevelopment && error && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Bug className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Error Details (Development)
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong>Message:</strong> {error.message}</p>
                  {errorId && <p><strong>Error ID:</strong> {errorId}</p>}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-600 p-2 rounded overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3">
              <Button 
                onClick={onRetry} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={onGoBack} 
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button 
                  onClick={onGoHome} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>

            {/* Help Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <Shield className="w-4 h-4" />
                <span>Your data is secure and unaffected</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                <Zap className="w-4 h-4" />
                <span>This error has been automatically reported</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR PAGE COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface ErrorPageProps {
  code?: string
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
}

export function ErrorPage({ 
  code = '404',
  title = 'Page Not Found',
  message = 'The page you\'re looking for doesn\'t exist or has been moved.',
  action,
  secondaryAction,
  className = ''
}: ErrorPageProps) {
  const getErrorIcon = () => {
    switch (code) {
      case '404':
        return <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      case '500':
        return <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      case '403':
        return <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      default:
        return <AlertTriangle className="w-8 h-8 text-slate-600 dark:text-slate-400" />
    }
  }

  const getErrorColor = () => {
    switch (code) {
      case '404':
        return 'bg-orange-100 dark:bg-orange-900/20'
      case '500':
        return 'bg-red-100 dark:bg-red-900/20'
      case '403':
        return 'bg-yellow-100 dark:bg-yellow-900/20'
      default:
        return 'bg-slate-100 dark:bg-slate-700'
    }
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', className)}>
      <div className="w-full max-w-md text-center">
        <Card className="bg-white dark:bg-slate-800 shadow-xl">
          <CardContent className="p-8 space-y-6">
            {/* Error Code */}
            <div className="text-6xl font-bold text-slate-300 dark:text-slate-600">
              {code}
            </div>
            
            {/* Error Icon */}
            <div className={cn('w-16 h-16 mx-auto rounded-full flex items-center justify-center', getErrorColor())}>
              {getErrorIcon()}
            </div>
            
            {/* Error Title */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {message}
              </p>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              {action && (
                <Button 
                  onClick={action.onClick} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              )}
              
              {secondaryAction && (
                <Button 
                  onClick={secondaryAction.onClick} 
                  variant="outline" 
                  className="w-full"
                >
                  {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 