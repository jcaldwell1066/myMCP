/**
 * Fixed API Test - Corrected for proper response structures
 * Quick verification that the API is functioning
 */

const http = require('http');

console.log('🚀 Fixed API Verification Test');
console.log('===============================\n');

// Test configuration
const API_BASE = 'http://localhost:3000';
const TIMEOUT = 10000;

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = res.statusCode < 300 ? JSON.parse(body || '{}') : { error: body };
          resolve({
            statusCode: res.statusCode,
            data: response,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: { error: 'Invalid JSON response', body },
            success: false
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Connection failed: ${e.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealth() {
  console.log('🏥 Testing Health Endpoint...');
  
  try {
    const response = await makeRequest('/health');
    
    if (response.success) {
      console.log('  ✅ Health endpoint responding');
      console.log(`  📊 Status: ${response.data.status}`);
      console.log(`  📦 Version: ${response.data.version}`);
      console.log(`  🎮 Active States: ${response.data.activeStates}`);
      console.log(`  🔌 WebSocket Connections: ${response.data.wsConnections}`);
      return true;
    } else {
      console.log(`  ❌ Health check failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Health check error: ${error.message}`);
    return false;
  }
}

async function testPlayerState() {
  console.log('\n👤 Testing Player State...');
  
  try {
    const response = await makeRequest('/api/state/test-player');
    
    if (response.success) {
      console.log('  ✅ Player state endpoint working');
      
      // Correct structure: response.data.data.player
      if (response.data && response.data.data && response.data.data.player) {
        const player = response.data.data.player;
        console.log(`  👤 Player: ${player.name}`);
        console.log(`  ⭐ Score: ${player.score}`);
        console.log(`  🎯 Level: ${player.level}`);
        console.log(`  📍 Location: ${player.location}`);
        console.log(`  ⚔️ Current Quest: ${player.currentQuest || 'None'}`);
        return true;
      } else {
        console.log('  ❌ Player data structure unexpected');
        return false;
      }
    } else {
      console.log(`  ❌ Player state failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Player state error: ${error.message}`);
    return false;
  }
}

async function testGameAction() {
  console.log('\n⚡ Testing Game Action (Set Score)...');
  
  try {
    const actionData = {
      type: 'SET_SCORE',
      payload: { score: 350 },
      playerId: 'test-player'
    };
    
    const response = await makeRequest('/api/actions/test-player', 'POST', actionData);
    
    if (response.success) {
      console.log('  ✅ Game action successful');
      
      // Correct structure: response.data.data.score
      if (response.data && response.data.data && response.data.data.score !== undefined) {
        console.log(`  📊 New Score: ${response.data.data.score}`);
        return true;
      } else {
        console.log('  ❌ Score data structure unexpected');
        return false;
      }
    } else {
      console.log(`  ❌ Game action failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Game action error: ${error.message}`);
    return false;
  }
}

async function testQuests() {
  console.log('\n🗡️ Testing Quest System...');
  
  try {
    const response = await makeRequest('/api/quests/test-player');
    
    if (response.success) {
      console.log('  ✅ Quest system working');
      
      // Correct structure: response.data.data
      if (response.data && response.data.data) {
        const questData = response.data.data;
        console.log(`  📋 Available Quests: ${questData.available ? questData.available.length : 0}`);
        console.log(`  ⚔️ Active Quest: ${questData.active ? questData.active.title : 'None'}`);
        console.log(`  ✅ Completed Quests: ${questData.completed ? questData.completed.length : 0}`);
        return true;
      } else {
        console.log('  ❌ Quest data structure unexpected');
        return false;
      }
    } else {
      console.log(`  ❌ Quest system failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Quest system error: ${error.message}`);
    return false;
  }
}

async function testChat() {
  console.log('\n💬 Testing Chat System...');
  
  try {
    const chatData = {
      type: 'CHAT',
      payload: { message: 'Hello! What should I do next?' },
      playerId: 'test-player'
    };
    
    const response = await makeRequest('/api/actions/test-player', 'POST', chatData);
    
    if (response.success) {
      console.log('  ✅ Chat system working');
      
      // Correct structure: response.data.data.botResponse
      if (response.data && response.data.data && response.data.data.botResponse) {
        const botResponse = response.data.data.botResponse;
        console.log(`  🤖 Bot Response: "${botResponse.message.substring(0, 100)}..."`);
        console.log(`  🔧 LLM Provider: ${botResponse.metadata.provider}`);
        return true;
      } else {
        console.log('  ❌ Chat response structure unexpected');
        return false;
      }
    } else {
      console.log(`  ❌ Chat system failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Chat system error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  const startTime = Date.now();
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Player State', fn: testPlayerState },
    { name: 'Game Actions', fn: testGameAction },
    { name: 'Quest System', fn: testQuests },
    { name: 'Chat System', fn: testChat }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} error: ${error.message}`);
      failed++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  const total = passed + failed;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log('\n🎯 Test Results Summary');
  console.log('========================');
  console.log(`📊 Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  console.log(`⏱️ Duration: ${duration}s`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your API is working correctly! 🚀');
    console.log('\n📋 API Status Summary:');
    console.log('   ✅ Health endpoint - Working');
    console.log('   ✅ Player state management - Working');
    console.log('   ✅ Game actions (score setting) - Working');
    console.log('   ✅ Quest system - Working');
    console.log('   ✅ Chat system with LLM - Working');
    console.log('\n🎯 Your myMCP Engine is ready for production use!');
  } else {
    console.log(`\n⚠️ ${failed} TEST(S) FAILED. Check the output above for details.`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Auto-run if called directly
if (require.main === module) {
  console.log('🔍 Checking if myMCP Engine is running...\n');
  runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
