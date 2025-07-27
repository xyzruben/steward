# Performance Monitoring Guide

## Overview

The Steward AI Financial Assistant now includes comprehensive performance monitoring capabilities that provide real-time insights into system performance, user experience, and business metrics. This guide covers the implementation, usage, and best practices for the performance monitoring system.

## 🚀 **Performance Monitoring Features**

### **Real-Time Performance Tracking**
- **Response Time Monitoring**: Track AI query response times in real-time
- **Database Performance**: Monitor query execution times and connection pools
- **External API Performance**: Track OpenAI API calls and response times
- **Cache Effectiveness**: Measure cache hit rates and performance impact
- **Resource Utilization**: CPU, memory, and network usage tracking

### **Advanced Analytics Dashboard**
- **Performance Metrics**: Real-time dashboards for system health
- **User Experience Metrics**: Query success rates and error patterns
- **Business Intelligence**: Usage patterns and feature adoption
- **Alerting System**: Proactive notifications for performance degradation

### **Load Testing & Optimization**
- **Stress Testing**: Validate system performance under high load
- **Concurrent User Testing**: Test multiple simultaneous AI queries
- **Database Optimization**: Query optimization and indexing improvements
- **Caching Strategy**: Advanced caching for frequently accessed data

## 📊 **Architecture Overview**

### **Core Components**

#### **1. Performance Monitoring Service**
```typescript
// src/lib/services/performance.ts
export class PerformanceMonitoringService {
  // Real-time performance tracking
  async trackPerformance(operation, duration, success, userId, metadata)
  
  // Database performance tracking
  async trackDatabasePerformance(query, duration, success, userId, metadata)
  
  // External API performance tracking
  async trackExternalApiPerformance(api, duration, success, userId, metadata)
  
  // Load testing capabilities
  async runLoadTest(testName, requests, concurrency, requestFn)
  
  // Performance dashboard data
  async getPerformanceDashboard(timeRange)
}
```

#### **2. Performance Dashboard Component**
```typescript
// src/components/monitoring/PerformanceDashboard.tsx
export function PerformanceDashboard() {
  // Real-time metrics display
  // Resource usage monitoring
  // Performance alerts
  // Load testing interface
  // Historical trends
}
```

#### **3. API Endpoints**
```typescript
// /api/monitoring/performance - Real-time performance data
// /api/monitoring/load-test - Load testing capabilities
// /api/monitoring/agent-metrics - Agent-specific metrics
```

### **Integration Points**

#### **AI Agent Integration**
The performance monitoring is seamlessly integrated into the Finance Agent:

```typescript
// Automatic performance tracking for all AI queries
trackPerformance(
  'finance-agent-query',
  totalExecutionTime,
  true,
  userId,
  {
    functionsUsed,
    cacheHit: false,
    responseSize: finalResponse?.content?.length || 0,
    openaiCalls: 2,
  }
);

// OpenAI API performance tracking
trackExternalApiPerformance(
  'openai-chat-completion',
  openaiDuration,
  true,
  userId,
  {
    model: 'gpt-4o-mini',
    functionsUsed: functionsUsed.length,
    responseSize: completion.choices[0]?.message?.content?.length || 0,
  }
);
```

## 🎯 **Key Metrics & KPIs**

### **Performance Metrics**
- **Response Time**: Average, P95, P99 response times
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Success Rate**: Percentage of successful requests
- **Cache Hit Rate**: Cache effectiveness

### **Resource Metrics**
- **Memory Usage**: Current memory utilization
- **CPU Usage**: Current CPU utilization
- **Database Connections**: Active connection count
- **Cache Size**: Number of cached items

### **User Experience Metrics**
- **Active Users**: Concurrent user count
- **Average Queries Per User**: User engagement
- **Retention Rate**: User retention over time
- **Session Duration**: Average session length

### **Business Metrics**
- **Function Usage**: Most commonly used AI functions
- **Query Patterns**: Popular query types
- **Error Patterns**: Common error types
- **Performance Trends**: Historical performance data

## 🔧 **Implementation Guide**

### **Setting Up Performance Monitoring**

#### **1. Install Dependencies**
```bash
# Performance monitoring is already integrated
# No additional dependencies required
```

