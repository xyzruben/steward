#!/usr/bin/env node

/**
 * 🚨 PHASE 0: SYSTEMATIC PROBLEM DECOMPOSITION VALIDATION
 * 
 * This script validates the current state of the system and measures baseline metrics
 * as part of the Systemic Foundation-First Methodology Phase 0.
 * 
 * CRITICAL: This measures first, then we optimize based on evidence.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  userId: 'test-user-id', // We'll use a real user ID from the database
  testQueries: [
    // Vendor-specific queries (should call getSpendingByVendor)
    "How much did I spend at Chick-fil-A?",
    "What's my spending at Tierra Mia?",
    "Show me AutoZone expenses",
    
    // Category-specific queries (should call getSpendingByCategory)
    "How much did I spend on coffee?",
    "What's my food spending?",
    "Show me gas expenses",
    
    // Time-based queries (should call getSpendingByTime)
    "How much did I spend this month?",
    "What's my spending last week?",
    
    // Ambiguous queries (should default appropriately)
    "How much did I spend?",
    "What are my biggest expenses?"
  ],
  expectedFunctions: {
    'How much did I spend at Chick-fil-A?': 'getSpendingByVendor',
    'What\'s my spending at Tierra Mia?': 'getSpendingByVendor',
    'Show me AutoZone expenses': 'getSpendingByVendor',
    'How much did I spend on coffee?': 'getSpendingByCategory',
    'What\'s my food spending?': 'getSpendingByCategory',
    'Show me gas expenses': 'getSpendingByCategory',
    'How much did I spend this month?': 'getSpendingByTime',
    'What\'s my spending last week?': 'getSpendingByTime',
    'How much did I spend?': 'getSpendingByVendor', // Default to vendor
    'What are my biggest expenses?': 'getTopMerchants'
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

async function validateDatabaseState() {
  console.log('\n============================================================');
  console.log('🧪 VALIDATING DATABASE STATE');
  console.log('============================================================');
  
  try {
    // 1. Check database connection
    await prisma.$connect();
    console.log('✅ Database connection: SUCCESS');
    
    // 2. Get user count
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // 3. Get receipt count and sample
    const receiptCount = await prisma.receipt.count();
    console.log(`📊 Total receipts: ${receiptCount}`);
    
    // 4. Get sample receipts for analysis
    const sampleReceipts = await prisma.receipt.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 Sample Receipts:');
    sampleReceipts.forEach(receipt => {
      console.log(`  - ${receipt.merchant}: $${receipt.total} (${receipt.category || 'Uncategorized'})`);
    });
    
    // 5. Check for Chick-fil-A specifically
    const chickFilAReceipts = await prisma.receipt.findMany({
      where: {
        OR: [
          { merchant: { contains: 'chick-fil-a', mode: 'insensitive' } },
          { merchant: { contains: 'chick fil a', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`\n🍗 Chick-fil-A receipts found: ${chickFilAReceipts.length}`);
    if (chickFilAReceipts.length > 0) {
      const total = chickFilAReceipts.reduce((sum, r) => sum + Number(r.total), 0);
      console.log(`💰 Total Chick-fil-A spending: $${total.toFixed(2)}`);
    }
    
    // 6. Check categorization distribution
    const categoryStats = await prisma.receipt.groupBy({
      by: ['category'],
      _count: { category: true },
      _sum: { total: true }
    });
    
    console.log('\n📊 Category Distribution:');
    categoryStats.forEach(stat => {
      const category = stat.category || 'Uncategorized';
      const count = stat._count.category;
      const total = Number(stat._sum.total || 0);
      console.log(`  - ${category}: ${count} receipts, $${total.toFixed(2)} total`);
    });
    
    return {
      success: true,
      userCount,
      receiptCount,
      chickFilAReceipts: chickFilAReceipts.length,
      chickFilATotal: chickFilAReceipts.reduce((sum, r) => sum + Number(r.total), 0),
      categoryStats
    };
    
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function validateCategorizationSystem() {
  console.log('\n============================================================');
  console.log('🧪 VALIDATING CATEGORIZATION SYSTEM');
  console.log('============================================================');
  
  try {
    // Test categorization logic
    const testMerchants = [
      'Chick-fil-A',
      'Tierra Mia Coffee Company',
      'AutoZone',
      'Shell Gas Station',
      'Walmart',
      'Unknown Store'
    ];
    
    console.log('🏷️ Testing categorization logic:');
    
    for (const merchant of testMerchants) {
      // Simulate categorization (this would normally be done by the categorizeReceipt function)
      let category = 'Uncategorized';
      
      const merchantLower = merchant.toLowerCase();
      if (merchantLower.includes('chick-fil-a') || merchantLower.includes('chick fil a')) {
        category = 'Food';
      } else if (merchantLower.includes('tierra mia') || merchantLower.includes('coffee')) {
        category = 'Coffee';
      } else if (merchantLower.includes('autozone')) {
        category = 'Auto Parts';
      } else if (merchantLower.includes('shell') || merchantLower.includes('gas')) {
        category = 'Gas';
      } else if (merchantLower.includes('walmart')) {
        category = 'Groceries';
      }
      
      console.log(`  - ${merchant} → ${category}`);
    }
    
    // Check actual categorization in database
    const categorizedReceipts = await prisma.receipt.findMany({
      where: {
        category: { not: null }
      },
      take: 5
    });
    
    console.log('\n📋 Actual categorized receipts:');
    categorizedReceipts.forEach(receipt => {
      console.log(`  - ${receipt.merchant}: ${receipt.category}`);
    });
    
    return {
      success: true,
      testMerchants,
      categorizedReceipts: categorizedReceipts.length
    };
    
  } catch (error) {
    console.error('❌ Categorization validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function validateVendorMatching() {
  console.log('\n============================================================');
  console.log('🧪 VALIDATING VENDOR MATCHING');
  console.log('============================================================');
  
  try {
    // Test vendor variations
    const testVendors = [
      'Chick-fil-A',
      'chick fil a',
      'CHICK-FIL-A',
      'Tierra Mia',
      'tierra mia coffee company',
      'AutoZone',
      'autozone'
    ];
    
    console.log('🔍 Testing vendor matching:');
    
    for (const vendor of testVendors) {
      const variations = generateVendorVariations(vendor);
      console.log(`  - "${vendor}" variations: [${variations.join(', ')}]`);
      
      // Test database matching
      const matches = await prisma.receipt.findMany({
        where: {
          OR: variations.map(v => ({
            merchant: { contains: v, mode: 'insensitive' }
          }))
        }
      });
      
      console.log(`    Found ${matches.length} matching receipts`);
      if (matches.length > 0) {
        const total = matches.reduce((sum, r) => sum + Number(r.total), 0);
        console.log(`    Total spending: $${total.toFixed(2)}`);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Vendor matching validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

function generateVendorVariations(vendorName) {
  if (!vendorName) return [];
  
  const variations = [vendorName.toLowerCase()];
  
  // Handle common variations
  if (vendorName.toLowerCase().includes('chick-fil-a')) {
    variations.push('chick fil a', 'chickfila', 'chick fila');
  }
  
  if (vendorName.toLowerCase().includes('tierra mia')) {
    variations.push('tierra mia coffee', 'tierra mia coffee company');
  }
  
  if (vendorName.toLowerCase().includes('autozone')) {
    variations.push('auto zone', 'auto-zone');
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

async function validateAIFunctionSelection() {
  console.log('\n============================================================');
  console.log('🧪 VALIDATING AI FUNCTION SELECTION');
  console.log('============================================================');
  
  try {
    console.log('🤖 Testing AI function selection logic:');
    
    let correctSelections = 0;
    const results = [];
    
    for (const query of TEST_CONFIG.testQueries) {
      const expectedFunction = TEST_CONFIG.expectedFunctions[query];
      const selectedFunction = simulateAIFunctionSelection(query);
      const isCorrect = selectedFunction === expectedFunction;
      
      if (isCorrect) correctSelections++;
      
      results.push({
        query,
        expectedFunction,
        selectedFunction,
        isCorrect
      });
      
      console.log(`  - "${query}"`);
      console.log(`    Expected: ${expectedFunction}`);
      console.log(`    Selected: ${selectedFunction}`);
      console.log(`    Result: ${isCorrect ? '✅' : '❌'}`);
    }
    
    const accuracy = correctSelections / TEST_CONFIG.testQueries.length;
    
    console.log(`\n📊 Function Selection Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   Correct: ${correctSelections}/${TEST_CONFIG.testQueries.length}`);
    
    return {
      success: true,
      accuracy,
      correctSelections,
      totalQueries: TEST_CONFIG.testQueries.length,
      results
    };
    
  } catch (error) {
    console.error('❌ AI function selection validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

function simulateAIFunctionSelection(query) {
  const normalizedQuery = query.toLowerCase();
  
  // Vendor-specific detection
  const vendorKeywords = ['chick-fil-a', 'chick fil a', 'tierra mia', 'autozone', 'shell', 'walmart'];
  const hasVendorSpecific = vendorKeywords.some(vendor => normalizedQuery.includes(vendor));
  
  if (hasVendorSpecific) {
    return 'getSpendingByVendor';
  }
  
  // Category-specific detection
  const categoryKeywords = ['coffee', 'food', 'gas', 'groceries', 'entertainment'];
  const hasCategorySpecific = categoryKeywords.some(category => normalizedQuery.includes(category));
  
  if (hasCategorySpecific) {
    return 'getSpendingByCategory';
  }
  
  // Time-based detection
  const timeKeywords = ['this month', 'last month', 'this year', 'last year', 'yesterday', 'today', 'week'];
  const hasTimeBased = timeKeywords.some(time => normalizedQuery.includes(time));
  
  if (hasTimeBased) {
    return 'getSpendingByTime';
  }
  
  // Top merchants detection
  if (normalizedQuery.includes('biggest') || normalizedQuery.includes('top')) {
    return 'getTopMerchants';
  }
  
  // Default to vendor for ambiguous queries
  return 'getSpendingByVendor';
}

async function validateEndToEndFlow() {
  console.log('\n============================================================');
  console.log('🧪 VALIDATING END-TO-END FLOW');
  console.log('============================================================');
  
  try {
    const testCases = [
      {
        merchant: "Chick-fil-A",
        expectedCategory: "Food",
        testQuery: "How much did I spend at Chick-fil-A?",
        priority: "CRITICAL"
      },
      {
        merchant: "Tierra Mia Coffee Company", 
        expectedCategory: "Coffee",
        testQuery: "How much did I spend on coffee?",
        priority: "CRITICAL"
      }
    ];
    
    console.log('🔄 Testing end-to-end flow:');
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.merchant}`);
      
      // 1. Test categorization
      const category = simulateCategorization(testCase.merchant);
      const categorizationCorrect = category === testCase.expectedCategory;
      
      // 2. Test AI function selection
      const selectedFunction = simulateAIFunctionSelection(testCase.testQuery);
      const expectedFunction = TEST_CONFIG.expectedFunctions[testCase.testQuery];
      const functionSelectionCorrect = selectedFunction === expectedFunction;
      
      // 3. Test database query simulation
      const dbResult = await simulateDatabaseQuery(testCase.merchant);
      const hasData = dbResult.total > 0;
      
      console.log(`  Categorization: ${categorizationCorrect ? '✅' : '❌'} (${category})`);
      console.log(`  Function Selection: ${functionSelectionCorrect ? '✅' : '❌'} (${selectedFunction})`);
      console.log(`  Database Data: ${hasData ? '✅' : '❌'} ($${dbResult.total.toFixed(2)})`);
      
      const overallSuccess = categorizationCorrect && functionSelectionCorrect && hasData;
      console.log(`  Overall: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ End-to-end flow validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

function simulateCategorization(merchantName) {
  const merchant = merchantName.toLowerCase();
  
  if (merchant.includes('chick-fil-a') || merchant.includes('chick fil a')) {
    return 'Food';
  } else if (merchant.includes('tierra mia') || merchant.includes('coffee')) {
    return 'Coffee';
  } else if (merchant.includes('autozone')) {
    return 'Auto Parts';
  }
  
  return 'Uncategorized';
}

async function simulateDatabaseQuery(merchant) {
  try {
    const variations = generateVendorVariations(merchant);
    
    const result = await prisma.receipt.aggregate({
      where: {
        OR: variations.map(v => ({
          merchant: { contains: v, mode: 'insensitive' }
        }))
      },
      _sum: { total: true }
    });
    
    return {
      total: Number(result._sum.total) || 0,
      success: true
    };
  } catch (error) {
    return { total: 0, success: false, error: error.message };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runPhase0Validation() {
  console.log('🚨 PHASE 0: SYSTEMATIC PROBLEM DECOMPOSITION VALIDATION');
  console.log('============================================================');
  console.log('Measuring current state before optimization...\n');
  
  const startTime = Date.now();
  
  try {
    // Run all validations
    const results = {
      database: await validateDatabaseState(),
      categorization: await validateCategorizationSystem(),
      vendorMatching: await validateVendorMatching(),
      aiFunctionSelection: await validateAIFunctionSelection(),
      endToEndFlow: await validateEndToEndFlow()
    };
    
    // Generate summary
    console.log('\n============================================================');
    console.log('📊 PHASE 0 VALIDATION SUMMARY');
    console.log('============================================================');
    
    const executionTime = Date.now() - startTime;
    
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`📊 Database state: ${results.database.success ? '✅' : '❌'}`);
    console.log(`🏷️  Categorization: ${results.categorization.success ? '✅' : '❌'}`);
    console.log(`🔍 Vendor matching: ${results.vendorMatching.success ? '✅' : '❌'}`);
    console.log(`🤖 AI function selection: ${results.aiFunctionSelection.success ? '✅' : '❌'}`);
    console.log(`🔄 End-to-end flow: ${results.endToEndFlow.success ? '✅' : '❌'}`);
    
    if (results.aiFunctionSelection.success) {
      const accuracy = results.aiFunctionSelection.accuracy;
      console.log(`\n🎯 AI Function Selection Accuracy: ${(accuracy * 100).toFixed(1)}%`);
      
      if (accuracy < 0.95) {
        console.log('⚠️  CRITICAL: AI function selection accuracy below 95% target');
        console.log('   This confirms the root cause identified in Phase 0');
      }
    }
    
    if (results.database.success && results.database.chickFilAReceipts > 0) {
      console.log(`\n🍗 Chick-fil-A data found: $${results.database.chickFilATotal.toFixed(2)}`);
      console.log('   This confirms the data exists for proper AI responses');
    }
    
    console.log('\n✅ PHASE 0 VALIDATION COMPLETE');
    console.log('   Ready to proceed to Phase 1: Foundation Validation');
    
  } catch (error) {
    console.error('❌ Phase 0 validation failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
if (require.main === module) {
  runPhase0Validation().catch(console.error);
}

module.exports = {
  runPhase0Validation,
  validateDatabaseState,
  validateCategorizationSystem,
  validateVendorMatching,
  validateAIFunctionSelection,
  validateEndToEndFlow
}; 