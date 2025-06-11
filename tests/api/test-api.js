const http = require('http');

console.log('🧪 myMCP Engine API Test Suite');
console.log('================================\n');

function testAPI(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`${method} ${path}`);
          console.log(`Status: ${res.statusCode}`);
          if (res.statusCode < 400) {
            console.log('✅ Success');
            if (response.data) {
              console.log('Data preview:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
            }
          } else {
            console.log('❌ Error:', response.error);
          }
          console.log('---');
          resolve(response);
        } catch (e) {
          console.log(`${method} ${path}: ${res.statusCode} (non-JSON response)`);
          console.log('Response:', body.substring(0, 200));
          console.log('---');
          resolve(body);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`${method} ${path}`);
      console.log('❌ Connection failed:', e.message);
      console.log('---');
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing Engine Health...');
  try {
    await testAPI('/health');
  } catch (e) {
    console.log('🚨 Engine is not running! Start it with: npm start');
    return;
  }

  console.log('🎮 Testing Game State Management...');
  await testAPI('/api/state/test-hero');

  console.log('⚡ Testing Game Actions...');
  
  // Set score
  await testAPI('/api/actions/test-hero', 'POST', {
    type: 'SET_SCORE',
    payload: { score: 150 },
    playerId: 'test-hero'
  });

  // Chat interaction
  await testAPI('/api/actions/test-hero', 'POST', {
    type: 'CHAT',
    payload: { message: 'Hello! What adventures await me?' },
    playerId: 'test-hero'
  });

  console.log('🗡️ Testing Quest System...');
  
  // Get available quests
  await testAPI('/api/quests/test-hero');

  // Start the global meeting quest
  await testAPI('/api/actions/test-hero', 'POST', {
    type: 'START_QUEST',
    payload: { questId: 'global-meeting' },
    playerId: 'test-hero'
  });

  console.log('🎯 Testing Context Completions...');
  await testAPI('/api/context/completions/test-hero?prefix=quest');

  console.log('📊 Final State Check...');
  await testAPI('/api/state/test-hero');

  console.log('\n🎉 All tests completed!');
  console.log('\n🚀 Engine is ready for CLI integration (Task 5)!');
}

// Auto-run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPI, runTests };
