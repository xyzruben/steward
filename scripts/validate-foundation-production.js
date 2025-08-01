#!/usr/bin/env node

// ============================================================================
// PRODUCTION FOUNDATION VALIDATION SCRIPT
// ============================================================================
// Validates production environment using existing endpoints
// Compatible with current production deployment

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://www.hellosteward.org';
const TIMEOUT = 30000; // 30 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${testName}: ${status}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: TIMEOUT,
      ...options
    };
    
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions for production environment
async function testHealthCheck() {
  logSection('HEALTH CHECK VALIDATION');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    
    if (response.status === 200) {
      const health = response.data;
      
      logTest('Overall Status', health.status === 'healthy' ? 'PASS' : 'FAIL', 
        `Status: ${health.status}`);
      
      logTest('Response Time', health.responseTime ? 'PASS' : 'WARN',
        health.responseTime || 'No response time data');
      
      logTest('Environment', health.environment === 'production' ? 'PASS' : 'WARN',
        `Environment: ${health.environment}`);
      
      logTest('Version', health.version ? 'PASS' : 'WARN',
        `Version: ${health.version}`);
      
      // Check if services are reported
      if (health.services) {
        Object.entries(health.services).forEach(([service, status]) => {
          logTest(`${service.toUpperCase()} Service`, status === 'healthy' ? 'PASS' : 'FAIL',
            `${service}: ${status}`);
        });
      }
      
      return health.status === 'healthy';
    } else {
      logTest('Health Check', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', error.message);
    return false;
  }
}

async function testOCRService() {
  logSection('OCR SERVICE VALIDATION');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/test-ocr`);
    
    if (response.status === 200 && response.data.success) {
      logTest('OCR Service', 'PASS', 'Google Cloud Vision working');
      logTest('OCR Response', 'PASS', response.data.message);
      logTest('OCR Result', 'PASS', `Text found: ${response.data.hasText}`);
      return true;
    } else {
      logTest('OCR Service', 'FAIL', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('OCR Service', 'FAIL', error.message);
    return false;
  }
}

async function testEndpointAvailability() {
  logSection('ENDPOINT AVAILABILITY VALIDATION');
  
  const endpoints = [
    { name: 'Health Check', path: '/api/health', expectedStatus: 200 },
    { name: 'OCR Test', path: '/api/test-ocr', expectedStatus: 200 },
    { name: 'Receipt Stats', path: '/api/receipts/stats', expectedStatus: 401 }, // Requires auth
    { name: 'Retry Stuck Receipts', path: '/api/retry-stuck-receipts', expectedStatus: 401 }, // Requires auth
    { name: 'Receipt Upload', path: '/api/receipts/upload', expectedStatus: 405 }, // POST only
  ];
  
  let passedTests = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      
      if (response.status === endpoint.expectedStatus) {
        logTest(endpoint.name, 'PASS', `HTTP ${response.status} (expected ${endpoint.expectedStatus})`);
        passedTests++;
      } else {
        logTest(endpoint.name, 'FAIL', `HTTP ${response.status} (expected ${endpoint.expectedStatus})`);
      }
    } catch (error) {
      logTest(endpoint.name, 'FAIL', error.message);
    }
  }
  
  return passedTests >= endpoints.length * 0.8; // 80% success rate
}

async function testAuthenticationEndpoints() {
  logSection('AUTHENTICATION ENDPOINT VALIDATION');
  
  try {
    // Test that protected endpoints return appropriate status codes
    const protectedEndpoints = [
      { path: '/api/receipts/stats', expectedStatus: 401, name: 'Receipt Stats' },
      { path: '/api/retry-stuck-receipts', expectedStatus: 401, name: 'Retry Stuck Receipts' },
      { path: '/api/receipts/upload', expectedStatus: 405, name: 'Receipt Upload (GET)' } // POST-only endpoint
    ];
    
    let passedTests = 0;
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
        
        if (response.status === endpoint.expectedStatus) {
          const statusText = endpoint.expectedStatus === 401 ? 'Properly protected (401 Unauthorized)' : 'Method not allowed (405)';
          logTest(`${endpoint.name} Auth`, 'PASS', statusText);
          passedTests++;
        } else {
          logTest(`${endpoint.name} Auth`, 'FAIL', `Expected ${endpoint.expectedStatus}, got ${response.status}`);
        }
      } catch (error) {
        logTest(`${endpoint.name} Auth`, 'FAIL', error.message);
      }
    }
    
    return passedTests === protectedEndpoints.length;
  } catch (error) {
    logTest('Authentication Test', 'FAIL', error.message);
    return false;
  }
}

async function testReceiptProcessing() {
  logSection('RECEIPT PROCESSING VALIDATION');
  
  try {
    // Test the retry stuck receipts endpoint (should return 401 without auth, which is correct)
    const response = await makeRequest(`${BASE_URL}/api/retry-stuck-receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.status === 401) {
      logTest('Stuck Receipts Processing', 'PASS', 'Endpoint exists and properly protected');
      return true;
    } else {
      logTest('Stuck Receipts Processing', 'FAIL', `Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Stuck Receipts Processing', 'FAIL', error.message);
    return false;
  }
}

// Main validation function
async function validateProductionFoundation() {
  console.log('\n' + '🚀'.repeat(20));
  log('PRODUCTION FOUNDATION VALIDATION STARTED', 'bright');
  log(`Testing against: ${BASE_URL}`, 'cyan');
  console.log('🚀'.repeat(20) + '\n');
  
  const startTime = Date.now();
  const results = {
    health: await testHealthCheck(),
    ocr: await testOCRService(),
    endpoints: await testEndpointAvailability(),
    auth: await testAuthenticationEndpoints(),
    processing: await testReceiptProcessing()
  };
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Summary
  logSection('VALIDATION SUMMARY');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;
  
  log(`📊 Test Results: ${passedTests}/${totalTests} passed (${successRate.toFixed(1)}%)`, 
    successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  log(`⏱️  Total Duration: ${duration}ms`, 'cyan');
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`, 
      passed ? 'green' : 'red');
  });
  
  // Recommendations
  logSection('RECOMMENDATIONS');
  
  if (!results.health) {
    log('🔧 Fix health check issues - this indicates fundamental problems', 'yellow');
  }
  
  if (!results.ocr) {
    log('📸 OCR service issues - check Google Cloud Vision credentials', 'yellow');
  }
  
  if (!results.endpoints) {
    log('🌐 Endpoint availability issues - check API routes', 'yellow');
  }
  
  if (!results.auth) {
    log('🔐 Authentication issues - check protected endpoints', 'yellow');
  }
  
  if (!results.processing) {
    log('🔄 Processing pipeline issues - check receipt processing', 'yellow');
  }
  
  if (successRate === 100) {
    log('🎉 All tests passed! Production foundation is solid.', 'green');
  } else if (successRate >= 80) {
    log('⚠️  Most tests passed. Address the failing tests before proceeding.', 'yellow');
  } else {
    log('🚨 Multiple critical failures. Fix foundation issues before any AI optimization.', 'red');
  }
  
  // Next steps
  logSection('NEXT STEPS');
  
  if (successRate >= 80) {
    log('✅ Deploy new validation endpoints for comprehensive testing', 'green');
    log('✅ Run full foundation validation after deployment', 'green');
    log('✅ Proceed with AI optimization', 'green');
  } else {
    log('🔧 Fix critical foundation issues first', 'red');
    log('🔧 Deploy fixes to production', 'red');
    log('🔧 Re-run validation after fixes', 'red');
  }
  
  console.log('\n' + '🏁'.repeat(20));
  log('PRODUCTION FOUNDATION VALIDATION COMPLETED', 'bright');
  console.log('🏁'.repeat(20) + '\n');
  
  return successRate >= 80;
}

// Run validation if called directly
if (require.main === module) {
  validateProductionFoundation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Validation failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { validateProductionFoundation }; 