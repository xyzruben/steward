// ============================================================================
// PERFORMANCE MONITORING PAGE
// ============================================================================
// Performance monitoring and analytics page for system administrators
// See: Master System Guide - App Router Structure, Component Hierarchy

import { PerformanceDashboard } from '@/components/monitoring/PerformanceDashboard';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <PerformanceDashboard />
    </div>
  );
} 