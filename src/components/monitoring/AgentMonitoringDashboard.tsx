// ============================================================================
// AGENT MONITORING DASHBOARD COMPONENT
// ============================================================================
// Comprehensive monitoring dashboard for AI financial assistant
// See: Master System Guide - React Component Standards, TypeScript Standards

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  TrendingUp, 
  Users, 
  Zap,
  RefreshCw,
  BarChart3,
  Shield,
  Target
} from 'lucide-react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AgentMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageResponseTime: number;
  }>;
  functionUsage: Record<string, number>;
  errorBreakdown: Record<string, number>;
  userEngagement: {
    activeUsers: number;
    averageQueriesPerUser: number;
    retentionRate: number;
  };
}

interface MonitoringHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: boolean;
  cache: boolean;
  lastError?: string;
}

interface MonitoringData {
  metrics: AgentMetrics;
  health: MonitoringHealth;
  timeRange: {
    start: string;
    end: string;
    duration: string;
  };
  timestamp: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AgentMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/monitoring/agent-metrics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`);
        }
        throw new Error('Failed to fetch monitoring data');
      }

      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Monitoring data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMonitoringData]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getSuccessRate = (metrics: AgentMetrics) => {
    if (metrics.totalQueries === 0) return 0;
    return (metrics.successfulQueries / metrics.totalQueries) * 100;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No monitoring data available</AlertDescription>
      </Alert>
    );
  }

  const { metrics, health, timeRange: range } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for the AI financial assistant
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchMonitoringData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${getHealthStatusColor(health.status)}`}>
              {getHealthStatusIcon(health.status)}
              <span className="font-medium capitalize">{health.status}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>Database: {health.database ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Cache: {health.cache ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
          {health.lastError && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{health.lastError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {range.duration} time period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSuccessRate(metrics).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulQueries} successful / {metrics.failedQueries} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Cache hit rate: {metrics.cacheHitRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.userEngagement.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.userEngagement.averageQueriesPerUser.toFixed(1)} queries per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Function Usage</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Response time and cache performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Cache Hit Rate</span>
                  <span>{metrics.cacheHitRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.cacheHitRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Success Rate</span>
                  <span>{getSuccessRate(metrics).toFixed(1)}%</span>
                </div>
                <Progress value={getSuccessRate(metrics)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Function Usage</CardTitle>
              <CardDescription>Most commonly used financial functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(metrics.functionUsage)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([functionName, count]) => (
                    <div key={functionName} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{functionName}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Breakdown</CardTitle>
              <CardDescription>Most common error types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(metrics.errorBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([error, count]) => (
                    <div key={error} className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate max-w-xs">{error}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Queries</CardTitle>
              <CardDescription>Most frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topQueries.slice(0, 10).map((query, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium line-clamp-2">{query.query}</span>
                      <Badge variant="outline">{query.count}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg response time: {query.averageResponseTime.toFixed(0)}ms
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {lastRefresh && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
} 