#### **2. Configure Performance Tracking**
```typescript
// Performance tracking is automatically enabled
// Configure thresholds in performance.ts
const ALERT_THRESHOLDS = {
  responseTime: {
    warning: 1000, // 1 second
    critical: 5000, // 5 seconds
  },
  errorRate: {
    warning: 0.05, // 5%
    critical: 0.10, // 10%
  },
  throughput: {
    warning: 10, // 10 requests per second
    critical: 5, // 5 requests per second
  },
};
```

#### **3. Access Performance Dashboard**
```typescript
// Navigate to /monitoring to access the dashboard
// Or integrate the component into your app
import { PerformanceDashboard } from '@/components/monitoring/PerformanceDashboard';
```

### **Adding Performance Tracking to New Features**

#### **1. Track Function Performance**
```typescript
import { trackPerformance } from '@/lib/services/performance';

async function myFeature() {
  const startTime = Date.now();
  
  try {
    // Your feature logic here
    const result = await someOperation();
    
    // Track successful performance
    trackPerformance(
      'my-feature-operation',
      Date.now() - startTime,
      true,
      userId,
      {
        operationType: 'feature',
        resultSize: JSON.stringify(result).length,
      }
    );
    
    return result;
  } catch (error) {
    // Track failed performance
    trackPerformance(
      'my-feature-operation',
      Date.now() - startTime,
      false,
      userId,
      {
        operationType: 'feature',
        error: error.message,
      },
      error.message
    );
    
    throw error;
  }
}
```

#### **2. Track Database Performance**
```typescript
import { trackDatabasePerformance } from '@/lib/services/performance';

async function databaseOperation() {
  const startTime = Date.now();
  
  try {
    const result = await prisma.someTable.findMany();
    
    trackDatabasePerformance(
      'SELECT * FROM some_table',
      Date.now() - startTime,
      true,
      userId,
      {
        tableName: 'some_table',
        recordCount: result.length,
      }
    );
    
    return result;
  } catch (error) {
    trackDatabasePerformance(
      'SELECT * FROM some_table',
      Date.now() - startTime,
      false,
      userId,
      {
        tableName: 'some_table',
        error: error.message,
      }
    );
    
    throw error;
  }
}
```

#### **3. Track External API Performance**
```typescript
import { trackExternalApiPerformance } from '@/lib/services/performance';

async function externalApiCall() {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    
    trackExternalApiPerformance(
      'example-api',
      Date.now() - startTime,
      true,
      userId,
      {
        endpoint: '/data',
        responseSize: JSON.stringify(data).length,
        statusCode: response.status,
      }
    );
    
    return data;
  } catch (error) {
    trackExternalApiPerformance(
      'example-api',
      Date.now() - startTime,
      false,
      userId,
      {
        endpoint: '/data',
        error: error.message,
      }
    );
    
    throw error;
  }
}
```

## 📈 **Load Testing Guide**

### **Running Load Tests**

#### **1. Via Performance Dashboard**
1. Navigate to `/monitoring`
2. Go to the "Load Testing" tab
3. Configure test parameters:
   - **Test Name**: Descriptive name for the test
   - **Total Requests**: Number of requests to send (1-1000)
   - **Concurrency**: Number of concurrent requests (1-50)
4. Click "Start Load Test"
5. Monitor results in real-time

#### **2. Via API**
```bash
curl -X POST http://localhost:3000/api/monitoring/load-test \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "AI Agent Load Test",
    "requests": 100,
    "concurrency": 10
  }'
```

#### **3. Programmatically**
```typescript
import { performanceMonitoring } from '@/lib/services/performance';

const loadTestResult = await performanceMonitoring.runLoadTest(
  'Custom Load Test',
  100,
  10,
  async () => {
    // Your test request function
    const response = await fetch('/api/agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Test query' }),
    });
    return response.json();
  }
);

console.log('Load Test Results:', loadTestResult);
```

### **Load Test Results**
```typescript
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
  throughput: number; // requests per second
  concurrency: number;
  results: Array<{
    requestId: string;
    duration: number;
    success: boolean;
    error?: string;
    timestamp: Date;
  }>;
}
```

## 🚨 **Alerting & Monitoring**

### **Performance Alerts**

