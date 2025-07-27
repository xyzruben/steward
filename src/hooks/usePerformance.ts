import { useRef, useEffect } from 'react'
import { trackPerformance } from '@/lib/services/performance'

interface UsePerformanceOptions {
  label: string
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Hook for tracking performance of operations
 * See: Master System Guide - React State Patterns, Performance
 */
export function usePerformance(options: UsePerformanceOptions) {
  const startTimeRef = useRef<number | null>(null)
  const { label, userId, metadata } = options

  const startTimer = () => {
    startTimeRef.current = performance.now()
  }

  const endTimer = (success: boolean = true, error?: string) => {
    if (startTimeRef.current === null) {
      console.warn('usePerformance: Timer not started')
      return
    }

    const duration = performance.now() - startTimeRef.current
    startTimeRef.current = null

    // Track performance using the new monitoring system
    trackPerformance(
      label,
      duration,
      success,
      userId,
      metadata,
      error
    )
  }

  const trackOperation = (operation: () => any, operationLabel?: string) => {
    const operationStart = performance.now()
    
    try {
      const result = operation()
      const operationDuration = performance.now() - operationStart
      
      trackPerformance(
        operationLabel || label,
        operationDuration,
        true,
        userId,
        metadata
      )
      
      return result
    } catch (error) {
      const operationDuration = performance.now() - operationStart
      
      trackPerformance(
        operationLabel || label,
        operationDuration,
        false,
        userId,
        metadata,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  }

  const trackAsyncOperation = async (operation: () => Promise<any>, operationLabel?: string) => {
    const operationStart = performance.now()
    
    try {
      const result = await operation()
      const operationDuration = performance.now() - operationStart
      
      trackPerformance(
        operationLabel || label,
        operationDuration,
        true,
        userId,
        metadata
      )
      
      return result
    } catch (error) {
      const operationDuration = performance.now() - operationStart
      
      trackPerformance(
        operationLabel || label,
        operationDuration,
        false,
        userId,
        metadata,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (startTimeRef.current !== null) {
        console.warn(`usePerformance: Timer for "${label}" was not ended before component unmounted`)
      }
    }
  }, [label])

  return {
    startTimer,
    endTimer,
    trackOperation,
    trackAsyncOperation,
  }
} 