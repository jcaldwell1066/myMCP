/**
 * Custom Test Runner
 * Run your specific business logic tests
 */

const path = require('path');
const { TestRunner } = require('../framework/test-runner');

async function runCustomTests() {
  console.log('🎯 myMCP Engine - Custom Business Logic Tests');
  console.log('==============================================\n');

  const runner = new TestRunner({
    verbose: true,
    cleanupBetweenTests: true,
    timeout: 15000
  });

  const testFiles = [
    path.join(__dirname, '../specs/custom/business-logic.spec.js'),
    // Add more custom test files here as you create them
  ].filter(file => {
    const fs = require('fs');
    return fs.existsSync(file);
  });

  if (testFiles.length === 0) {
    console.log('📝 No custom test files found in specs/custom/');
    console.log('💡 Create .spec.js files in tests/api/specs/custom/ to add your own tests');
    return true;
  }

  try {
    const results = await runner.runFiles(testFiles);
    
    console.log('\n🎯 Custom Test Results:');
    console.log(`📊 Business Logic Tests: ${results.passed}/${results.total} passed`);
    
    return results.failed === 0;
  } catch (error) {
    console.error('❌ Custom test runner failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  runCustomTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runCustomTests };
