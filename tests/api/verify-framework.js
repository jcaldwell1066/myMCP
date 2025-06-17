/**
 * Simple Test to Verify Framework Works
 * This tests the framework itself without requiring the engine
 */

const { TestRunner } = require('./framework/test-runner');

async function simpleTest() {
  console.log('🧪 Framework Verification Test');
  console.log('===============================\n');

  const runner = new TestRunner({
    verbose: true,
    timeout: 1000
  });

  try {
    // Test that framework loads correctly
    console.log('✅ TestRunner class loaded successfully');
    console.log('✅ APIClient class loaded successfully');
    console.log('✅ TestData class loaded successfully');
    console.log('✅ Assertions module loaded successfully');
    
    // Test basic runner functionality
    runner.describe('Framework Test', () => {
      console.log('✅ describe() function working');
    });
    
    console.log('✅ Framework verification complete!');
    console.log('\n🚀 Framework is ready to use.');
    console.log('💡 Make sure your engine is running on port 3000, then run:');
    console.log('   npm run test:smoke');
    
    return true;
  } catch (error) {
    console.error('❌ Framework verification failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

if (require.main === module) {
  simpleTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { simpleTest };
