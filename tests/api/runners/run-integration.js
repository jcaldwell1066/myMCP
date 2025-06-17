/**
 * Integration Test Runner
 * Executes integration tests for multi-endpoint workflows
 */

const path = require('path');
const { TestRunner } = require('../framework/test-runner');

async function runIntegrationTests() {
  console.log('🔗 myMCP Engine - Integration Test Suite');
  console.log('=========================================\n');

  const runner = new TestRunner({
    verbose: process.argv.includes('--verbose'),
    stopOnFailure: process.argv.includes('--stop-on-failure'),
    cleanupBetweenTests: true,
    timeout: 15000 // Longer timeout for integration tests
  });

  const testFiles = [
    path.join(__dirname, '../specs/integration/player-journey.spec.js'),
    path.join(__dirname, '../specs/integration/quest-workflow.spec.js'),
    path.join(__dirname, '../specs/integration/chat-flow.spec.js'),
    path.join(__dirname, '../specs/integration/websocket.spec.js')
  ].filter(file => {
    const fs = require('fs');
    return fs.existsSync(file);
  });

  try {
    const results = await runner.runFiles(testFiles);
    
    if (process.argv.includes('--export-results')) {
      const resultsFile = path.join(__dirname, '../results/integration-test-results.json');
      runner.exportResults(resultsFile);
    }
    
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Integration test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };
