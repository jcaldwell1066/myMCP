/**
 * Test Runner Framework for myMCP Engine
 * Provides structured test execution with reporting and data management
 */

const APIClient = require('./api-client');
const TestData = require('./test-data');
const { expect } = require('./assertions');

class TestRunner {
  constructor(config = {}) {
    this.config = {
      baseUrl: 'http://localhost:3000',
      verbose: false,
      cleanupBetweenTests: true,
      stopOnFailure: false,
      timeout: 10000,
      ...config
    };
    
    this.client = new APIClient({
      baseUrl: this.config.baseUrl,
      verbose: this.config.verbose,
      timeout: this.config.timeout
    });
    
    this.testData = new TestData();
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: null,
      endTime: null,
      tests: []
    };
    
    this.currentSuite = null;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
  }

  /**
   * Define a test suite
   */
  describe(suiteName, suiteFunction) {
    this.currentSuite = suiteName;
    console.log(`\n📋 ${suiteName}`);
    console.log('─'.repeat(50));
    
    // Reset hooks for this suite
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    
    suiteFunction();
    this.currentSuite = null;
  }

  /**
   * Define a test case
   */
  async it(testName, testFunction, options = {}) {
    const test = {
      suite: this.currentSuite,
      name: testName,
      status: 'pending',
      error: null,
      duration: 0,
      startTime: Date.now()
    };
    
    this.results.total++;
    
    try {
      // Setup
      if (this.config.cleanupBetweenTests) {
        await this.testData.cleanup();
      }
      
      // Run beforeEach hooks
      for (const hook of this.beforeEachHooks) {
        await hook();
      }
      
      // Run the test
      const testContext = {
        client: this.client,
        data: this.testData,
        expect,
        skip: () => { throw new Error('SKIP_TEST'); }
      };
      
      await testFunction.call(testContext, testContext);
      
      // Run afterEach hooks
      for (const hook of this.afterEachHooks) {
        await hook();
      }
      
      test.status = 'passed';
      test.duration = Date.now() - test.startTime;
      this.results.passed++;
      
      console.log(`  ✅ ${testName} (${test.duration}ms)`);
      
    } catch (error) {
      test.duration = Date.now() - test.startTime;
      
      if (error.message === 'SKIP_TEST') {
        test.status = 'skipped';
        this.results.skipped++;
        console.log(`  ⏭️  ${testName} (skipped)`);
      } else {
        test.status = 'failed';
        test.error = error.message;
        this.results.failed++;
        console.log(`  ❌ ${testName} (${test.duration}ms)`);
        console.log(`     ${error.message}`);
        
        if (this.config.stopOnFailure) {
          throw error;
        }
      }
    }
    
    this.results.tests.push(test);
  }

  /**
   * Hook functions
   */
  beforeEach(hookFunction) {
    this.beforeEachHooks.push(hookFunction);
  }

  afterEach(hookFunction) {
    this.afterEachHooks.push(hookFunction);
  }

  beforeAll(hookFunction) {
    this.beforeAllHooks.push(hookFunction);
  }

  afterAll(hookFunction) {
    this.afterAllHooks.push(hookFunction);
  }

  /**
   * Run a test file
   */
  async runFile(testFilePath) {
    console.log(`\n🧪 Running tests from: ${testFilePath}`);
    
    // Run beforeAll hooks
    for (const hook of this.beforeAllHooks) {
      await hook();
    }
    
    try {
      // Set this runner as the global runner before loading the test file
      setGlobalRunner(this);
      
      // Clear require cache to ensure fresh test loading
      delete require.cache[require.resolve(testFilePath)];
      
      const testModule = require(testFilePath);
      if (typeof testModule === 'function') {
        await testModule(this);
      }
    } catch (error) {
      console.error(`❌ Failed to load test file: ${error.message}`);
      throw error;
    }
    
    // Run afterAll hooks
    for (const hook of this.afterAllHooks) {
      await hook();
    }
  }

  /**
   * Run multiple test files
   */
  async runFiles(testFilePaths) {
    this.results.startTime = Date.now();
    
    // Verify engine is running
    console.log('🔍 Checking engine availability...');
    const healthy = await this.client.waitForService(10, 1000);
    if (!healthy) {
      throw new Error('❌ Engine is not running! Please start it first.');
    }
    console.log('✅ Engine is running');
    
    for (const filePath of testFilePaths) {
      try {
        await this.runFile(filePath);
      } catch (error) {
        if (this.config.stopOnFailure) {
          break;
        }
      }
    }
    
    this.results.endTime = Date.now();
    this.printSummary();
    
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    const duration = this.results.endTime - this.results.startTime;
    const passRate = this.results.total > 0 
      ? Math.round((this.results.passed / this.results.total) * 100) 
      : 0;
    
    console.log('\n🎯 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(test => {
          console.log(`  • ${test.suite ? test.suite + ' > ' : ''}${test.name}: ${test.error}`);
        });
    }
    
    const success = this.results.failed === 0;
    console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
    
    return success;
  }

  /**
   * Export results to JSON
   */
  exportResults(filePath) {
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
    console.log(`📁 Results exported to: ${filePath}`);
  }
}

// Global runner management
let globalRunner = null;

function setGlobalRunner(runner) {
  globalRunner = runner;
}

function setRunner(runner) {
  globalRunner = runner;
}

function describe(suiteName, suiteFunction) {
  if (!globalRunner) {
    throw new Error('No test runner set. Use setRunner() first.');
  }
  return globalRunner.describe(suiteName, suiteFunction);
}

function it(testName, testFunction, options) {
  if (!globalRunner) {
    throw new Error('No test runner set. Use setRunner() first.');
  }
  return globalRunner.it(testName, testFunction, options);
}

function beforeEach(hookFunction) {
  if (!globalRunner) {
    throw new Error('No test runner set. Use setRunner() first.');
  }
  return globalRunner.beforeEach(hookFunction);
}

function afterEach(hookFunction) {
  if (!globalRunner) {
    throw new Error('No test runner set. Use setRunner() first.');
  }
  return globalRunner.afterEach(hookFunction);
}

function beforeAll(hookFunction) {
  if (!globalRunner) {
    throw new Error('No test runner set. Use setRunner() first.');
  }
  return globalRunner.beforeAll(hookFunction);
}

function afterAll(hookFunction) {
  if (!globalRunner) {
    throw new Error('No test runner set. Use setRunner() first.');
  }
  return globalRunner.afterAll(hookFunction);
}

module.exports = {
  TestRunner,
  setRunner,
  setGlobalRunner,
  describe,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll
};
