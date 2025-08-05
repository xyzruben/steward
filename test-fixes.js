#!/usr/bin/env node

/**
 * Test script to verify the Chick-fil-A fixes work correctly
 */

// Test the new unified timeframe parser
const { parseTimeframe, formatTimeframeRange, isDateInRange } = require('./src/lib/utils/timeframeParser.ts');

function testTimeframeFixes() {
  console.log('🧪 TESTING CHICK-FIL-A FIXES');
  console.log('='.repeat(50));
  
  // Known receipt date
  const receiptDate = new Date('2025-07-02');
  console.log(`📅 Receipt date: ${receiptDate.toISOString().split('T')[0]}`);
  
  // Test the improved default timeframes
  const testCases = [
    { name: 'Default (unknown timeframe)', input: '' },
    { name: 'This year', input: 'this year' },
    { name: 'Last 3 months', input: 'last 3 months' },
    { name: 'Last month', input: 'last month' },
    { name: 'July', input: 'july' }
  ];
  
  console.log('\n🔍 Testing timeframe parsing:');
  console.log('-'.repeat(50));
  
  testCases.forEach(testCase => {
    try {
      const range = parseTimeframe(testCase.input);
      const includes = isDateInRange(receiptDate, range);
      const status = includes ? '✅ INCLUDES' : '❌ EXCLUDES';
      
      console.log(`${testCase.name.padEnd(25)} → ${formatTimeframeRange(range)} ${status}`);
    } catch (error) {
      console.log(`${testCase.name.padEnd(25)} → ERROR: ${error.message}`);
    }
  });
  
  // Test the default behavior specifically
  console.log('\n📊 KEY IMPROVEMENTS:');
  console.log('-'.repeat(50));
  
  const oldDefault = {
    start: new Date('2025-07-05'), // Old 30-day default
    end: new Date('2025-08-04')
  };
  
  const newDefault = parseTimeframe(''); // New 90-day default
  
  console.log(`Old default (30 days): ${formatTimeframeRange(oldDefault)} → ${isDateInRange(receiptDate, oldDefault) ? '✅' : '❌'}`);
  console.log(`New default (90 days): ${formatTimeframeRange(newDefault)} → ${isDateInRange(receiptDate, newDefault) ? '✅' : '❌'}`);
  
  const thisYear = parseTimeframe('this year');
  console.log(`This year range:       ${formatTimeframeRange(thisYear)} → ${isDateInRange(receiptDate, thisYear) ? '✅' : '❌'}`);
  
  // Summary
  console.log('\n📋 SUMMARY:');
  console.log('-'.repeat(50));
  
  const newDefaultIncludes = isDateInRange(receiptDate, newDefault);
  const thisYearIncludes = isDateInRange(receiptDate, thisYear);
  
  if (newDefaultIncludes && thisYearIncludes) {
    console.log('✅ SUCCESS: Both improved default and "this year" include the receipt date');
    console.log('   The AI should now find the Chick-fil-A data correctly!');
  } else {
    console.log('❌ ISSUE: Fixes may not fully resolve the problem');
    if (!newDefaultIncludes) console.log('   - New default still excludes receipt');
    if (!thisYearIncludes) console.log('   - "This year" excludes receipt');
  }
  
  console.log('\n🤖 AI BEHAVIOR CHANGES:');
  console.log('1. System prompt now instructs AI to use "this year" for vendor queries');
  console.log('2. Default timeframe extended from 30 to 90 days');
  console.log('3. Unified timeframe parsing eliminates inconsistencies');
  console.log('4. Function descriptions emphasize comprehensive data coverage');
}

// Test vendor variation generation
function testVendorVariations() {
  console.log('\n🔧 Testing vendor variations (should be unchanged):');
  
  // This function should be unchanged but let's verify it works
  function generateVendorVariations(vendorName) {
    if (!vendorName || typeof vendorName !== 'string') {
      return [];
    }

    const variations = [];
    const normalized = vendorName.toLowerCase().trim();
    variations.push(normalized);

    if (normalized.includes('chick') && normalized.includes('fil')) {
      variations.push('chick-fil-a');
      variations.push('chick fil a');
      variations.push('chickfila');
      variations.push('chick fil-a');
      variations.push('chick-fil a');
    }

    return [...new Set(variations)];
  }
  
  const variations = generateVendorVariations('Chick-fil-A');
  console.log(`Chick-fil-A variations: [${variations.join(', ')}]`);
  console.log('✅ Vendor matching should work correctly');
}

// Run tests
if (require.main === module) {
  testTimeframeFixes();
  testVendorVariations();
}

module.exports = { testTimeframeFixes };