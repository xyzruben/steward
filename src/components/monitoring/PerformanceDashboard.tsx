// ============================================================================
// PERFORMANCE MONITORING DASHBOARD COMPONENT
// ============================================================================
// Advanced performance monitoring dashboard with real-time metrics and load testing
// See: Master System Guide - React Component Standards, TypeScript Standards

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Target,
  Play,
  StopCircle,
  Gauge,
  Cpu,
  HardDrive,
  Network,
  Loader2
} from 'lucide-react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PerformanceDashboard {
  realTime: {
    currentResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeUsers: number;
    cacheHitRate: number;
  };
  historical: {
    responseTimeTrend: Array<{ timestamp: Date; value: number }>;
    throughputTrend: Array<{ timestamp: Date; value: number }>;
    errorRateTrend: Array<{ timestamp: Date; value: number }>;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
    timestamp: Date;
    resolved: boolean;
    context: Record<string, any>;
  }>;
  topSlowOperations: Array<{
    operation: string;
    averageDuration: number;
    count: number;
  }>;
  resourceUsage: {
    memoryUsage: number;
    cpuUsage: number;
    databaseConnections: number;
    cacheSize: number;
  };
}

interface LoadTestResult {
  id: string;
  testName: string;
  startTime: Date;
  endTime: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  concurrency: number;
  results: Array<{
    requestId: string;
    duration: number;
    success: boolean;
    error?: string;
    timestamp: Date;
  }>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Load testing state
  const [loadTestRunning, setLoadTestRunning] = useState(false);
  const [loadTestConfig, setLoadTestConfig] = useState({
    testName: 'AI Agent Load Test',
    requests: 100,
    concurrency: 10,
  });
  const [loadTestResults, setLoadTestResults] = useState<LoadTestResult | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/monitoring/performance?timeRange=${timeRange}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`);
        }
        throw new Error('Failed to fetch performance data');
      }

      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Performance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPerformanceData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPerformanceData]);

  // ============================================================================
  // LOAD TESTING
  // ============================================================================

  const runLoadTest = async () => {
    try {
      setLoadTestRunning(true);
      setLoadTestResults(null);

      const response = await fetch('/api/monitoring/load-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loadTestConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to run load test');
      }

      const result = await response.json();
      setLoadTestResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load test failed');
      console.error('Load test error:', err);
    } finally {
      setLoadTestRunning(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatThroughput = (rps: number) => {
    return `${rps.toFixed(1)} req/s`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
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
        <AlertDescription>No performance data available</AlertDescription>
      </Alert>
    );
  }

  const { realTime, historical, alerts, topSlowOperations, resourceUsage } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time performance metrics and system health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPerformanceData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(realTime.currentResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatThroughput(realTime.requestsPerSecond)}</div>
            <p className="text-xs text-muted-foreground">
              Requests per second
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTime.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Failed requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTime.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Concurrent users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTime.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Cache effectiveness
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceUsage.memoryUsage.toFixed(1)}%</div>
            <Progress value={resourceUsage.memoryUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceUsage.cpuUsage.toFixed(1)}%</div>
            <Progress value={resourceUsage.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceUsage.databaseConnections}</div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceUsage.cacheSize}</div>
            <p className="text-xs text-muted-foreground">
              Cached items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="slow-operations">Slow Operations</TabsTrigger>
          <TabsTrigger value="load-testing">Load Testing</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>Active performance alerts and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(alert.severity)}
                          <span className="font-medium">{alert.message}</span>
                        </div>
                        <Badge variant="outline">{alert.severity}</Badge>
                      </div>
                      <p className="text-sm mt-2">
                        Current: {alert.currentValue.toFixed(2)} | Threshold: {alert.threshold.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow-operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Slow Operations</CardTitle>
              <CardDescription>Operations with the highest average response times</CardDescription>
            </CardHeader>
            <CardContent>
              {topSlowOperations.length === 0 ? (
                <div className="text-center py-8">
                  <Gauge className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No slow operations detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topSlowOperations.map((operation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{operation.operation}</p>
                        <p className="text-sm text-muted-foreground">
                          {operation.count} requests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatDuration(operation.averageDuration)}</p>
                        <p className="text-sm text-muted-foreground">Average</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="load-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Testing</CardTitle>
              <CardDescription>Test system performance under load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Load Test Configuration */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    value={loadTestConfig.testName}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, testName: e.target.value }))}
                    placeholder="Load Test Name"
                  />
                </div>
                <div>
                  <Label htmlFor="requests">Total Requests</Label>
                  <Input
                    id="requests"
                    type="number"
                    value={loadTestConfig.requests}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, requests: parseInt(e.target.value) }))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="concurrency">Concurrency</Label>
                  <Input
                    id="concurrency"
                    type="number"
                    value={loadTestConfig.concurrency}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, concurrency: parseInt(e.target.value) }))}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Load Test Controls */}
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={runLoadTest} 
                  disabled={loadTestRunning}
                  className="flex items-center"
                >
                  {loadTestRunning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {loadTestRunning ? 'Running Test...' : 'Start Load Test'}
                </Button>
                {loadTestRunning && (
                  <Button variant="outline" size="sm">
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Test
                  </Button>
                )}
              </div>

              {/* Load Test Results */}
              {loadTestResults && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Load Test Results</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{loadTestResults.totalRequests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {((loadTestResults.successfulRequests / loadTestResults.totalRequests) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      <p className="text-2xl font-bold">{formatDuration(loadTestResults.averageResponseTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Throughput</p>
                      <p className="text-2xl font-bold">{formatThroughput(loadTestResults.throughput)}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">P95 Response Time</p>
                      <p className="text-lg font-semibold">{formatDuration(loadTestResults.p95ResponseTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">P99 Response Time</p>
                      <p className="text-lg font-semibold">{formatDuration(loadTestResults.p99ResponseTime)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Historical performance data and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Performance trend charts coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Historical data visualization and trend analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 