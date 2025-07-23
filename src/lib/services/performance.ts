// ============================================================================
// PERFORMANCE TRACKING UTILITY (see STEWARD_MASTER_SYSTEM_GUIDE.md - Performance)
// ============================================================================
// Provides simple performance measurement and logging for key app flows

const timers: Record<string, number> = {}

export function startTimer(label: string) {
  timers[label] = performance.now()
}

export function endTimer(label: string): number | null {
  if (!(label in timers)) return null
  const duration = performance.now() - timers[label]
  delete timers[label]
  return duration
}

export function logPerformance(label: string, duration: number, extra?: Record<string, any>) {
  // For now, just log to the console. In the future, send to analytics backend.
  // eslint-disable-next-line no-console
  console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`, extra || '')
}

// Optionally, add a function to report metrics to a backend or analytics service
export async function reportPerformance(label: string, duration: number, extra?: Record<string, any>) {
  // Example: send to a custom endpoint or analytics provider
  // await fetch('/api/performance', { method: 'POST', body: JSON.stringify({ label, duration, ...extra }) })
} 