#### **Alert Types**
- **Response Time Alerts**: When response times exceed thresholds
- **Error Rate Alerts**: When error rates exceed thresholds
- **Throughput Alerts**: When throughput drops below thresholds
- **Resource Alerts**: When memory or CPU usage is high
- **Database Alerts**: When database performance degrades

#### **Alert Severity Levels**
- **Low**: Informational alerts
- **Medium**: Warning alerts
- **High**: Critical alerts requiring attention
- **Critical**: System-threatening alerts requiring immediate action

#### **Alert Configuration**
```typescript
const ALERT_THRESHOLDS = {
  responseTime: {
    warning: 1000,    // 1 second
    critical: 5000,   // 5 seconds
  },
  errorRate: {
    warning: 0.05,    // 5%
    critical: 0.10,   // 10%
  },
  throughput: {
    warning: 10,      // 10 requests per second
    critical: 5,      // 5 requests per second
  },
  memoryUsage: {
    warning: 80,      // 80%
    critical: 90,     // 90%
  },
  cpuUsage: {
    warning: 80,      // 80%
    critical: 90,     // 90%
  },
};
```

### **Real-Time Monitoring**

#### **Dashboard Features**
- **Real-time Metrics**: Live updates every 30 seconds
- **Historical Trends**: Performance data over time
- **Resource Monitoring**: System resource utilization
- **Alert Management**: View and manage active alerts
- **Load Testing**: Built-in load testing capabilities

#### **Monitoring Endpoints**
```typescript
// Get real-time performance data
GET /api/monitoring/performance?timeRange=1h

// Run load tests
POST /api/monitoring/load-test

// Get agent-specific metrics
GET /api/monitoring/agent-metrics?timeRange=24h
```

## 🔍 **Troubleshooting & Debugging**

### **Common Issues**

#### **1. High Response Times**
- **Check Database Performance**: Monitor query execution times
- **Review Cache Hit Rates**: Ensure caching is working effectively
- **Analyze External API Calls**: Check OpenAI API response times
- **Monitor Resource Usage**: Check CPU and memory utilization

#### **2. High Error Rates**
- **Review Error Logs**: Check detailed error information
- **Validate Input Data**: Ensure data quality and format
- **Check External Dependencies**: Verify API availability
- **Monitor Database Health**: Check connection pool and query performance

#### **3. Low Throughput**
- **Optimize Database Queries**: Add indexes and optimize queries
- **Implement Caching**: Cache frequently accessed data
- **Scale Resources**: Increase CPU/memory allocation
- **Review Code Efficiency**: Optimize algorithms and data structures

### **Debugging Tools**

#### **1. Performance Logs**
```typescript
// Enable detailed logging
console.log('Performance tracking:', {
  operation: 'finance-agent-query',
  duration: 1500,
  success: true,
  metadata: { functionsUsed: ['getSpendingByCategory'] }
});
```

#### **2. Database Query Analysis**
```typescript
// Monitor database performance
trackDatabasePerformance(
  'SELECT * FROM receipts WHERE userId = ?',
  duration,
  success,
  userId,
  { queryType: 'user_receipts', recordCount: result.length }
);
```

#### **3. External API Monitoring**
```typescript
// Monitor external API calls
trackExternalApiPerformance(
  'openai-chat-completion',
  duration,
  success,
  userId,
  { model: 'gpt-4o-mini', responseSize: responseLength }
);
```

## 📊 **Performance Optimization**

### **Best Practices**

#### **1. Database Optimization**
- **Use Indexes**: Add indexes on frequently queried columns
- **Optimize Queries**: Use efficient query patterns
- **Connection Pooling**: Implement proper connection management
- **Query Caching**: Cache frequently executed queries

#### **2. Caching Strategy**
- **Application Cache**: Cache application-level data
- **Database Cache**: Use database query caching
- **CDN Cache**: Cache static assets and API responses
- **Browser Cache**: Implement proper cache headers

#### **3. Code Optimization**
- **Async Operations**: Use async/await for non-blocking operations
- **Batch Processing**: Process data in batches when possible
- **Memory Management**: Properly manage memory usage
- **Error Handling**: Implement robust error handling

#### **4. Monitoring & Alerting**
- **Set Appropriate Thresholds**: Configure realistic alert thresholds
- **Monitor Trends**: Track performance trends over time
- **Proactive Monitoring**: Set up alerts before issues occur
- **Regular Reviews**: Regularly review and optimize performance

