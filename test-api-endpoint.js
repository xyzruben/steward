#!/usr/bin/env node

/**
 * Test script to call the actual web API endpoint /api/agent/query
 * This tests the full web interface layer including authentication, caching, and response formatting
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = '7cd3a5ac-d465-4d68-917a-9922d8606eb6';

// Test cases
const TEST_CASES = [
  {
    name: 'Chick-fil-A Spending Query',
    query: 'How much did I spend at Chick-fil-A?',
    expectedTotal: 45.92,
    expectedFunction: 'getSpendingByVendor'
  },
  {
    name: 'Alternative Chick-fil-A Query',
    query: 'What did I spend at chick fil a?',
    expectedTotal: 45.92,
    expectedFunction: 'getSpendingByVendor'
  },
  {
    name: 'Coffee Spending Query',
    query: 'How much did I spend on coffee?',
    expectedTotal: 11.90,
    expectedFunction: 'getSpendingByCategory'
  }
];

/**
 * Make HTTP request to the API endpoint
 */
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0',
        ...headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            json: null
          };
          
          if (body.trim()) {
            try {
              response.json = JSON.parse(body);
            } catch (e) {
              // Body is not JSON, keep as string
            }
          }
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Authenticate and get session cookie (mock implementation)
 * In a real scenario, you'd need proper Supabase authentication
 */
async function getAuthCookie() {
  try {
    // For now, we'll simulate authentication by trying to get user info
    // In a real test, you'd need to authenticate with Supabase first
    console.log('🔐 Note: This test requires proper authentication setup');
    console.log('   For full testing, you would need valid Supabase session cookies');
    return null; // No cookie for now
  } catch (error) {
    console.log('⚠️  Authentication not available, testing without auth');
    return null;
  }
}

/**
 * Test a single API call
 */
async function testApiCall(testCase, authCookie = null) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Query: "${testCase.query}"`);
  
  try {
    const headers = {};
    if (authCookie) {
      headers['Cookie'] = authCookie;
    }

    const response = await makeRequest('/api/agent/query', 'POST', {
      query: testCase.query,
      streaming: false
    }, headers);

    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 401) {
      console.log('   ❌ Unauthorized - Authentication required');
      console.log('   💡 This is expected if running without proper Supabase session');
      return { success: false, reason: 'Authentication required' };
    }
    
    if (response.statusCode === 200 && response.json) {
      console.log(`   ✅ Success`);
      console.log(`   Message: ${response.json.message || 'No message'}`);
      console.log(`   Data:`, response.json.data);
      console.log(`   Functions Used:`, response.json.functionsUsed);
      console.log(`   Cached:`, response.json.cached);
      console.log(`   Execution Time:`, response.json.executionTime);
      
      // Check if the response contains expected data
      const actualTotal = response.json.data?.total;
      if (actualTotal !== undefined) {
        if (Math.abs(actualTotal - testCase.expectedTotal) < 0.01) {
          console.log(`   ✅ Expected total $${testCase.expectedTotal} matches actual $${actualTotal}`);
        } else {
          console.log(`   ❌ Expected total $${testCase.expectedTotal} but got $${actualTotal}`);
        }
      }
      
      return { success: true, response: response.json };
    } else {
      console.log(`   ❌ Failed with status ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return { success: false, reason: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

/**
 * Test the health/status of the API
 */
async function testApiHealth() {
  console.log('🔍 Testing API Health...');
  
  try {
    // Test if the server is running
    const response = await makeRequest('/api/health', 'GET');
    console.log(`   API Health Status: ${response.statusCode}`);
    
    if (response.statusCode === 404) {
      console.log('   💡 /api/health not found, trying root path');
      const rootResponse = await makeRequest('/', 'GET');
      console.log(`   Root path status: ${rootResponse.statusCode}`);
      return rootResponse.statusCode < 500;
    }
    
    return response.statusCode === 200;
  } catch (error) {
    console.log(`   ❌ API Health Check Failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting API Endpoint Test for Chick-fil-A Debug');
  console.log('============================================================');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  
  // Check if API is reachable
  const apiHealthy = await testApiHealth();
  if (!apiHealthy) {
    console.log('\n❌ API is not reachable. Make sure the development server is running:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   yarn dev');
    return;
  }
  
  console.log('\n✅ API is reachable');
  
  // Get authentication (if available)
  const authCookie = await getAuthCookie();
  
  // Run test cases
  const results = [];
  for (const testCase of TEST_CASES) {
    const result = await testApiCall(testCase, authCookie);
    results.push({ testCase, result });
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('============================================================');
  
  const successCount = results.filter(r => r.result.success).length;
  const totalCount = results.length;
  
  console.log(`Successful tests: ${successCount}/${totalCount}`);
  
  results.forEach(({ testCase, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${testCase.name}: ${result.reason || 'Success'}`);
  });
  
  if (successCount === 0) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure the development server is running: npm run dev');
    console.log('2. Check that the database contains test data');
    console.log('3. Verify Supabase authentication is properly configured');
    console.log('4. Check the OpenAI API key is set in environment variables');
  }
  
  // If we got authentication errors, suggest manual testing
  const authErrors = results.filter(r => r.result.reason === 'Authentication required').length;
  if (authErrors > 0) {
    console.log('\n🔐 Manual Testing Suggestion:');
    console.log('Since authentication is required, you can test manually by:');
    console.log('1. Open your browser and log into the application');
    console.log('2. Open browser developer tools > Network tab');
    console.log('3. Submit a query through the UI');
    console.log('4. Check the /api/agent/query request and response');
    console.log(`5. Look for the Chick-fil-A query returning $0 instead of $45.92`);
  }
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testApiCall, TEST_CASES };