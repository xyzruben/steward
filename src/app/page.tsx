import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
