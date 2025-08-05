#!/usr/bin/env node

/**
 * Debug script to test timeframe parsing issue
 * The AI might be passing an incorrect timeframe that excludes the data
 */

/**
 * Test timeframe parsing (from financeAgent.ts)
 */
function parseTimeframe(timeframe) {
  const now = new Date();
  const start = new Date(now);
  
  switch (timeframe.toLowerCase()) {
    case 'last week':
      start.setDate(now.getDate() - 7);
      break;
    case 'last month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'last 3 months':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'last 6 months':
      start.setMonth(now.getMonth() - 6);
      break;
    case 'this year':
      start.setMonth(0, 1);
      break;
    case 'last year':
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      break;
    default:
      start.setDate(now.getDate() - 30); // Default to last 30 days
  }
  
  return { start, end: now };
}

/**
 * Test the actual receipt dates vs timeframe parsing
 */
function debugTimeframeParsing() {
  console.log('🕐 DEBUGGING TIMEFRAME PARSING ISSUE');
  console.log('='.repeat(50));
  
  // Known receipt date from our database check
  const receiptDate = new Date('2025-07-02'); // Chick-fil-A receipts are on this date
  const now = new Date();
  
  console.log(`📅 Current date: ${now.toISOString().split('T')[0]}`);
  console.log(`📅 Receipt date: ${receiptDate.toISOString().split('T')[0]}`);
  
  // Test common timeframe phrases the AI might use
  const testTimeframes = [
    'this year',
    'last month', 
    'last 3 months',
    'last 6 months',
    'last week',
    'last year',
    undefined, // default case
    '', // empty string
    'recently', // not in switch
    'all time' // not in switch
  ];
  
  console.log('\n🧪 Testing timeframe parsing:');
  console.log('-'.repeat(50));
  
  testTimeframes.forEach(timeframe => {
    const displayTimeframe = timeframe === undefined ? 'undefined' : `"${timeframe}"`;
    const parsed = parseTimeframe(timeframe || '');
    
    const includesReceipt = receiptDate >= parsed.start && receiptDate <= parsed.end;
    const status = includesReceipt ? '✅ INCLUDES' : '❌ EXCLUDES';
    
    console.log(`${displayTimeframe.padEnd(15)} → ${parsed.start.toISOString().split('T')[0]} to ${parsed.end.toISOString().split('T')[0]} ${status}`);
  });
  
  // Check if July 2025 receipts would be excluded by common timeframes
  console.log('\n🔍 ANALYSIS:');
  console.log('-'.repeat(50));
  
  const thisYear = parseTimeframe('this year');
  const lastMonth = parseTimeframe('last month');
  const last3Months = parseTimeframe('last 3 months');
  
  if (receiptDate < thisYear.start) {
    console.log('❌ CRITICAL: Receipt date is BEFORE "this year" start');
  } else if (receiptDate > thisYear.end) {
    console.log('❌ CRITICAL: Receipt date is AFTER "this year" end');
  } else {
    console.log('✅ Receipt date is within "this year" range');
  }
  
  if (receiptDate < lastMonth.start) {
    console.log('❌ Receipt date is BEFORE "last month" start');
  } else {
    console.log('✅ Receipt date is within "last month" range');
  }
  
  if (receiptDate < last3Months.start) {
    console.log('❌ Receipt date is BEFORE "last 3 months" start');
  } else {
    console.log('✅ Receipt date is within "last 3 months" range');
  }
  
  // Check what the AI might be defaulting to
  const defaultTimeframe = parseTimeframe('');
  const includesReceiptDefault = receiptDate >= defaultTimeframe.start && receiptDate <= defaultTimeframe.end;
  
  console.log(`\n🤖 AI Default Timeframe (last 30 days):`);
  console.log(`   Range: ${defaultTimeframe.start.toISOString().split('T')[0]} to ${defaultTimeframe.end.toISOString().split('T')[0]}`);
  console.log(`   Includes receipt: ${includesReceiptDefault ? '✅ YES' : '❌ NO'}`);
  
  if (!includesReceiptDefault) {
    console.log('\n🚨 POTENTIAL ROOT CAUSE IDENTIFIED:');
    console.log('   The AI might be using the default timeframe (last 30 days)');
    console.log('   which excludes the July 2025 receipts!');
    console.log('\n💡 SOLUTION:');
    console.log('   1. Check what timeframe the AI is actually passing');
    console.log('   2. Ensure the AI uses a broader timeframe like "this year"');
    console.log('   3. Or modify the default timeframe to be more inclusive');
  }
}

/**
 * Test the financeFunctions.ts parseTimeframe (different implementation)
 */
function parseTimeframeFinanceFunctions(timeframe) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  timeframe = timeframe.toLowerCase().trim();
  
  switch (timeframe) {
    case 'last month':
      const lastMonth = new Date(currentYear, currentMonth - 1, 1);
      return {
        start: lastMonth,
        end: new Date(currentYear, currentMonth, 0)
      };
    
    case 'this month':
      return {
        start: new Date(currentYear, currentMonth, 1),
        end: new Date(currentYear, currentMonth + 1, 0)
      };
    
    case 'last week':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 7);
      return {
        start: lastWeekStart,
        end: now
      };
    
    case 'this year':
      return {
        start: new Date(currentYear, 0, 1),
        end: new Date(currentYear, 11, 31)
      };
    
    case 'last year':
      return {
        start: new Date(currentYear - 1, 0, 1),
        end: new Date(currentYear - 1, 11, 31)
      };
    
    default:
      // Handle month names
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      const monthIndex = monthNames.indexOf(timeframe);
      if (monthIndex !== -1) {
        // If it's a past month this year, use this year
        // If it's a future month, use last year
        const targetYear = monthIndex <= currentMonth ? currentYear : currentYear - 1;
        return {
          start: new Date(targetYear, monthIndex, 1),
          end: new Date(targetYear, monthIndex + 1, 0)
        };
      }
      
      // Default to last month if unknown
      const defaultLastMonth = new Date(currentYear, currentMonth - 1, 1);
      return {
        start: defaultLastMonth,
        end: new Date(currentYear, currentMonth, 0)
      };
  }
}

function compareParsers() {
  console.log('\n📊 COMPARING TIMEFRAME PARSERS:');
  console.log('='.repeat(50));
  
  const testCases = ['this year', 'last month', 'july', 'unknown'];
  
  testCases.forEach(timeframe => {
    console.log(`\n🧪 Testing: "${timeframe}"`);
    
    const agent = parseTimeframe(timeframe);
    const finance = parseTimeframeFinanceFunctions(timeframe);
    
    console.log(`   Agent:   ${agent.start.toISOString().split('T')[0]} to ${agent.end.toISOString().split('T')[0]}`);
    console.log(`   Finance: ${finance.start.toISOString().split('T')[0]} to ${finance.end.toISOString().split('T')[0]}`);
    
    const agentRange = agent.end.getTime() - agent.start.getTime();
    const financeRange = finance.end.getTime() - finance.start.getTime();
    
    if (agentRange !== financeRange) {
      console.log(`   ⚠️  Different ranges! Agent: ${Math.round(agentRange/86400000)} days, Finance: ${Math.round(financeRange/86400000)} days`);
    }
  });
}

// Run the debug
debugTimeframeParsing();
compareParsers();