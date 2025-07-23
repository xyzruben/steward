import { useRef, useEffect } from 'react'
import { startTimer, endTimer, logPerformance, reportPerformance } from '@/lib/services/performance'

interface UsePerformanceOptions {
  label: string
  auto?: boolean // If true, start on mount and end/log on unmount
  report?: boolean // If true, call reportPerformance
  extra?: Record<string, any>
}

export function usePerformance({ label, auto = false, report = false, extra }: UsePerformanceOptions) {
  const started = useRef(false)

  const start = () => {
    if (!started.current) {
      startTimer(label)
      started.current = true
    }
  }

  const end = () => {
    if (started.current) {
      const duration = endTimer(label)
      if (duration !== null) {
        logPerformance(label, duration, extra)
        if (report) reportPerformance(label, duration, extra)
      }
      started.current = false
    }
  }

  useEffect(() => {
    if (auto) {
      start()
      return () => end()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  return { start, end }
} 