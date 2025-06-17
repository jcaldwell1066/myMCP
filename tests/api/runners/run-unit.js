/**
 * Unit Test Runner
 * Executes all unit tests for individual API endpoints
 */

const path = require('path');
const { TestRunner } = require('../framework/test-runner');

async function runUnitTests() {
  console.log('🧪 myMCP Engine - Unit Test Suite');
  console.log('==================================\n');

  const runner = new TestRunner({
    verbose: process.argv.includes('--verbose'),
    stopOnFailure: process.argv.includes('--stop-on-failure'),
    cleanupBetweenTests: true,
    timeout: 5000
  });

  const testFiles = [
    path.join(__dirname, '../specs/unit/health.spec.js'),
    path.join(__dirname, '../specs/unit/state.spec.js'),
    path.join(__dirname, '../specs/unit/actions.spec.js'),
    path.join(__dirname, '../specs/unit/quests.spec.js'),
    path.join(__dirname, '../specs/unit/completions.spec.js')
  ].filter(file => {
    const fs = require('fs');
    return fs.existsSync(file);
  });

  try {
    const results = await runner.runFiles(testFiles);
    
    if (process.argv.includes('--export-results')) {
      const resultsFile = path.join(__dirname, '../results/unit-test-results.json');
      runner.exportResults(resultsFile);
    }
    
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Unit test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runUnitTests();
}

module.exports = { runUnitTests };
