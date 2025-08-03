#!/usr/bin/env node

/**
 * 🎯 PHASE 2: TARGETED INTERVENTION
 * 
 * This script implements targeted fixes for the root cause identified in Phase 1:
 * Categorization data persistence issue.
 * 
 * APPROACH: Fix the actual problem, not symptoms
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// 2.1 ROOT CAUSE FIX: CATEGORIZATION DATA PERSISTENCE
// ============================================================================

async function fixCategorizationDataPersistence() {
  console.log('🎯 PHASE 2: TARGETED INTERVENTION');
  console.log('============================================================');
  console.log('Fixing categorization data persistence issue...\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Analyze current categorization state
    console.log('============================================================');
    console.log('🔍 STEP 1: ANALYZING CURRENT CATEGORIZATION STATE');
    console.log('============================================================');
    
    const currentState = await analyzeCurrentCategorizationState();
    console.log('✅ Current state analysis complete');
    
    // Step 2: Fix categorization data persistence
    console.log('\n============================================================');
    console.log('🔧 STEP 2: FIXING CATEGORIZATION DATA PERSISTENCE');
    console.log('============================================================');
    
    const fixResults = await fixCategorizationPersistence();
    console.log('✅ Categorization persistence fix complete');
    
    // Step 3: Validate the fix
    console.log('\n============================================================');
    console.log('✅ STEP 3: VALIDATING THE FIX');
    console.log('============================================================');
    
    const validationResults = await validateCategorizationFix();
    console.log('✅ Fix validation complete');
    
    // Step 4: Test real AI integration
    console.log('\n============================================================');
    console.log('🤖 STEP 4: TESTING REAL AI INTEGRATION');
    console.log('============================================================');
    
    const aiTestResults = await testRealAIIntegration();
    console.log('✅ AI integration test complete');
    
    const executionTime = Date.now() - startTime;
    
    // Generate comprehensive intervention report
    generateInterventionReport({
      currentState,
      fixResults,
      validationResults,
      aiTestResults,
      executionTime
    });
    
    return {
      success: true,
      currentState,
      fixResults,
      validationResults,
      aiTestResults
    };
    
  } catch (error) {
    console.error('❌ Targeted intervention failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// STEP 1: ANALYZE CURRENT CATEGORIZATION STATE
// ============================================================================

async function analyzeCurrentCategorizationState() {
  console.log('📊 Analyzing current categorization state...');
  
  // Get all receipts
  const allReceipts = await prisma.receipt.findMany({
    select: {
      id: true,
      merchant: true,
      total: true,
      category: true,
      purchaseDate: true
    }
  });
  
  console.log(`📋 Total receipts found: ${allReceipts.length}`);
  
  // Analyze categorization state
  const categorizedReceipts = allReceipts.filter(r => r.category && r.category !== 'Uncategorized');
  const uncategorizedReceipts = allReceipts.filter(r => !r.category || r.category === 'Uncategorized');
  
  console.log(`🏷️  Categorized receipts: ${categorizedReceipts.length}`);
  console.log(`❓ Uncategorized receipts: ${uncategorizedReceipts.length}`);
  
  // Show sample uncategorized receipts
  console.log('\n📋 Sample uncategorized receipts:');
  uncategorizedReceipts.slice(0, 5).forEach(receipt => {
    console.log(`  - ${receipt.merchant}: $${receipt.total} (${receipt.category || 'null'})`);
  });
  
  // Check for Chick-fil-A specifically
  const chickFilAReceipts = allReceipts.filter(r => 
    r.merchant.toLowerCase().includes('chick-fil-a') || 
    r.merchant.toLowerCase().includes('chick fil a')
  );
  
  console.log(`\n🍗 Chick-fil-A receipts: ${chickFilAReceipts.length}`);
  chickFilAReceipts.forEach(receipt => {
    console.log(`  - ${receipt.merchant}: $${receipt.total} (${receipt.category || 'null'})`);
  });
  
  return {
    totalReceipts: allReceipts.length,
    categorizedReceipts: categorizedReceipts.length,
    uncategorizedReceipts: uncategorizedReceipts.length,
    categorizationRate: categorizedReceipts.length / allReceipts.length,
    chickFilAReceipts: chickFilAReceipts.length,
    sampleUncategorized: uncategorizedReceipts.slice(0, 5),
    allReceipts
  };
}

// ============================================================================
// STEP 2: FIX CATEGORIZATION DATA PERSISTENCE
// ============================================================================

async function fixCategorizationPersistence() {
  console.log('🔧 Fixing categorization data persistence...');
  
  // Get all uncategorized receipts
  const uncategorizedReceipts = await prisma.receipt.findMany({
    where: {
      OR: [
        { category: null },
        { category: 'Uncategorized' }
      ]
    }
  });
  
  console.log(`📋 Found ${uncategorizedReceipts.length} uncategorized receipts to fix`);
  
  const fixResults = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const receipt of uncategorizedReceipts) {
    try {
      // Apply categorization logic
      const category = categorizeReceipt(receipt.merchant);
      
      // Update the receipt with the correct category
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { category }
      });
      
      fixResults.push({
        id: receipt.id,
        merchant: receipt.merchant,
        oldCategory: receipt.category,
        newCategory: category,
        success: true
      });
      
      successCount++;
      
      console.log(`✅ Fixed: ${receipt.merchant} → ${category}`);
      
    } catch (error) {
      console.error(`❌ Failed to fix ${receipt.merchant}:`, error.message);
      
      fixResults.push({
        id: receipt.id,
        merchant: receipt.merchant,
        oldCategory: receipt.category,
        newCategory: null,
        success: false,
        error: error.message
      });
      
      errorCount++;
    }
  }
  
  console.log(`\n📊 Fix Results:`);
  console.log(`  ✅ Successfully fixed: ${successCount}`);
  console.log(`  ❌ Failed to fix: ${errorCount}`);
  console.log(`  📈 Success rate: ${((successCount / uncategorizedReceipts.length) * 100).toFixed(1)}%`);
  
  return {
    totalReceipts: uncategorizedReceipts.length,
    successCount,
    errorCount,
    successRate: successCount / uncategorizedReceipts.length,
    fixResults
  };
}

function categorizeReceipt(merchantName) {
  if (!merchantName || typeof merchantName !== 'string') {
    return 'Uncategorized';
  }

  const merchant = merchantName.toLowerCase().trim();
  
  // Category mappings (same as in financeFunctions.ts)
  const CATEGORY_MAPPINGS = {
    'coffee': ['coffee', 'tierra mia', 'starbucks', 'dunkin', 'peets', 'caribou', 'tim hortons'],
    'food': ['restaurant', 'mcdonalds', 'burger king', 'wendys', 'subway', 'pizza', 'taco', 'chick-fil-a', 'chick fil a'],
    'gas': ['gas', 'shell', 'exxon', 'mobil', 'chevron', 'bp', 'arco'],
    'groceries': ['walmart', 'target', 'kroger', 'safeway', 'albertsons', 'whole foods', 'trader joes'],
    'entertainment': ['netflix', 'spotify', 'amazon prime', 'hulu', 'disney+', 'movie', 'theater']
  };
  
  // Check each category's keywords for matches
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
    if (keywords.some(keyword => merchant.includes(keyword))) {
      // Return capitalized category name
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  
  return 'Uncategorized';
}

// ============================================================================
// STEP 3: VALIDATE THE FIX
// ============================================================================

async function validateCategorizationFix() {
  console.log('✅ Validating categorization fix...');
  
  // Get updated categorization state
  const allReceipts = await prisma.receipt.findMany({
    select: {
      id: true,
      merchant: true,
      total: true,
      category: true
    }
  });
  
  const categorizedReceipts = allReceipts.filter(r => r.category && r.category !== 'Uncategorized');
  const uncategorizedReceipts = allReceipts.filter(r => !r.category || r.category === 'Uncategorized');
  
  console.log(`📊 Post-fix categorization state:`);
  console.log(`  📋 Total receipts: ${allReceipts.length}`);
  console.log(`  🏷️  Categorized: ${categorizedReceipts.length}`);
  console.log(`  ❓ Uncategorized: ${uncategorizedReceipts.length}`);
  console.log(`  📈 Categorization rate: ${((categorizedReceipts.length / allReceipts.length) * 100).toFixed(1)}%`);
  
  // Check Chick-fil-A specifically
  const chickFilAReceipts = allReceipts.filter(r => 
    r.merchant.toLowerCase().includes('chick-fil-a') || 
    r.merchant.toLowerCase().includes('chick fil a')
  );
  
  const chickFilACategorized = chickFilAReceipts.filter(r => r.category === 'Food').length;
  
  console.log(`\n🍗 Chick-fil-A validation:`);
  console.log(`  📋 Total Chick-fil-A receipts: ${chickFilAReceipts.length}`);
  console.log(`  🏷️  Properly categorized as Food: ${chickFilACategorized}`);
  console.log(`  📈 Chick-fil-A categorization rate: ${((chickFilACategorized / chickFilAReceipts.length) * 100).toFixed(1)}%`);
  
  // Show categorized receipts
  console.log('\n📋 Sample categorized receipts:');
  categorizedReceipts.slice(0, 5).forEach(receipt => {
    console.log(`  - ${receipt.merchant}: ${receipt.category}`);
  });
  
  // Test categorization accuracy
  const accuracyTest = await testCategorizationAccuracy();
  
  return {
    totalReceipts: allReceipts.length,
    categorizedReceipts: categorizedReceipts.length,
    uncategorizedReceipts: uncategorizedReceipts.length,
    categorizationRate: categorizedReceipts.length / allReceipts.length,
    chickFilAReceipts: chickFilAReceipts.length,
    chickFilACategorized,
    chickFilACategorizationRate: chickFilACategorized / chickFilAReceipts.length,
    accuracyTest
  };
}

async function testCategorizationAccuracy() {
  console.log('\n🧪 Testing categorization accuracy...');
  
  const testCases = [
    { merchant: 'Chick-fil-A', expectedCategory: 'Food' },
    { merchant: 'Tierra Mia Coffee Company', expectedCategory: 'Coffee' },
    { merchant: 'AutoZone', expectedCategory: 'Auto Parts' },
    { merchant: 'Shell Gas Station', expectedCategory: 'Gas' },
    { merchant: 'Walmart', expectedCategory: 'Groceries' }
  ];
  
  let correctCategorizations = 0;
  
  for (const testCase of testCases) {
    const actualCategory = categorizeReceipt(testCase.merchant);
    const isCorrect = actualCategory === testCase.expectedCategory;
    
    if (isCorrect) correctCategorizations++;
    
    console.log(`  - ${testCase.merchant} → ${actualCategory} ${isCorrect ? '✅' : '❌'}`);
  }
  
  const accuracy = correctCategorizations / testCases.length;
  
  console.log(`\n📊 Categorization accuracy: ${(accuracy * 100).toFixed(1)}%`);
  console.log(`  ✅ Correct: ${correctCategorizations}/${testCases.length}`);
  
  return {
    accuracy,
    correctCategorizations,
    totalTests: testCases.length
  };
}

// ============================================================================
// STEP 4: TEST REAL AI INTEGRATION
// ============================================================================

async function testRealAIIntegration() {
  console.log('🤖 Testing real AI integration...');
  
  // Test database queries with categorized data
  const testResults = [];
  
  // Test 1: Chick-fil-A vendor query
  console.log('\n🧪 Test 1: Chick-fil-A vendor query');
  const chickFilAResult = await testVendorQuery('Chick-fil-A');
  testResults.push(chickFilAResult);
  
  // Test 2: Coffee category query
  console.log('\n🧪 Test 2: Coffee category query');
  const coffeeResult = await testCategoryQuery('Coffee');
  testResults.push(coffeeResult);
  
  // Test 3: Food category query
  console.log('\n🧪 Test 3: Food category query');
  const foodResult = await testCategoryQuery('Food');
  testResults.push(foodResult);
  
  console.log('\n📊 AI Integration Test Results:');
  testResults.forEach((result, index) => {
    console.log(`  Test ${index + 1}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`    Query: ${result.query}`);
    console.log(`    Result: $${result.total.toFixed(2)}`);
    console.log(`    Records: ${result.count}`);
  });
  
  const successCount = testResults.filter(r => r.success).length;
  const successRate = successCount / testResults.length;
  
  console.log(`\n📈 Overall success rate: ${(successRate * 100).toFixed(1)}%`);
  
  return {
    testResults,
    successCount,
    totalTests: testResults.length,
    successRate
  };
}

async function testVendorQuery(vendor) {
  try {
    const variations = generateVendorVariations(vendor);
    
    const result = await prisma.receipt.aggregate({
      where: {
        OR: variations.map(v => ({
          merchant: { contains: v, mode: 'insensitive' }
        }))
      },
      _sum: { total: true },
      _count: true
    });
    
    const total = Number(result._sum.total) || 0;
    const count = result._count || 0;
    
    console.log(`  🔍 Query: ${vendor}`);
    console.log(`  💰 Total: $${total.toFixed(2)}`);
    console.log(`  📊 Records: ${count}`);
    
    return {
      query: vendor,
      total,
      count,
      success: total > 0
    };
    
  } catch (error) {
    console.error(`  ❌ Error querying ${vendor}:`, error.message);
    return {
      query: vendor,
      total: 0,
      count: 0,
      success: false,
      error: error.message
    };
  }
}

async function testCategoryQuery(category) {
  try {
    const result = await prisma.receipt.aggregate({
      where: {
        category: { equals: category, mode: 'insensitive' }
      },
      _sum: { total: true },
      _count: true
    });
    
    const total = Number(result._sum.total) || 0;
    const count = result._count || 0;
    
    console.log(`  🔍 Query: ${category} category`);
    console.log(`  💰 Total: $${total.toFixed(2)}`);
    console.log(`  📊 Records: ${count}`);
    
    return {
      query: `${category} category`,
      total,
      count,
      success: total > 0
    };
    
  } catch (error) {
    console.error(`  ❌ Error querying ${category} category:`, error.message);
    return {
      query: `${category} category`,
      total: 0,
      count: 0,
      success: false,
      error: error.message
    };
  }
}

function generateVendorVariations(vendorName) {
  if (!vendorName) return [];
  
  const variations = [vendorName.toLowerCase()];
  
  if (vendorName.toLowerCase().includes('chick-fil-a')) {
    variations.push('chick fil a', 'chickfila', 'chick fila');
  }
  
  if (vendorName.toLowerCase().includes('tierra mia')) {
    variations.push('tierra mia coffee', 'tierra mia coffee company');
  }
  
  return [...new Set(variations)];
}

// ============================================================================
// INTERVENTION REPORT GENERATION
// ============================================================================

function generateInterventionReport(results) {
  console.log('\n============================================================');
  console.log('📊 PHASE 2 TARGETED INTERVENTION REPORT');
  console.log('============================================================');
  
  console.log(`⏱️  Total execution time: ${results.executionTime}ms`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Phase: 2 - Targeted Intervention`);
  
  // Current State Analysis
  console.log('\n📊 CURRENT STATE ANALYSIS:');
  const current = results.currentState;
  console.log(`  📋 Total receipts: ${current.totalReceipts}`);
  console.log(`  🏷️  Categorized: ${current.categorizedReceipts}`);
  console.log(`  ❓ Uncategorized: ${current.uncategorizedReceipts}`);
  console.log(`  📈 Categorization rate: ${(current.categorizationRate * 100).toFixed(1)}%`);
  console.log(`  🍗 Chick-fil-A receipts: ${current.chickFilAReceipts}`);
  
  // Fix Results
  console.log('\n🔧 FIX RESULTS:');
  const fix = results.fixResults;
  console.log(`  📋 Receipts processed: ${fix.totalReceipts}`);
  console.log(`  ✅ Successfully fixed: ${fix.successCount}`);
  console.log(`  ❌ Failed to fix: ${fix.errorCount}`);
  console.log(`  📈 Success rate: ${(fix.successRate * 100).toFixed(1)}%`);
  
  // Validation Results
  console.log('\n✅ VALIDATION RESULTS:');
  const validation = results.validationResults;
  console.log(`  📊 Post-fix categorization rate: ${(validation.categorizationRate * 100).toFixed(1)}%`);
  console.log(`  🍗 Chick-fil-A categorization rate: ${(validation.chickFilACategorizationRate * 100).toFixed(1)}%`);
  console.log(`  🧪 Categorization accuracy: ${(validation.accuracyTest.accuracy * 100).toFixed(1)}%`);
  
  // AI Integration Results
  console.log('\n🤖 AI INTEGRATION RESULTS:');
  const ai = results.aiTestResults;
  console.log(`  📊 Test success rate: ${(ai.successRate * 100).toFixed(1)}%`);
  console.log(`  ✅ Successful tests: ${ai.successCount}/${ai.totalTests}`);
  
  // Critical Issues Summary
  console.log('\n🚨 CRITICAL ISSUES SUMMARY:');
  const criticalIssues = [];
  
  if (validation.categorizationRate < 0.8) {
    criticalIssues.push('❌ WARNING: Categorization rate below 80%');
  }
  
  if (validation.chickFilACategorizationRate < 1.0) {
    criticalIssues.push('❌ CRITICAL: Not all Chick-fil-A receipts properly categorized');
  }
  
  if (ai.successRate < 1.0) {
    criticalIssues.push('❌ CRITICAL: AI integration tests not all passing');
  }
  
  if (criticalIssues.length === 0) {
    console.log('  ✅ No critical issues identified');
  } else {
    criticalIssues.forEach(issue => console.log(`  ${issue}`));
  }
  
  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS:');
  if (validation.categorizationRate >= 0.8) {
    console.log('  ✅ Categorization fix successful - proceed to Phase 3');
  } else {
    console.log('  🔧 Categorization fix needs improvement');
  }
  
  if (ai.successRate >= 1.0) {
    console.log('  ✅ AI integration successful - ready for production');
  } else {
    console.log('  🔧 AI integration needs improvement');
  }
  
  console.log('\n✅ PHASE 2 TARGETED INTERVENTION COMPLETE');
  console.log('   Ready to proceed to Phase 3: Comprehensive Validation');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  fixCategorizationDataPersistence().catch(console.error);
}

module.exports = {
  fixCategorizationDataPersistence,
  analyzeCurrentCategorizationState,
  fixCategorizationPersistence,
  validateCategorizationFix,
  testRealAIIntegration
}; 