const http = require('http');

console.log('🔧 Quick API Debug Test');
console.log('======================\n');

function quickTest(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`${path} -> ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('✅ Working');
        } else {
          console.log('❌ Failed');
          try {
            const response = JSON.parse(body);
            console.log('Error:', response.error);
          } catch (e) {
            console.log('Raw response:', body.substring(0, 100));
          }
        }
        console.log('---');
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log(`${path} -> Connection failed: ${e.message}`);
      console.log('---');
      resolve();
    });
  });
}

async function debugTest() {
  console.log('Testing various endpoints...\n');
  
  // Test working endpoint
  await quickTest('/health');
  
  // Test API endpoints in different ways
  await quickTest('/api/state');
  await quickTest('/api/state/');
  await quickTest('/api/state/test-player');
  await quickTest('/api/quests');
  await quickTest('/api/quests/test-player');
  await quickTest('/api/context/completions');
  await quickTest('/api/context/completions/test-player');
  
  console.log('🎯 Debug complete!');
}

debugTest().catch(console.error);
