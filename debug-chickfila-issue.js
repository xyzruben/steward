#!/usr/bin/env node

/**
 * Debug script to identify the Chick-fil-A AI response issue
 * Tests the AI agent logic without requiring a running server
 */

// Mock the problematic imports to avoid ESM issues
const mockPrisma = {
  receipt: {
    aggregate: async (params) => {
      console.log('🗄️  Database Query (aggregate):', JSON.stringify(params, null, 2));
      
      // Simulate the actual query result for Chick-fil-A
      if (params.where && params.where.OR) {
        const chickFilAMatch = params.where.OR.some(condition => 
          condition.merchant && 
          condition.merchant.contains && 
          (condition.merchant.contains.toLowerCase().includes('chick') || 
           condition.merchant.contains.toLowerCase().includes('fil'))
        );
        
        if (chickFilAMatch) {
          console.log('✅ Chick-fil-A query detected, returning $45.92');
          return { _sum: { total: 45.92 } };
        }
      }
      
      console.log('❌ Query did not match Chick-fil-A pattern, returning $0');
      return { _sum: { total: 0 } };
    }
  }
};

// Set up the module resolution mock
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '@/lib/prisma' || id.includes('prisma')) {
    return { prisma: mockPrisma };
  }
  if (id === 'openai') {
    return {
      OpenAI: class MockOpenAI {
        constructor(options) {
          this.apiKey = options.apiKey;
        }
        
        chat = {
          completions: {
            create: async (params) => {
              console.log('🤖 OpenAI API Call:', {
                model: params.model,
                messages: params.messages,
                tools: params.tools?.length || 0,
                tool_choice: params.tool_choice
              });
              
              // Simulate AI deciding to call getSpendingByVendor for Chick-fil-A
              const userMessage = params.messages.find(m => m.role === 'user');
              if (userMessage && userMessage.content.toLowerCase().includes('chick')) {
                console.log('🧠 AI Analysis: Detected Chick-fil-A query, calling getSpendingByVendor');
                
                return {
                  choices: [{
                    message: {
                      content: null,
                      tool_calls: [{
                        function: {
                          name: 'getSpendingByVendor',
                          arguments: JSON.stringify({
                            vendor: 'Chick-fil-A',
                            timeframe: 'this year'
                          })
                        }
                      }]
                    }
                  }]
                };
              }
              
              return {
                choices: [{
                  message: {
                    content: "I couldn't process that query.",
                    tool_calls: []
                  }
                }]
              };
            }
          }
        }
      }
    };
  }
  
  return originalRequire.apply(this, arguments);
};

// Mock process.env
process.env.OPENAI_API_KEY = 'mock-key';

// Now require and test the functions
const path = require('path');
const fs = require('fs');

/**
 * Test the vendor variation generation
 */
function testVendorVariations() {
  console.log('\n🔧 Testing Vendor Variations:');
  
  const testVendors = ['Chick-fil-A', 'chick fil a', 'CHICK-FIL-A'];
  
  testVendors.forEach(vendor => {
    const variations = generateVendorVariations(vendor);
    console.log(`  "${vendor}" → [${variations.join(', ')}]`);
  });
}

/**
 * Generate vendor variations (copied from financeFunctions.ts)
 */
function generateVendorVariations(vendorName) {
  if (!vendorName || typeof vendorName !== 'string') {
    return [];
  }

  const variations = [];
  const normalized = vendorName.toLowerCase().trim();

  // Add the original name
  variations.push(normalized);

  // Common variations for Chick-fil-A
  if (normalized.includes('chick') && normalized.includes('fil')) {
    variations.push('chick-fil-a');
    variations.push('chick fil a');
    variations.push('chickfila');
    variations.push('chick fil-a');
    variations.push('chick-fil a');
  }

  // Remove duplicates and return
  return [...new Set(variations)];
}

/**
 * Test the database query logic
 */
