#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}🧪 MyMCP Engine - Complete Data Model Test Suite${colors.reset}\n`);

// Define all test categories
const testCategories = [
  {
    name: 'Core Data Models',
    tests: [
      { name: 'Player Model', file: 'src/models/__tests__/Player.test.ts' },
      { name: 'Quest Model', file: 'src/models/__tests__/Quest.test.ts' },
      { name: 'Inventory Model', file: 'src/models/__tests__/Inventory.test.ts' },
      { name: 'GameSession Model', file: 'src/models/__tests__/GameSession.test.ts' },
      { name: 'GameState Model', file: 'src/models/__tests__/GameState.test.ts' }
    ]
  },
  {
    name: 'Service Layer',
    tests: [
      { name: 'RedisStateManager', file: 'src/services/__tests__/RedisStateManager.test.ts' },
      { name: 'EventBroadcaster', file: 'src/services/__tests__/EventBroadcaster.test.ts' },
      { name: 'MultiplayerService', file: 'src/services/__tests__/MultiplayerService.test.ts' },
      { name: 'UnifiedChatService', file: 'src/services/__tests__/UnifiedChatService.test.ts' },
      { name: 'LLMService', file: 'src/services/__tests__/LLMService.test.ts' }
    ]
  },
  {
    name: 'Integration Tests',
    tests: [
      { name: 'Redis Integration', file: 'src/services/__tests__/RedisStateManager.integration.test.ts' }
    ]
  }
];

// Test results storage
const results = {
  passed: [],
  failed: [],
  skipped: [],
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  duration: 0
};

const startTime = Date.now();

// Function to run a single test file
function runTest(testInfo, categoryName) {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}Running ${testInfo.name}...${colors.reset}`);
    
    const testPath = path.join(__dirname, testInfo.file);
    
    // Check if file exists
    if (!fs.existsSync(testPath)) {
      console.log(`${colors.yellow}⚠️  Test file not found: ${testInfo.file}${colors.reset}`);
      results.skipped.push({
        category: categoryName,
        name: testInfo.name,
        file: testInfo.file
      });
      resolve();
      return;
    }

    const jest = spawn('npx', ['jest', testPath, '--no-coverage', '--silent'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let output = '';
    jest.stdout.on('data', (data) => {
      output += data.toString();
    });

    jest.stderr.on('data', (data) => {
      output += data.toString();
    });

    jest.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✓ ${testInfo.name} passed${colors.reset}`);
        
        // Extract test counts from output
        const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        const testCount = testMatch ? parseInt(testMatch[2]) : 0;
        
        results.passed.push({
          category: categoryName,
          name: testInfo.name,
          file: testInfo.file,
          tests: testCount
        });
        results.totalPassed += testCount;
      } else {
        console.log(`${colors.red}✗ ${testInfo.name} failed${colors.reset}`);
        
        // Extract failure info
        const failMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        const failedCount = failMatch ? parseInt(failMatch[1]) : 1;
        const passedCount = failMatch ? parseInt(failMatch[2]) : 0;
        
        results.failed.push({
          category: categoryName,
          name: testInfo.name,
          file: testInfo.file,
          failedTests: failedCount,
          passedTests: passedCount
        });
        results.totalFailed += failedCount;
        results.totalPassed += passedCount;
      }
      
      resolve();
    });
  });
}

// Run all tests sequentially
async function runAllTests() {
  for (const category of testCategories) {
    console.log(`\n${colors.bright}${colors.magenta}━━━ ${category.name} ━━━${colors.reset}`);
    
    for (const test of category.tests) {
      await runTest(test, category.name);
    }
  }

  results.duration = Math.round((Date.now() - startTime) / 1000);
  results.totalTests = results.totalPassed + results.totalFailed;

  // Display summary
  displaySummary();
}

function displaySummary() {
  console.log(`\n${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}                    TEST SUMMARY REPORT                      ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Overall stats
  console.log(`${colors.cyan}Total Test Files:${colors.reset} ${results.passed.length + results.failed.length + results.skipped.length}`);
  console.log(`${colors.cyan}Total Tests Run:${colors.reset} ${results.totalTests}`);
  console.log(`${colors.green}Tests Passed:${colors.reset} ${results.totalPassed}`);
  console.log(`${colors.red}Tests Failed:${colors.reset} ${results.totalFailed}`);
  console.log(`${colors.yellow}Files Skipped:${colors.reset} ${results.skipped.length}`);
  console.log(`${colors.cyan}Duration:${colors.reset} ${results.duration}s`);

  // Passed tests
  if (results.passed.length > 0) {
    console.log(`\n${colors.green}✓ PASSED TESTS:${colors.reset}`);
    results.passed.forEach(test => {
      console.log(`  ${colors.green}✓${colors.reset} ${test.category} / ${test.name} (${test.tests} tests)`);
    });
  }

  // Failed tests
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}✗ FAILED TESTS:${colors.reset}`);
    results.failed.forEach(test => {
      console.log(`  ${colors.red}✗${colors.reset} ${test.category} / ${test.name} (${test.failedTests} failed, ${test.passedTests} passed)`);
      console.log(`    ${colors.dim}${test.file}${colors.reset}`);
    });
  }

  // Skipped tests
  if (results.skipped.length > 0) {
    console.log(`\n${colors.yellow}⚠️  SKIPPED TESTS:${colors.reset}`);
    results.skipped.forEach(test => {
      console.log(`  ${colors.yellow}⚠️${colors.reset} ${test.category} / ${test.name}`);
      console.log(`    ${colors.dim}${test.file}${colors.reset}`);
    });
  }

  // Success rate
  const successRate = results.totalTests > 0 
    ? Math.round((results.totalPassed / results.totalTests) * 100) 
    : 0;

  console.log(`\n${colors.bright}Success Rate: ${successRate >= 80 ? colors.green : colors.red}${successRate}%${colors.reset}`);

  // Exit code
  const exitCode = results.failed.length > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    console.log(`\n${colors.green}${colors.bright}✨ All tests passed! ✨${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Some tests failed. Please check the output above.${colors.reset}`);
  }

  // Generate detailed report
  generateDetailedReport();

  process.exit(exitCode);
}

function generateDetailedReport() {
  const report = {
    timestamp: new Date().toISOString(),
    duration: results.duration,
    summary: {
      totalFiles: results.passed.length + results.failed.length + results.skipped.length,
      totalTests: results.totalTests,
      passed: results.totalPassed,
      failed: results.totalFailed,
      successRate: results.totalTests > 0 
        ? Math.round((results.totalPassed / results.totalTests) * 100) 
        : 0
    },
    categories: testCategories.map(category => ({
      name: category.name,
      tests: category.tests.map(test => {
        const passed = results.passed.find(p => p.file === test.file);
        const failed = results.failed.find(f => f.file === test.file);
        const skipped = results.skipped.find(s => s.file === test.file);
        
        return {
          name: test.name,
          file: test.file,
          status: passed ? 'passed' : failed ? 'failed' : 'skipped',
          tests: passed?.tests || (failed?.failedTests + failed?.passedTests) || 0,
          passed: passed?.tests || failed?.passedTests || 0,
          failed: failed?.failedTests || 0
        };
      })
    })),
    details: {
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped
    }
  };

  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.cyan}Detailed report saved to:${colors.reset} ${reportPath}`);
}

// Handle interruption
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test run interrupted${colors.reset}`);
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
}); 