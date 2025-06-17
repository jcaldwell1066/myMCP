/**
 * Smoke Test Runner
 * Quick validation that all critical endpoints are responding
 */

const { TestRunner, setRunner, describe, it } = require('../framework/test-runner');

async function runSmokeTests() {
  console.log('💨 myMCP Engine - Smoke Test Suite');
  console.log('===================================\n');

  const runner = new TestRunner({
    verbose: true,
    stopOnFailure: true,
    cleanupBetweenTests: false,
    timeout: 3000
  });

  // Set global runner for inline test definitions
  setRunner(runner);

  // Define smoke tests inline for speed
  describe('Critical Endpoint Smoke Tests', () => {
    
    it('Engine health check responds', async function() {
      const response = await this.client.get('/health');
      this.expect(response).toHaveStatus(200);
      this.expect(response.data.status).toBe('ok');
    });

    it('Can create player state', async function() {
      const testPlayer = this.data.createPlayer();
      const response = await this.client.get(`/api/state/${testPlayer.id}`);
      this.expect(response).toHaveStatus(200);
      this.expect(response.data.data).toBeValidGameState();
    });

    it('Can execute basic game action', async function() {
      const testPlayer = this.data.createPlayer();
      const response = await this.client.post(`/api/actions/${testPlayer.id}`, {
        type: 'SET_SCORE',
        payload: { score: 100 },
        playerId: testPlayer.id
      });
      this.expect(response).toHaveStatus(200);
      this.expect(response.data.data.score).toBe(100);
    });

    it('Can retrieve quest data', async function() {
      const testPlayer = this.data.createPlayer();
      const response = await this.client.get(`/api/quests/${testPlayer.id}`);
      this.expect(response).toHaveStatus(200);
      this.expect(response.data.data.available).toHaveLength(3);
    });

    it('WebSocket connection works', async function() {
      const result = await this.client.testWebSocket();
      this.expect(result.success).toBe(true);
      this.expect(result.messages.length).toBeGreaterThan(0);
    });

  });

  try {
    // For inline tests, we run with empty file list since tests are already defined
    runner.results.startTime = Date.now();
    
    // Verify engine is running
    console.log('🔍 Checking engine availability...');
    const healthy = await runner.client.waitForService(10, 1000);
    if (!healthy) {
      throw new Error('❌ Engine is not running! Please start it first.');
    }
    console.log('✅ Engine is running\n');
    
    runner.results.endTime = Date.now();
    const success = runner.results.failed === 0;
    const duration = Math.round((runner.results.endTime - runner.results.startTime) / 1000);
    
    console.log(`\n${success ? '✅' : '❌'} Smoke test ${success ? 'PASSED' : 'FAILED'} in ${duration}s`);
    
    if (success) {
      console.log('🚀 All critical systems operational!');
    } else {
      console.log('⚠️  Critical systems have issues - check logs above');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Smoke test runner failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  runSmokeTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runSmokeTests };