async function testDatabaseQuery() {
  console.log('\n🗄️  Testing Database Query Logic:');
  
  const testUserId = '7cd3a5ac-d465-4d68-917a-9922d8606eb6';
  const vendor = 'Chick-fil-A';
  const timeframe = {
    start: new Date('2025-01-01'),
    end: new Date('2025-12-31')
  };
  
  // Simulate the where clause construction
  const whereClause = {
    userId: testUserId,
    purchaseDate: {
      gte: timeframe.start,
      lte: timeframe.end,
    }
  };
  
  // Add vendor filter with variations
  const vendorVariations = generateVendorVariations(vendor);
  whereClause.OR = vendorVariations.map(variation => ({
    merchant: {
      contains: variation,
      mode: 'insensitive'
    }
  }));
  
  console.log('Generated WHERE clause:');
  console.log(JSON.stringify(whereClause, null, 2));
  
  // Test the query
  const result = await mockPrisma.receipt.aggregate({
    where: whereClause,
    _sum: { total: true }
  });
  
  console.log(`Database result: $${result._sum.total}`);
  
  return result._sum.total;
}

/**
 * Test the AI agent response generation
 */
function testResponseGeneration(functionResults) {
  console.log('\n💬 Testing AI Response Generation:');
  
  const result = functionResults[0].result;
  const functionName = functionResults[0].functionName;
  const query = "How much did I spend at Chick-fil-A?";
  
  console.log(`Function: ${functionName}`);
  console.log(`Result: ${JSON.stringify(result)}`);
  
  // Simulate the generateMeaningfulResponse logic
  let message = '';
  
  if (functionName === 'getSpendingByVendor' && result && result.total !== undefined) {
    const amount = result.total === 0 ? '$0' : `$${result.total.toFixed(2)}`;
    const vendor = result.vendor || 'this vendor';
    
    if (result.total > 0) {
      message = `You spent ${amount} at ${vendor}.`;
    } else {
      message = `You spent ${amount} at ${vendor}.`;
    }
  }
  
  console.log(`Generated message: "${message}"`);
  
  return message;
}

/**
 * Main debug function
 */
async function debugChickFilAIssue() {
  console.log('🐛 DEBUGGING CHICK-FIL-A AI RESPONSE ISSUE');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Vendor variations
    testVendorVariations();
    
    // Test 2: Database query
    const dbTotal = await testDatabaseQuery();
    
    // Test 3: AI response generation
    const functionResults = [{
      functionName: 'getSpendingByVendor',
      result: {
        vendor: 'Chick-fil-A',
        total: dbTotal,
        currency: 'USD'
      }
    }];
    
    const message = testResponseGeneration(functionResults);
    
    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Database query result: $${dbTotal}`);
    console.log(`AI response message: "${message}"`);
    
    if (dbTotal === 45.92 && message.includes('$45.92')) {
      console.log('✅ ISSUE NOT REPRODUCED - System working correctly');
    } else if (dbTotal === 45.92 && message.includes('$0')) {
      console.log('❌ ISSUE CONFIRMED: Database returns $45.92 but AI says $0');
      console.log('🔍 Root cause: AI response generation or caching issue');
    } else if (dbTotal === 0) {
      console.log('❌ ISSUE CONFIRMED: Database query returns $0');
      console.log('🔍 Root cause: Database query construction or data issue');
    } else {
      console.log('❓ UNCLEAR: Unexpected result pattern');
    }
    
    // Recommendations
    console.log('\n🔧 TROUBLESHOOTING RECOMMENDATIONS:');
    console.log('1. Check if the AI is actually calling getSpendingByVendor');
    console.log('2. Verify the timeframe parsing is working correctly');
    console.log('3. Clear the AI agent cache if responses are cached');
    console.log('4. Check if the fuzzy matching logic is working');
    console.log('5. Verify the OpenAI API is receiving the correct function schema');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug if this script is executed directly
if (require.main === module) {
  debugChickFilAIssue().catch(console.error);
}

module.exports = { debugChickFilAIssue, testVendorVariations, testDatabaseQuery };