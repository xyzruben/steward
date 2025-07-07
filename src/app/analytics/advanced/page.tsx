// Advanced Analytics page
// See: Master System Guide - App Router Structure, Page Organization

import { AdvancedAnalyticsDashboard } from '../../../components/analytics/AdvancedAnalyticsDashboard';
import { SharedNavigation } from '../../../components/ui/SharedNavigation';

export default function AdvancedAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SharedNavigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <AdvancedAnalyticsDashboard />
      </div>
    </div>
  );
} 