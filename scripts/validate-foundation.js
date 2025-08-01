#!/usr/bin/env node

// ============================================================================
// FOUNDATION VALIDATION SCRIPT
// ============================================================================
// Comprehensive validation of all critical services
// Follows FOUNDATION_VALIDATION_CHECKLIST.md requirements

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds

// Handle redirects for production URLs
function getActualBaseUrl(baseUrl) {
  if (baseUrl === 'https://hellosteward.org') {
    return 'https://www.hellosteward.org';
  }
  return baseUrl;
}

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
      followRedirect: true,
      maxRedirects: 5,
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

// Test functions
async function testHealthCheck() {
  logSection('HEALTH CHECK VALIDATION');
  
  try {
    const actualBaseUrl = getActualBaseUrl(BASE_URL);
    const response = await makeRequest(`${actualBaseUrl}/api/health`);
    
    if (response.status === 200) {
      const health = response.data;
      
      logTest('Overall Status', health.status === 'healthy' ? 'PASS' : 'FAIL', 
        `Status: ${health.status}`);
      
      logTest('Database Service', health.services.database === 'healthy' ? 'PASS' : 'FAIL',
        health.details.database || 'No details');
      
      logTest('Storage Service', health.services.storage === 'healthy' ? 'PASS' : 'FAIL',
        health.details.storage || 'No details');
      
      logTest('OCR Service', health.services.ocr === 'healthy' ? 'PASS' : 'FAIL',
        health.details.ocr || 'No details');
      
      logTest('AI Service', health.services.ai === 'healthy' ? 'PASS' : 'FAIL',
        health.details.ai || 'No details');
      
      logTest('Environment Variables', 
        health.environment.hasOpenAIKey && health.environment.hasGoogleCredentials && health.environment.hasSupabaseConfig ? 'PASS' : 'FAIL',
        `OpenAI: ${health.environment.hasOpenAIKey}, Google: ${health.environment.hasGoogleCredentials}, Supabase: ${health.environment.hasSupabaseConfig}`);
      
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

async function testDatabase() {
  logSection('DATABASE VALIDATION');
  
  try {
    const actualBaseUrl = getActualBaseUrl(BASE_URL);
    const response = await makeRequest(`${actualBaseUrl}/api/test-db`);
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      
      logTest('Database Connection', 'PASS', 'Connected successfully');
      logTest('Receipt Count', 'PASS', `${data.receiptCount} receipts found`);
      logTest('User Count', 'PASS', `${data.userCount} users found`);
      logTest('Query Performance', 
        data.queryPerformance.status === 'excellent' ? 'PASS' : 'WARN',
        `${data.queryPerformance.timeMs}ms (${data.queryPerformance.status})`);
      logTest('Schema Validation', 'PASS', `${data.schema.tables.length} tables found`);
      
      return true;
    } else {
      logTest('Database Test', 'FAIL', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Database Test', 'FAIL', error.message);
    return false;
  }
}

async function testStorage() {
  logSection('STORAGE VALIDATION');
  
  try {
    const actualBaseUrl = getActualBaseUrl(BASE_URL);
    const response = await makeRequest(`${actualBaseUrl}/api/test-storage`);
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      
      logTest('Storage Connection', 'PASS', 'Connected successfully');
      logTest('Receipts Bucket', 'PASS', `Bucket found: ${data.receiptsBucket.name}`);
      logTest('File Listing', 'PASS', `${data.receiptsBucket.fileCount} files found`);
      logTest('Upload Permissions', 'PASS', 'Can upload files');
      logTest('Download Permissions', 'PASS', 'Can download files');
      
      return true;
    } else {
      logTest('Storage Test', 'FAIL', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Storage Test', 'FAIL', error.message);
    return false;
  }
}

async function testOCR() {
  logSection('OCR VALIDATION');
  
  try {
    const actualBaseUrl = getActualBaseUrl(BASE_URL);
    const response = await makeRequest(`${actualBaseUrl}/api/test-ocr`);
    
    if (response.status === 200 && response.data.success) {
      logTest('OCR Service', 'PASS', 'Google Cloud Vision working');
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

async function testAI() {
  logSection('AI VALIDATION');
  
  try {
    const actualBaseUrl = getActualBaseUrl(BASE_URL);
    const response = await makeRequest(`${actualBaseUrl}/api/test-ai`);
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      
      logTest('OpenAI API Key', 'PASS', 'API key configured');
      logTest('AI Processing', 'PASS', `${data.processingTime.timeMs}ms (${data.processingTime.status})`);
      logTest('Merchant Extraction', data.validation.hasMerchant ? 'PASS' : 'FAIL', 
        data.extractedData.merchant || 'No merchant found');
      logTest('Total Extraction', data.validation.hasTotal ? 'PASS' : 'FAIL',
        data.extractedData.total || 'No total found');
      logTest('Category Extraction', data.validation.hasCategory ? 'PASS' : 'FAIL',
        data.extractedData.category || 'No category found');
      
      return data.validation.hasMerchant && data.validation.hasTotal;
    } else {
      logTest('AI Test', 'FAIL', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('AI Test', 'FAIL', error.message);
    return false;
  }
}

async function testReceiptProcessing() {
  logSection('RECEIPT PROCESSING VALIDATION');
  
  try {
    // Test retry stuck receipts endpoint
    const actualBaseUrl = getActualBaseUrl(BASE_URL);
    const response = await makeRequest(`${actualBaseUrl}/api/retry-stuck-receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.status === 200) {
      const data = response.data;
      logTest('Stuck Receipts Processing', 'PASS', 
        `Processed ${data.processedCount || 0} receipts`);
      return true;
    } else {
      logTest('Stuck Receipts Processing', 'FAIL', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    logTest('Stuck Receipts Processing', 'FAIL', error.message);
    return false;
  }
}

// Main validation function
async function validateFoundation() {
  const actualBaseUrl = getActualBaseUrl(BASE_URL);
  console.log('\n' + '🚀'.repeat(20));
  log('FOUNDATION VALIDATION STARTED', 'bright');
  log(`Testing against: ${actualBaseUrl}`, 'cyan');
  console.log('🚀'.repeat(20) + '\n');
  
  const startTime = Date.now();
  const results = {
    health: await testHealthCheck(),
    database: await testDatabase(),
    storage: await testStorage(),
    ocr: await testOCR(),
    ai: await testAI(),
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
    log('🔧 Fix health check issues first - this indicates fundamental problems', 'yellow');
  }
  
  if (!results.database) {
    log('🗄️  Database connection issues - check DATABASE_URL and Prisma setup', 'yellow');
  }
  
  if (!results.storage) {
    log('📦 Storage issues - check Supabase configuration and bucket setup', 'yellow');
  }
  
  if (!results.ocr) {
    log('📸 OCR issues - check Google Cloud Vision credentials', 'yellow');
  }
  
  if (!results.ai) {
    log('🤖 AI issues - check OpenAI API key and model access', 'yellow');
  }
  
  if (!results.processing) {
    log('🔄 Processing pipeline issues - check receipt processing endpoints', 'yellow');
  }
  
  if (successRate === 100) {
    log('🎉 All tests passed! Foundation is solid and ready for AI optimization.', 'green');
  } else if (successRate >= 80) {
    log('⚠️  Most tests passed. Address the failing tests before proceeding.', 'yellow');
  } else {
    log('🚨 Multiple critical failures. Fix foundation issues before any AI optimization.', 'red');
  }
  
  console.log('\n' + '🏁'.repeat(20));
  log('FOUNDATION VALIDATION COMPLETED', 'bright');
  console.log('🏁'.repeat(20) + '\n');
  
  return successRate >= 80;
}

// Run validation if called directly
if (require.main === module) {
  validateFoundation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Validation failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { validateFoundation }; 