### **Performance Targets**

#### **Response Time Targets**
- **AI Queries**: < 2 seconds average
- **Database Queries**: < 100ms average
- **External API Calls**: < 1 second average
- **Page Load Times**: < 1 second average

#### **Throughput Targets**
- **AI Queries**: > 50 requests per second
- **Database Operations**: > 1000 operations per second
- **Concurrent Users**: > 1000 concurrent users

#### **Error Rate Targets**
- **Overall Error Rate**: < 1%
- **AI Query Errors**: < 2%
- **Database Errors**: < 0.1%
- **External API Errors**: < 1%

## 🎯 **Success Metrics**

### **Key Performance Indicators (KPIs)**

#### **Technical KPIs**
- **Response Time**: Average response time < 2 seconds
- **Error Rate**: Error rate < 1%
- **Throughput**: > 50 requests per second
- **Uptime**: 99.9% availability

#### **User Experience KPIs**
- **User Satisfaction**: High user satisfaction scores
- **Feature Adoption**: High adoption of AI features
- **Session Duration**: Increasing session duration
- **Return Rate**: High user return rate

#### **Business KPIs**
- **Query Volume**: Increasing query volume
- **Feature Usage**: High usage of AI features
- **User Engagement**: High user engagement metrics
- **Cost Efficiency**: Optimized resource usage

### **Monitoring Success**

#### **Dashboard Usage**
- **Regular Monitoring**: Daily dashboard checks
- **Alert Response**: Quick response to alerts
- **Performance Reviews**: Weekly performance reviews
- **Optimization Actions**: Regular optimization actions

#### **Continuous Improvement**
- **Performance Tracking**: Continuous performance tracking
- **Optimization Cycles**: Regular optimization cycles
- **User Feedback**: Incorporating user feedback
- **Technology Updates**: Keeping up with technology updates

## 🔮 **Future Enhancements**

### **Planned Features**

#### **1. Advanced Analytics**
- **Predictive Analytics**: Predict performance issues before they occur
- **Machine Learning**: ML-based performance optimization
- **Anomaly Detection**: Advanced anomaly detection algorithms
- **Trend Analysis**: Deep trend analysis and forecasting

#### **2. Enhanced Monitoring**
- **Distributed Tracing**: End-to-end request tracing
- **Service Mesh**: Service mesh integration for microservices
- **Real-time Streaming**: Real-time performance data streaming
- **Advanced Alerting**: AI-powered alerting and recommendations

#### **3. Performance Optimization**
- **Auto-scaling**: Automatic resource scaling based on load
- **Intelligent Caching**: AI-powered cache optimization
- **Query Optimization**: Automatic query optimization
- **Resource Management**: Intelligent resource management

### **Integration Opportunities**

#### **1. External Monitoring Tools**
- **APM Integration**: Integration with APM tools
- **Log Aggregation**: Integration with log aggregation tools
- **Metrics Platforms**: Integration with metrics platforms
- **Alerting Services**: Integration with external alerting services

#### **2. Business Intelligence**
- **BI Integration**: Integration with BI tools
- **Data Warehousing**: Integration with data warehouses
- **Reporting Tools**: Integration with reporting tools
- **Analytics Platforms**: Integration with analytics platforms

## 📚 **Additional Resources**

### **Documentation**
- [Master System Guide](../STEWARD_MASTER_SYSTEM_GUIDE.md)
- [Tier 4 Upgrade Plan](../TIER4_UPGRADE_PLAN.md)
- [Production Deployment Guide](../PRODUCTION_DEPLOYMENT.md)

### **Code Examples**
- [Performance Service](../src/lib/services/performance.ts)
- [Performance Dashboard](../src/components/monitoring/PerformanceDashboard.tsx)
- [Performance API Routes](../src/app/api/monitoring/)

### **Testing**
- [Performance Tests](../src/__tests__/performance.test.ts)
- [Load Testing Examples](../src/__tests__/loadTesting.test.ts)
- [Monitoring Tests](../src/__tests__/monitoring.test.ts)

---

**🎉 Performance monitoring is now fully integrated into the Steward AI Financial Assistant!**

This comprehensive monitoring system provides real-time insights, proactive alerting, and powerful load testing capabilities to ensure optimal performance and user experience. 