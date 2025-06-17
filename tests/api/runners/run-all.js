/**
 * Comprehensive Test Runner
 * Executes all test suites in the correct order with full reporting
 */

const path = require('path');
const fs = require('fs');
const { TestRunner } = require('../framework/test-runner');
const { runUnitTests } = require('./run-unit');
const { runIntegrationTests } = require('./run-integration');

async function runAllTests() {
  console.log('🎯 myMCP Engine - Complete Test Suite');
  console.log('======================================\n');

  const startTime = Date.now();
  const results = {
    unit: null,
    integration: null,
    overall: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }
  };

  // Ensure results directory exists
  const resultsDir = path.join(__dirname, '../results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    // Run Unit Tests
    console.log('📋 Phase 1: Unit Tests');
    console.log('─'.repeat(30));
    
    const unitRunner = new TestRunner({
      verbose: process.argv.includes('--verbose'),
      stopOnFailure: false,
      cleanupBetweenTests: true,
      timeout: 5000
    });

    const unitFiles = [
      path.join(__dirname, '../specs/unit/health.spec.js'),
      path.join(__dirname, '../specs/unit/state.spec.js'),
      // Add other unit test files as they're created
    ].filter(file => fs.existsSync(file));

    results.unit = await unitRunner.runFiles(unitFiles);

    // Run Integration Tests only if unit tests pass or --continue-on-failure is set
    if (results.unit.failed === 0 || process.argv.includes('--continue-on-failure')) {
      console.log('\n📋 Phase 2: Integration Tests');
      console.log('─'.repeat(30));
      
      const integrationRunner = new TestRunner({
        verbose: process.argv.includes('--verbose'),
        stopOnFailure: false,
        cleanupBetweenTests: true,
        timeout: 15000
      });

      const integrationFiles = [
        path.join(__dirname, '../specs/integration/player-journey.spec.js'),
        // Add other integration test files as they're created
      ].filter(file => fs.existsSync(file));

      results.integration = await integrationRunner.runFiles(integrationFiles);
    } else {
      console.log('\n⏭️  Skipping integration tests due to unit test failures');
      console.log('   Use --continue-on-failure to run integration tests anyway');
    }

    // Calculate overall results
    const endTime = Date.now();
    results.overall.duration = endTime - startTime;
    
    if (results.unit) {
      results.overall.total += results.unit.total;
      results.overall.passed += results.unit.passed;
      results.overall.failed += results.unit.failed;
      results.overall.skipped += results.unit.skipped;
    }
    
    if (results.integration) {
      results.overall.total += results.integration.total;
      results.overall.passed += results.integration.passed;
      results.overall.failed += results.integration.failed;
      results.overall.skipped += results.integration.skipped;
    }

    // Print comprehensive summary
    printComprehensiveSummary(results);

    // Export detailed results
    const resultsFile = path.join(resultsDir, 'complete-test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📁 Detailed results exported to: ${resultsFile}`);

    // Generate HTML report if requested
    if (process.argv.includes('--html-report')) {
      generateHTMLReport(results, resultsDir);
    }

    // Exit with appropriate code
    const success = results.overall.failed === 0;
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('❌ Test suite failed with error:', error.message);
    process.exit(1);
  }
}

function printComprehensiveSummary(results) {
  const duration = Math.round(results.overall.duration / 1000);
  const passRate = results.overall.total > 0 
    ? Math.round((results.overall.passed / results.overall.total) * 100) 
    : 0;

  console.log('\n🏆 Complete Test Suite Summary');
  console.log('='.repeat(50));
  
  // Phase-by-phase breakdown
  if (results.unit) {
    const unitPassRate = results.unit.total > 0 
      ? Math.round((results.unit.passed / results.unit.total) * 100) 
      : 0;
    console.log(`📋 Unit Tests: ${results.unit.passed}/${results.unit.total} passed (${unitPassRate}%)`);
  }
  
  if (results.integration) {
    const integrationPassRate = results.integration.total > 0 
      ? Math.round((results.integration.passed / results.integration.total) * 100) 
      : 0;
    console.log(`🔗 Integration Tests: ${results.integration.passed}/${results.integration.total} passed (${integrationPassRate}%)`);
  }

  console.log('─'.repeat(50));
  console.log(`📊 Total Tests: ${results.overall.total}`);
  console.log(`✅ Passed: ${results.overall.passed}`);
  console.log(`❌ Failed: ${results.overall.failed}`);
  console.log(`⏭️  Skipped: ${results.overall.skipped}`);
  console.log(`📈 Overall Pass Rate: ${passRate}%`);
  console.log(`⏱️  Total Duration: ${duration}s`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (results.overall.failed === 0) {
    console.log('   ✅ All tests passed! Your API is ready for production.');
  } else {
    console.log(`   ⚠️  ${results.overall.failed} test(s) failed. Review and fix before deployment.`);
  }
  
  if (results.overall.skipped > 0) {
    console.log(`   ℹ️  ${results.overall.skipped} test(s) were skipped. Consider investigating why.`);
  }

  const success = results.overall.failed === 0;
  console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
}

function generateHTMLReport(results, outputDir) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>myMCP Engine Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .test-section { margin-bottom: 30px; }
        .test-list { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .test-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .test-passed { background: #d4edda; color: #155724; }
        .test-failed { background: #f8d7da; color: #721c24; }
        .test-skipped { background: #fff3cd; color: #856404; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 myMCP Engine Test Results</h1>
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${results.overall.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${results.overall.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${results.overall.failed}</div>
            </div>
            <div class="metric">
                <h3>Pass Rate</h3>
                <div class="value">${Math.round((results.overall.passed / results.overall.total) * 100)}%</div>
            </div>
        </div>

        ${results.unit ? generateTestSectionHTML('Unit Tests', results.unit) : ''}
        ${results.integration ? generateTestSectionHTML('Integration Tests', results.integration) : ''}
    </div>
</body>
</html>
  `;

  const htmlFile = path.join(outputDir, 'test-report.html');
  fs.writeFileSync(htmlFile, htmlContent);
  console.log(`📊 HTML report generated: ${htmlFile}`);
}

function generateTestSectionHTML(title, results) {
  const testItems = results.tests.map(test => {
    const statusClass = `test-${test.status}`;
    const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
    return `
      <div class="test-item ${statusClass}">
        ${statusIcon} ${test.suite ? test.suite + ' > ' : ''}${test.name}
        ${test.error ? `<br><small>Error: ${test.error}</small>` : ''}
        <small style="float: right;">${test.duration}ms</small>
      </div>
    `;
  }).join('');

  return `
    <div class="test-section">
      <h2>${title}</h2>
      <div class="test-list">
        ${testItems}
      </div>
    </div>
  `;
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
