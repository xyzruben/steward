// Simple test for categorization function
// This simulates what the categorizeReceipt function would do

const CATEGORY_MAPPINGS = {
  'coffee': ['coffee', 'tierra mia', 'starbucks', 'dunkin', 'peets', 'caribou', 'tim hortons'],
  'food': ['restaurant', 'mcdonalds', 'burger king', 'wendys', 'subway', 'pizza', 'taco', 'chick-fil-a', 'chick fil a'],
  'gas': ['gas', 'shell', 'exxon', 'mobil', 'chevron', 'bp', 'arco'],
  'groceries': ['walmart', 'target', 'kroger', 'safeway', 'albertsons', 'whole foods', 'trader joes'],
  'entertainment': ['netflix', 'spotify', 'amazon prime', 'hulu', 'disney+', 'movie', 'theater']
};

function categorizeReceipt(merchantName) {
  if (!merchantName || typeof merchantName !== 'string') {
    return 'Uncategorized';
  }

  const merchant = merchantName.toLowerCase().trim();
  
  // Check each category's keywords for matches
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
    if (keywords.some(keyword => merchant.includes(keyword))) {
      // Return capitalized category name
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  
  return 'Uncategorized';
}

// Test cases
console.log('🧪 Testing Receipt Categorization Function');
console.log('==========================================');

const testCases = [
  'Tierra Mia Coffee Company',
  'Chick-fil-A',
  'Chick fil A',
  'Shell',
  'Walmart',
  'Starbucks',
  'McDonalds',
  'Unknown Store',
  'Some Random Place'
];

testCases.forEach(merchant => {
  const category = categorizeReceipt(merchant);
  console.log(`${merchant.padEnd(25)} -> ${category}`);
});

console.log('\n✅ Categorization test completed!'); 